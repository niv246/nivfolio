const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const API_KEY = () => process.env.FINNHUB_API_KEY;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchFinnHub(endpoint, params = {}) {
  const url = new URL(`${FINNHUB_BASE}${endpoint}`);
  url.searchParams.set('token', API_KEY());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());

  if (res.status === 429) {
    await delay(1000);
    const retry = await fetch(url.toString());
    if (!retry.ok) throw new Error(`FinnHub rate limited: ${retry.status}`);
    return retry.json();
  }

  if (!res.ok) throw new Error(`FinnHub error: ${res.status}`);
  return res.json();
}

async function getQuote(ticker) {
  const data = await fetchFinnHub('/quote', { symbol: ticker });
  if (!data || data.c === 0 || data.d === null) return null;
  return {
    current_price: data.c,
    day_change: data.d,
    day_change_pct: data.dp,
    high: data.h,
    low: data.l,
    open_price: data.o,
    prev_close: data.pc,
    timestamp: data.t
  };
}

async function getProfile(ticker) {
  const data = await fetchFinnHub('/stock/profile2', { symbol: ticker });
  if (!data || !data.name) return null;
  return {
    ticker: data.ticker,
    name: data.name,
    sector: data.finnhubIndustry || 'Other',
    industry: data.finnhubIndustry || 'Other',
    logo_url: data.logo,
    market_cap: data.marketCapitalization
  };
}

async function searchSymbol(query) {
  const data = await fetchFinnHub('/search', { q: query });
  if (!data || !data.result) return [];
  return data.result
    .filter((r) => r.type === 'Common Stock')
    .slice(0, 10)
    .map((r) => ({ symbol: r.symbol, description: r.description }));
}

module.exports = { getQuote, getProfile, searchSymbol, delay };
