# Realtime Chat API (Notes App Decoy)

This is the backend for the decoy "Class 11 PCM Study Notes & Assignment Maker" app. It serves a dual purpose: handling standard CRUD operations for study notes, and managing a hidden, real-time WebSocket chat system for secure communication.

## Tech Stack
- **Node.js** & **Express**
- **PostgreSQL** (Database)
- **Socket.io** (Real-time communication)
- **node-cron** (Scheduled cleanup)
- **multer** (Media uploads)

## Features
- **Hidden Authentication:** Specific text triggers (`password - piyush` / `password - tannu`) in the frontend notes search bar act as login mechanisms.
- **Real-Time Chat:** Low latency messaging via Socket.io with typing indicators, read receipts (sent, delivered, seen), reactions, and editing/unsending capabilities.
- **Media Uploads:** Support for sharing images, videos, audio (Voice Notes), and documents.
- **Self-Destructing Messages:** A background cron job automatically deletes messages exactly 1 hour after they have been marked as 'seen'.
- **PostgreSQL Schema:** Optimized queries with timestamps and relations for clean database structure.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PiyushASSUDANI123/realtime-chat_backend.git
   cd realtime-chat_backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Configuration:**
   - Create a PostgreSQL database named `pcm_notes_chat`.
   - Run the schema file located in `db/schema.sql` to generate the required tables (`users`, `notes`, `messages`).
   - Create a `.env` file in the root directory:
     ```env
     PORT=5001
     DB_USER=postgres
     DB_PASSWORD=your_password
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=pcm_notes_chat
     ```

4. **Start the server:**
   ```bash
   node server.js
   ```
   The server will run on port 5001.

## Notes on Deployment
Make sure to configure SSL (HTTPS) for production so that the Socket.io connection isn't blocked by browsers due to mixed content. Keep the `uploads` directory writable for media storage.
