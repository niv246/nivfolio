const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { getQuote, getProfile, searchSymbol, delay } = require('../utils/finnhub');

// GET /api/prices/quote/:ticker — single quote with cache
router.get('/quote/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    // Check cache (5 min TTL)
    const { rows } = await pool.query(
      `SELECT * FROM price_cache WHERE ticker = $1 AND updated_at > NOW() - INTERVAL '5 minutes'`,
      [ticker]
    );
    if (rows.length > 0) return res.json(rows[0]);

    // Fetch from FinnHub
    const quote = await getQuote(ticker);
    if (!quote) return res.status(404).json({ error: `No data for ${ticker}` });

    // Upsert cache
    await pool.query(`
      INSERT INTO price_cache (ticker, current_price, day_change, day_change_pct, high, low, open_price, prev_close, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (ticker) DO UPDATE SET
        current_price = EXCLUDED.current_price, day_change = EXCLUDED.day_change,
        day_change_pct = EXCLUDED.day_change_pct, high = EXCLUDED.high, low = EXCLUDED.low,
        open_price = EXCLUDED.open_price, prev_close = EXCLUDED.prev_close, updated_at = NOW()
    `, [ticker, quote.current_price, quote.day_change, quote.day_change_pct, quote.high, quote.low, quote.open_price, quote.prev_close]);

    res.json({ ticker, ...quote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prices/refresh — refresh all held tickers
router.get('/refresh', async (req, res) => {
  try {
    const { rows: holdings } = await pool.query(`
      SELECT DISTINCT ticker FROM transactions WHERE user_id = 1
    `);

    const results = [];
    for (const { ticker } of holdings) {
      try {
        const quote = await getQuote(ticker);
        if (quote) {
          await pool.query(`
            INSERT INTO price_cache (ticker, current_price, day_change, day_change_pct, high, low, open_price, prev_close, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (ticker) DO UPDATE SET
              current_price = EXCLUDED.current_price, day_change = EXCLUDED.day_change,
              day_change_pct = EXCLUDED.day_change_pct, high = EXCLUDED.high, low = EXCLUDED.low,
              open_price = EXCLUDED.open_price, prev_close = EXCLUDED.prev_close, updated_at = NOW()
          `, [ticker, quote.current_price, quote.day_change, quote.day_change_pct, quote.high, quote.low, quote.open_price, quote.prev_close]);
          results.push({ ticker, ...quote });
        }
        await delay(200); // Rate limit
      } catch (err) {
        results.push({ ticker, error: err.message });
      }
    }

    // Save daily snapshot
    const { rows: statsRows } = await pool.query(`
      SELECT
        t.ticker,
        SUM(CASE WHEN t.type='buy' THEN t.quantity ELSE -t.quantity END) AS shares
      FROM transactions t WHERE t.user_id = 1
      GROUP BY t.ticker
      HAVING SUM(CASE WHEN t.type='buy' THEN t.quantity ELSE -t.quantity END) > 0
    `);

    let stocksValue = 0;
    for (const row of statsRows) {
      const { rows: priceRows } = await pool.query(
        `SELECT current_price FROM price_cache WHERE ticker = $1`, [row.ticker]
      );
      if (priceRows.length > 0) {
        stocksValue += parseFloat(row.shares) * parseFloat(priceRows[0].current_price);
      }
    }

    const { rows: cashRows } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount_usd ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'withdraw' THEN amount_usd ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'buy' THEN amount_usd ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN type = 'sell' THEN amount_usd ELSE 0 END), 0)
        AS cash_balance
      FROM cash_operations WHERE user_id = 1
    `);
    const cash = parseFloat(cashRows[0].cash_balance) || 0;

    const today = new Date().toISOString().split('T')[0];
    await pool.query(`
      INSERT INTO snapshots (user_id, date, total_value_usd, cash_usd)
      VALUES (1, $1, $2, $3)
      ON CONFLICT (user_id, date) DO UPDATE SET
        total_value_usd = EXCLUDED.total_value_usd, cash_usd = EXCLUDED.cash_usd
    `, [today, stocksValue + cash, cash]);

    res.json({ refreshed: results.length, prices: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prices/profile/:ticker
router.get('/profile/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    // Check cache (24h TTL)
    const { rows } = await pool.query(
      `SELECT * FROM company_profiles WHERE ticker = $1 AND updated_at > NOW() - INTERVAL '24 hours'`,
      [ticker]
    );
    if (rows.length > 0) return res.json(rows[0]);

    const profile = await getProfile(ticker);
    if (!profile) return res.status(404).json({ error: `No profile for ${ticker}` });

    await pool.query(`
      INSERT INTO company_profiles (ticker, name, sector, industry, logo_url, market_cap, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (ticker) DO UPDATE SET
        name = EXCLUDED.name, sector = EXCLUDED.sector, industry = EXCLUDED.industry,
        logo_url = EXCLUDED.logo_url, market_cap = EXCLUDED.market_cap, updated_at = NOW()
    `, [profile.ticker, profile.name, profile.sector, profile.industry, profile.logo_url, profile.market_cap]);

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prices/lookup/:ticker — combined quote + profile for smart ticker card
router.get('/lookup/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const cachedProfile = await pool.query(
      `SELECT * FROM company_profiles WHERE ticker = $1 AND updated_at > NOW() - INTERVAL '24 hours'`, [ticker]
    );
    const cachedPrice = await pool.query(
      `SELECT * FROM price_cache WHERE ticker = $1 AND updated_at > NOW() - INTERVAL '5 minutes'`, [ticker]
    );

    let profile = cachedProfile.rows[0] || null;
    let quote = cachedPrice.rows[0] || null;

    if (!profile) {
      const p = await getProfile(ticker);
      if (p) {
        await pool.query(
          `INSERT INTO company_profiles (ticker, name, sector, industry, logo_url, market_cap, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (ticker) DO UPDATE SET name=$2, sector=$3, industry=$4, logo_url=$5, market_cap=$6, updated_at=NOW()`,
          [ticker, p.name, p.sector, p.industry, p.logo_url, p.market_cap]
        );
        profile = p;
      }
    }

    if (!quote) {
      if (!cachedProfile.rows[0]) await delay(200);
      const q = await getQuote(ticker);
      if (q) {
        await pool.query(
          `INSERT INTO price_cache (ticker, current_price, day_change, day_change_pct, high, low, open_price, prev_close, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (ticker) DO UPDATE SET
             current_price=$2, day_change=$3, day_change_pct=$4, high=$5, low=$6, open_price=$7, prev_close=$8, updated_at=NOW()`,
          [ticker, q.current_price, q.day_change, q.day_change_pct, q.high, q.low, q.open_price, q.prev_close]
        );
        quote = q;
      }
    }

    if (!profile && !quote) return res.status(404).json({ error: 'Ticker not found' });

    res.json({
      ticker,
      name: profile?.name || ticker,
      sector: profile?.sector || 'Other',
      logo: profile?.logo_url || null,
      marketCap: profile?.market_cap || null,
      price: quote?.current_price ? parseFloat(quote.current_price) : null,
      change: quote?.day_change ? parseFloat(quote.day_change) : null,
      changePct: quote?.day_change_pct ? parseFloat(quote.day_change_pct) : null,
      high: quote?.high ? parseFloat(quote.high) : null,
      low: quote?.low ? parseFloat(quote.low) : null,
      prevClose: quote?.prev_close ? parseFloat(quote.prev_close) : null,
    });
  } catch (err) {
    console.error('Lookup error:', err);
    res.status(500).json({ error: 'Failed to fetch ticker data' });
  }
});

// GET /api/prices/search?q=
router.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);
  try {
    const results = await searchSymbol(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
