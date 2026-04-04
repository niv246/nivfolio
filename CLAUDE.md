# NivFolio

## Overview
Personal stock portfolio tracker with cash management, real-time prices (FinnHub),
and Notion-style UI. Built for a single user (Niv), deployable on Railway.

## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS v4 + Recharts
- Backend: Node.js + Express
- Database: PostgreSQL (Railway-managed, SSL required in production)
- External API: FinnHub (free tier, 60 req/min, 15-min delayed prices)
- Deployment: Railway (auto-deploy from GitHub main branch)

## Architecture
- Monorepo: /client (Vite React) + /server (Express)
- Server serves built client in production from client/dist/
- All FinnHub calls go through server (API key hidden from frontend)
- Price caching in DB (5-min TTL for quotes, 24h for profiles)
- Cash balance calculated from cash_operations table, never stored as a field
- cash_operations links to transactions via tx_id for buy/sell cash impact

## Key Business Rules
- Cash must cover buy transactions (reject with 400 if insufficient)
- Sell proceeds auto-add to cash via cash_operation record
- Deleting a transaction deletes its linked cash_operation (reverses cash impact)
- Holdings = aggregate of all buy/sell transactions per ticker (average cost method)
- Sector auto-detected from FinnHub company profile on first buy
- Monthly P&L = realized sell proceeds grouped by month
- Overall P&L = (stocks value + cash) - net deposits

## Common Commands
- `cd client && npm run dev` — start frontend dev server (port 5173, proxies /api to 3001)
- `cd server && node index.js` — start backend (port 3001, needs DATABASE_URL)
- `cd client && npm run build` — build client for production

## Architecture Decisions
- Tailwind v4 with @tailwindcss/vite plugin (no tailwind.config.js)
- cash_operations table tracks all cash movements including buy/sell links
- FinnHub wrapper with 200ms inter-call delay for rate limiting
- PostgreSQL SSL enabled in production via ssl: { rejectUnauthorized: false }
- Single Express server serves both API and static files in production

## Do's
- Always validate cash before processing buys
- Cache FinnHub responses (5 min for quotes, 24h for profiles)
- Add 200ms delay between sequential FinnHub calls
- Use parameterized queries for all SQL (prevent injection)
- Run migrations on every server start (they're idempotent)

## Don'ts
- Never expose FINNHUB_API_KEY to the frontend
- Never store cash balance as a single field (always calculate from cash_operations)
- Never call FinnHub directly from the client
- Never commit .env files
