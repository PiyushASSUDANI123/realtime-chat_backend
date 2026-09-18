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

// GET /api/messages/media — fetch all media for gallery
router.get('/media', async (req, res) => {
  try {
    const { userId, partnerId } = req.query;
    if (!userId || !partnerId) {
      return res.status(400).json({ error: 'userId and partnerId required' });
    }

    const query = `
      SELECT id, media_url, media_type, caption, sent_at
      FROM messages
      WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
        AND media_url IS NOT NULL
        AND is_view_once = false
      ORDER BY sent_at DESC
    `;
    const result = await pool.query(query, [userId, partnerId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching media:', err.message);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// DELETE /api/messages/clear — delete all chats
router.delete('/clear', async (req, res) => {
  try {
    const { userId, partnerId, deleteMedia } = req.body;
    if (!userId || !partnerId) {
      return res.status(400).json({ error: 'userId and partnerId required' });
    }

    if (deleteMedia) {
      // Find all media URLs
      const result = await pool.query(
        `SELECT media_url FROM messages 
         WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
         AND media_url IS NOT NULL`,
        [userId, partnerId]
      );
      
      const fs = require('fs');
      const path = require('path');
      result.rows.forEach(row => {
        if (row.media_url.startsWith('/api/media/')) {
          const filename = row.media_url.replace('/api/media/', '');
          const filepath = path.join(__dirname, '..', 'uploads', filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
      });
    }

    // Delete from DB
    await pool.query(
      `DELETE FROM messages 
       WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))`
       , [userId, partnerId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing chats:', err.message);
    res.status(500).json({ error: 'Failed to clear chats' });
  }
});

module.exports = router;
