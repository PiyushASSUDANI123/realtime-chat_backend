const cron = require('node-cron');
const pool = require('../db');

function startCleanupCron() {
    // Run every 15 minutes — delete messages where seen_at is older than 1 hour
    // Media files on disk are NOT deleted (only the message row is removed)
    cron.schedule('*/15 * * * *', async () => {
      try {
        const result = await pool.query(
          `DELETE FROM messages 
           WHERE seen_at < NOW() - INTERVAL '1 hour' 
           RETURNING id, media_url`
        );

      if (result.rowCount > 0) {
        console.log(`🧹 Cleaned up ${result.rowCount} expired messages`);
        // Log media URLs that were in deleted messages (media files stay on disk)
        const mediaMessages = result.rows.filter(r => r.media_url);
        if (mediaMessages.length > 0) {
          console.log(`📎 ${mediaMessages.length} messages had media (files kept on disk)`);
        }
      }
    } catch (err) {
      console.error('❌ Cleanup cron error:', err.message);
    }
  });

  console.log('⏰ Cleanup cron scheduled (every 15 minutes)');
}

module.exports = { startCleanupCron };
