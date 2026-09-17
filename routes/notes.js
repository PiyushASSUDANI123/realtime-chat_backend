const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all notes (optionally filter by subject)
router.get('/', async (req, res) => {
  try {
    const { subject } = req.query;
    let query = 'SELECT * FROM notes';
    const params = [];

    if (subject) {
      query += ' WHERE subject = $1';
      params.push(subject);
    }

    query += ' ORDER BY updated_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET single note
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching note:', err.message);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST create new note
router.post('/', async (req, res) => {
  try {
    const { title, body, subject, chapter } = req.body;
    const result = await pool.query(
      `INSERT INTO notes (title, body, subject, chapter, updated_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [title || '', body || '', subject || 'physics', chapter || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating note:', err.message);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT update note (auto-save)
router.put('/:id', async (req, res) => {
  try {
    const { title, body, subject, chapter } = req.body;
    const result = await pool.query(
      `UPDATE notes SET 
        title = COALESCE($1, title), 
        body = COALESCE($2, body), 
        subject = COALESCE($3, subject), 
        chapter = COALESCE($4, chapter), 
        updated_at = NOW() 
       WHERE id = $5 
       RETURNING *`,
      [title, body, subject, chapter, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating note:', err.message);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE a note
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ message: 'Note deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting note:', err.message);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
