const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/messages?userId=1&cursor=123 — fetch messages with cursor pagination
router.get('/', async (req, res) => {
  try {
    const { userId, cursor } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let query = `
       SELECT m.*, 
              su.username as sender_username, 
              ru.username as receiver_username
       FROM messages m
       JOIN users su ON m.sender_id = su.id
       JOIN users ru ON m.receiver_id = ru.id
       WHERE (m.sender_id = $1 OR m.receiver_id = $1)
    `;
    
    const params = [userId];

    if (cursor) {
      query += ` AND m.id < $2 `;
      params.push(cursor);
    }

    query += ` ORDER BY m.id DESC LIMIT 50`;

    const result = await pool.query(query, params);
    
    // Return in ASC order for chat UI
    res.json(result.rows.reverse());
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
