const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/prices', require('./routes/prices'));
app.use('/api/snapshots', require('./routes/snapshots'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// Run migrations then start
const { runMigrations } = require('./db/migrations');
const PORT = process.env.PORT || 3001;

runMigrations().then(() => {
  app.listen(PORT, () => console.log(`NivFolio API running on port ${PORT}`));
}).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
