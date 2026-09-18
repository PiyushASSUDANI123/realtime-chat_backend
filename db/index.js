const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'pcm_notes_chat',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

// Auto-migrate to add is_view_once if missing (for production)
pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_view_once BOOLEAN DEFAULT false;')
  .then(() => console.log('✅ Database auto-migration completed: is_view_once column verified.'))
  .catch(err => console.error('❌ Failed to run auto-migration:', err.message));

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

module.exports = pool;
