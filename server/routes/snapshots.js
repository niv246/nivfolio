const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/snapshots
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT date, total_value_usd, cash_usd FROM snapshots WHERE user_id = 1 ORDER BY date ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
