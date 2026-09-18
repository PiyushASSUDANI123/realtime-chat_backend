-- PCM Notes + Chat Database Schema

-- Drop tables if exist (for fresh setup)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (only 2 fixed users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    secret_phrase VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notes table (fully functional notes app)
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) DEFAULT '',
    body TEXT DEFAULT '',
    subject VARCHAR(50) DEFAULT 'physics',
    chapter VARCHAR(100) DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table (auto-delete after 24hrs)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT,
    media_url VARCHAR(500),
    media_type VARCHAR(20),
    caption TEXT,
    status VARCHAR(20) DEFAULT 'sent',
    is_edited BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '{}'::jsonb,
    is_view_once BOOLEAN DEFAULT false,
    seen_at TIMESTAMP,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast cleanup queries
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_notes_subject ON notes(subject);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);

-- Seed the 2 users
INSERT INTO users (username, secret_phrase) VALUES
    ('piyush', 'password - piyush'),
    ('tannu', 'password - tannu');
