const pool = require('../db');

// Track online users: { socketId: { userId, username } }
const onlineUsers = new Map();

function setupChatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user_online', async ({ userId, username }) => {
      onlineUsers.set(socket.id, { userId, username });
      
      // Update delivered status for messages sent to this user that were 'sent'
      try {
        await pool.query(
          `UPDATE messages SET status = 'delivered' WHERE receiver_id = $1 AND status = 'sent'`,
          [userId]
        );
        // Broadcast update
        socket.broadcast.emit('messages_delivered', { userId });
      } catch (e) {
        console.error('Failed to update delivery status:', e.message);
      }

      // Broadcast online status to all clients
      io.emit('online_status', {
        userId,
        username,
        isOnline: true,
        onlineUsers: Array.from(onlineUsers.values()),
      });
      console.log(`✅ ${username} is online`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, messageText, mediaUrl, mediaType, caption } = data;

        // Check if receiver is online to mark as delivered
        const isReceiverOnline = Array.from(onlineUsers.values()).some(u => u.userId === receiverId);
        const status = isReceiverOnline ? 'delivered' : 'sent';

        // Save to database
        const result = await pool.query(
          `INSERT INTO messages (sender_id, receiver_id, message_text, media_url, media_type, caption, status, sent_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
           RETURNING *`,
          [senderId, receiverId, messageText || null, mediaUrl || null, mediaType || null, caption || null, status]
        );

        const savedMessage = result.rows[0];

        // Get sender and receiver usernames
        const usersResult = await pool.query(
          'SELECT id, username FROM users WHERE id IN ($1, $2)',
          [senderId, receiverId]
        );
        const usersMap = {};
        usersResult.rows.forEach(u => { usersMap[u.id] = u.username; });

        const messageWithNames = {
          ...savedMessage,
          sender_username: usersMap[senderId],
          receiver_username: usersMap[receiverId],
        };

        // Emit to all connected clients (both sender and receiver will filter)
        io.emit('receive_message', messageWithNames);

      } catch (err) {
        console.error('Error saving message:', err.message);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Mark messages as seen
    socket.on('mark_seen', async ({ messageIds, userId }) => {
      if (!messageIds || messageIds.length === 0) return;
      try {
        await pool.query(
          `UPDATE messages SET status = 'seen', seen_at = NOW() WHERE id = ANY($1) AND receiver_id = $2 AND status != 'seen'`,
          [messageIds, userId]
        );
        io.emit('messages_seen', { messageIds, userId });
      } catch (e) {
        console.error('Failed to mark seen:', e.message);
      }
    });

    // Edit message
    socket.on('edit_message', async ({ messageId, newText, userId }) => {
      try {
        const result = await pool.query(
          `UPDATE messages SET message_text = $1, is_edited = true WHERE id = $2 AND sender_id = $3 RETURNING *`,
          [newText, messageId, userId]
        );
        if (result.rowCount > 0) {
          io.emit('message_edited', { messageId, newText, isEdited: true });
        }
      } catch (e) {
        console.error('Failed to edit message:', e.message);
      }
    });

    // Delete message (Unsend)
    socket.on('delete_message', async ({ messageId, userId }) => {
      try {
        const result = await pool.query(
          `DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id`,
          [messageId, userId]
        );
        if (result.rowCount > 0) {
          io.emit('message_deleted', { messageId });
        }
      } catch (e) {
        console.error('Failed to delete message:', e.message);
      }
    });

    // React to message
    socket.on('react_message', async ({ messageId, reaction, username }) => {
      try {
        // Fetch current reactions
        const msgRes = await pool.query(`SELECT reactions FROM messages WHERE id = $1`, [messageId]);
        if (msgRes.rowCount === 0) return;
        
        let reactions = msgRes.rows[0].reactions || {};
        
        // Toggle reaction
        if (reactions[username] === reaction) {
          delete reactions[username];
        } else {
          reactions[username] = reaction;
        }

        await pool.query(
          `UPDATE messages SET reactions = $1 WHERE id = $2`,
          [reactions, messageId]
        );
        
        io.emit('message_reacted', { messageId, reactions });
      } catch (e) {
        console.error('Failed to react:', e.message);
      }
    });

    // Typing indicator
    socket.on('typing', ({ userId, username, isTyping }) => {
      socket.broadcast.emit('typing_status', { userId, username, isTyping });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        onlineUsers.delete(socket.id);
        io.emit('online_status', {
          userId: user.userId,
          username: user.username,
          isOnline: false,
          onlineUsers: Array.from(onlineUsers.values()),
        });
        console.log(`❌ ${user.username} disconnected`);
      }
    });
  });
}

module.exports = { setupChatSocket };
