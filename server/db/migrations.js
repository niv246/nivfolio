const pool = require('./connection');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) DEFAULT 'Niv',
  base_currency VARCHAR(3) DEFAULT 'USD',
  ils_rate DECIMAL(10,4) DEFAULT 3.6000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (id, name) VALUES (1, 'Niv') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS cash_operations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) DEFAULT 1,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit','withdraw','buy','sell')),
  amount_usd DECIMAL(14,2) NOT NULL,
  original_amount DECIMAL(14,2),
  original_currency VARCHAR(3) DEFAULT 'USD',
  ticker VARCHAR(10),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  tx_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) DEFAULT 1,
  ticker VARCHAR(10) NOT NULL,
  type VARCHAR(4) NOT NULL CHECK (type IN ('buy','sell')),
  quantity DECIMAL(14,4) NOT NULL,
  price DECIMAL(14,4) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  sector VARCHAR(50) DEFAULT 'Other',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_cache (
  ticker VARCHAR(10) PRIMARY KEY,
  current_price DECIMAL(14,4),
  day_change DECIMAL(10,4),
  day_change_pct DECIMAL(10,4),
  high DECIMAL(14,4),
  low DECIMAL(14,4),
  open_price DECIMAL(14,4),
  prev_close DECIMAL(14,4),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) DEFAULT 1,
  date DATE NOT NULL,
  total_value_usd DECIMAL(14,2),
  cash_usd DECIMAL(14,2),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS company_profiles (
  ticker VARCHAR(10) PRIMARY KEY,
  name VARCHAR(200),
  sector VARCHAR(100),
  industry VARCHAR(100),
  logo_url TEXT,
  market_cap DECIMAL(20,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function runMigrations() {
  try {
    await pool.query(schema);
    console.log('Migrations completed successfully');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  }
}

module.exports = { runMigrations };
