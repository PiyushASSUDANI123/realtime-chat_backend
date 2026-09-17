const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/auth/login — validate secret phrase
router.post('/login', async (req, res) => {
  try {
    const { phrase } = req.body;

    if (!phrase) {
      return res.status(400).json({ error: 'Phrase is required' });
    }

    const result = await pool.query(
      'SELECT id, username FROM users WHERE secret_phrase = $1',
      [phrase.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid phrase' });
    }

    const user = result.rows[0];

    // Get the other user's ID for chat
    const otherUser = await pool.query(
      'SELECT id, username FROM users WHERE id != $1',
      [user.id]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
      chatPartner: otherUser.rows[0] || null,
    });
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;
