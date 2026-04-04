# NivFolio API Reference

Base URL: `/api`

## Health Check
`GET /api/health` → `{ status: "ok", timestamp: "..." }`

## Portfolio

### Holdings
`GET /api/portfolio/holdings`
Returns aggregated holdings with cached prices.

### Stats
`GET /api/portfolio/stats`
Returns portfolio summary: total value, P&L, daily change, cash.

### Cash
`GET /api/portfolio/cash`
Returns cash balance and all cash operations history.

### Add Transaction
`POST /api/portfolio/transaction`
Body: `{ ticker, type: "buy"|"sell", quantity, price, currency?, date?, sector? }`
- Buy: rejects if cash < total cost
- Sell: rejects if insufficient shares
- Auto-detects sector from FinnHub on first buy

### Delete Transaction
`DELETE /api/portfolio/transaction/:id`
Deletes transaction and reverses cash impact.

### Cash Operation
`POST /api/portfolio/cash`
Body: `{ type: "deposit"|"withdraw", amount, currency?, note? }`

### Settings
`GET /api/portfolio/settings`
`PUT /api/portfolio/settings`
Body: `{ base_currency?, ils_rate? }`

## Prices

### Quote
`GET /api/prices/quote/:ticker`
Returns cached price (5-min TTL) or fetches from FinnHub.

### Refresh All
`GET /api/prices/refresh`
Refreshes prices for all held tickers, saves daily snapshot.

### Company Profile
`GET /api/prices/profile/:ticker`
Returns cached profile (24h TTL) or fetches from FinnHub.

### Symbol Search
`GET /api/prices/search?q=apple`
Returns matching stock symbols from FinnHub.

## Snapshots
`GET /api/snapshots`
Returns all daily portfolio value snapshots for performance chart.
