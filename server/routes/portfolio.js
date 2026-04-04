const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { getProfile } = require('../utils/finnhub');

// Compute cash balance from cash_operations
async function getCashBalance(userId = 1) {
  const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount_usd ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN type = 'withdraw' THEN amount_usd ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN type = 'buy' THEN amount_usd ELSE 0 END), 0) +
      COALESCE(SUM(CASE WHEN type = 'sell' THEN amount_usd ELSE 0 END), 0)
      AS cash_balance
    FROM cash_operations WHERE user_id = $1
  `, [userId]);
  return parseFloat(rows[0].cash_balance) || 0;
}

// GET /api/portfolio/holdings — aggregated from transactions
router.get('/holdings', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        ticker, sector,
        SUM(CASE WHEN type='buy' THEN quantity ELSE -quantity END) AS shares,
        SUM(CASE WHEN type='buy' THEN quantity * price ELSE 0 END) AS total_cost,
        SUM(CASE WHEN type='buy' THEN quantity ELSE 0 END) AS total_bought
      FROM transactions WHERE user_id = 1
      GROUP BY ticker, sector
      HAVING SUM(CASE WHEN type='buy' THEN quantity ELSE -quantity END) > 0
    `);

    const holdings = rows.map((r) => ({
      ticker: r.ticker,
      sector: r.sector,
      shares: parseFloat(r.shares),
      avgCost: r.total_bought > 0 ? parseFloat(r.total_cost) / parseFloat(r.total_bought) : 0,
      totalCost: parseFloat(r.total_cost)
    }));

    // Attach cached prices
    if (holdings.length > 0) {
      const tickers = holdings.map((h) => h.ticker);
      const { rows: prices } = await pool.query(
        `SELECT ticker, current_price, day_change_pct FROM price_cache WHERE ticker = ANY($1)`,
        [tickers]
      );
      const priceMap = {};
      prices.forEach((p) => { priceMap[p.ticker] = p; });

      holdings.forEach((h) => {
        const p = priceMap[h.ticker];
        if (p) {
          h.currentPrice = parseFloat(p.current_price);
          h.dayChangePct = parseFloat(p.day_change_pct);
          h.marketValue = h.shares * h.currentPrice;
          h.pnl = h.marketValue - (h.shares * h.avgCost);
          h.pnlPct = h.avgCost > 0 ? ((h.currentPrice - h.avgCost) / h.avgCost) * 100 : 0;
        }
      });
    }

    res.json(holdings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/stats
router.get('/stats', async (req, res) => {
  try {
    const cash = await getCashBalance();

    const { rows } = await pool.query(`
      SELECT
        ticker,
        SUM(CASE WHEN type='buy' THEN quantity ELSE -quantity END) AS shares,
        SUM(CASE WHEN type='buy' THEN quantity * price ELSE 0 END) AS total_cost,
        SUM(CASE WHEN type='buy' THEN quantity ELSE 0 END) AS total_bought
      FROM transactions WHERE user_id = 1
      GROUP BY ticker
      HAVING SUM(CASE WHEN type='buy' THEN quantity ELSE -quantity END) > 0
    `);

    let totalValue = 0;
    let totalCost = 0;
    let dailyChange = 0;

    if (rows.length > 0) {
      const tickers = rows.map((r) => r.ticker);
      const { rows: prices } = await pool.query(
        `SELECT ticker, current_price, day_change, prev_close FROM price_cache WHERE ticker = ANY($1)`,
        [tickers]
      );
      const priceMap = {};
      prices.forEach((p) => { priceMap[p.ticker] = p; });

      rows.forEach((r) => {
        const shares = parseFloat(r.shares);
        const avgCost = r.total_bought > 0 ? parseFloat(r.total_cost) / parseFloat(r.total_bought) : 0;
        totalCost += shares * avgCost;
        const p = priceMap[r.ticker];
        if (p) {
          totalValue += shares * parseFloat(p.current_price);
          dailyChange += shares * parseFloat(p.day_change || 0);
        }
      });
    }

    // Net deposits = deposits - withdrawals
    const { rows: depRows } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount_usd ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'withdraw' THEN amount_usd ELSE 0 END), 0)
        AS net_deposits
      FROM cash_operations WHERE user_id = 1 AND type IN ('deposit','withdraw')
    `);
    const netDeposits = parseFloat(depRows[0].net_deposits) || 0;

    const portfolioValue = totalValue + cash;
    const overallPnl = portfolioValue - netDeposits;
    const overallPnlPct = netDeposits > 0 ? (overallPnl / netDeposits) * 100 : 0;

    res.json({
      totalValue: totalValue,
      totalCost,
      cash,
      portfolioValue,
      dailyChange,
      dailyChangePct: totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0,
      stocksPnl: totalValue - totalCost,
      stocksPnlPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      overallPnl,
      overallPnlPct,
      netDeposits
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/cash
router.get('/cash', async (req, res) => {
  try {
    const balance = await getCashBalance();
    const { rows } = await pool.query(
      `SELECT * FROM cash_operations WHERE user_id = 1 ORDER BY date DESC, created_at DESC`
    );
    res.json({ balance, operations: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/transaction
router.post('/transaction', async (req, res) => {
  const { ticker, type, quantity, price, currency = 'USD', date, sector } = req.body;

  if (!ticker || !type || !quantity || !price) {
    return res.status(400).json({ error: 'Missing required fields: ticker, type, quantity, price' });
  }

  const totalCost = parseFloat(quantity) * parseFloat(price);

  try {
    // For buys, check cash
    if (type === 'buy') {
      const cash = await getCashBalance();
      if (cash < totalCost) {
        return res.status(400).json({
          error: `Insufficient cash. Available: $${cash.toFixed(2)}, Required: $${totalCost.toFixed(2)}`
        });
      }
    }

    // For sells, check shares
    if (type === 'sell') {
      const { rows } = await pool.query(`
        SELECT COALESCE(SUM(CASE WHEN type='buy' THEN quantity ELSE -quantity END), 0) AS shares
        FROM transactions WHERE user_id = 1 AND ticker = $1
      `, [ticker]);
      const available = parseFloat(rows[0].shares);
      if (available < parseFloat(quantity)) {
        return res.status(400).json({
          error: `Insufficient shares. Available: ${available}, Requested: ${quantity}`
        });
      }
    }

    // Auto-detect sector from FinnHub if not provided
    let finalSector = sector || 'Other';
    if (!sector || sector === 'Other') {
      try {
        const profile = await getProfile(ticker);
        if (profile && profile.sector) {
          finalSector = profile.sector;
          // Cache the profile
          await pool.query(`
            INSERT INTO company_profiles (ticker, name, sector, industry, logo_url, market_cap)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (ticker) DO UPDATE SET
              name = EXCLUDED.name, sector = EXCLUDED.sector, industry = EXCLUDED.industry,
              logo_url = EXCLUDED.logo_url, market_cap = EXCLUDED.market_cap, updated_at = NOW()
          `, [profile.ticker, profile.name, profile.sector, profile.industry, profile.logo_url, profile.market_cap]);
        }
      } catch (_) { /* ignore profile fetch errors */ }
    }

    // Insert transaction
    const { rows: txRows } = await pool.query(`
      INSERT INTO transactions (ticker, type, quantity, price, currency, sector, date, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      RETURNING *
    `, [ticker.toUpperCase(), type, quantity, price, currency, finalSector, date || new Date().toISOString().split('T')[0]]);

    const tx = txRows[0];

    // Create cash_operation linked to this transaction
    await pool.query(`
      INSERT INTO cash_operations (type, amount_usd, ticker, date, tx_id, user_id, note)
      VALUES ($1, $2, $3, $4, $5, 1, $6)
    `, [type, totalCost, ticker.toUpperCase(), tx.date, tx.id, `${type} ${quantity} ${ticker.toUpperCase()} @ $${price}`]);

    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/transaction/:id
router.delete('/transaction/:id', async (req, res) => {
  try {
    // Delete linked cash operations first
    await pool.query(`DELETE FROM cash_operations WHERE tx_id = $1`, [req.params.id]);
    const { rows } = await pool.query(`DELETE FROM transactions WHERE id = $1 RETURNING *`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ deleted: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/cash — deposit or withdraw
router.post('/cash', async (req, res) => {
  const { type, amount, currency = 'USD', date, note } = req.body;
  if (!type || !amount || !['deposit', 'withdraw'].includes(type)) {
    return res.status(400).json({ error: 'type (deposit/withdraw) and amount required' });
  }

  try {
    if (type === 'withdraw') {
      const cash = await getCashBalance();
      if (cash < parseFloat(amount)) {
        return res.status(400).json({
          error: `Insufficient cash. Available: $${cash.toFixed(2)}`
        });
      }
    }

    const { rows } = await pool.query(`
      INSERT INTO cash_operations (type, amount_usd, original_amount, original_currency, date, note, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, 1)
      RETURNING *
    `, [type, amount, amount, currency, date || new Date().toISOString().split('T')[0], note || null]);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/portfolio/settings
router.put('/settings', async (req, res) => {
  const { base_currency, ils_rate } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE users SET
        base_currency = COALESCE($1, base_currency),
        ils_rate = COALESCE($2, ils_rate)
      WHERE id = 1 RETURNING *
    `, [base_currency, ils_rate]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/settings
router.get('/settings', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE id = 1`);
    res.json(rows[0] || { base_currency: 'USD', ils_rate: 3.6 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
