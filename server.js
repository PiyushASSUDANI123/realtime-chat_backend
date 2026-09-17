const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const notesRoutes = require('./routes/notes');
const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const { setupChatSocket } = require('./socket/chatHandler');
const { startCleanupCron } = require('./cron/cleanup');

const app = express();
const server = http.createServer(app);

const allowedOrigins = ['http://localhost:5173', 'https://chat.tiflo.in'];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media securely (no directory listing)
app.use('/api/media', express.static(path.resolve(uploadDir), {
  dotfiles: 'deny',
  index: false,
}));

// API Routes
app.use('/api/notes', notesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Socket.io
setupChatSocket(io);

// Start cleanup cron
startCleanupCron();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🗂️  Uploads dir: ${path.resolve(uploadDir)}`);
});
