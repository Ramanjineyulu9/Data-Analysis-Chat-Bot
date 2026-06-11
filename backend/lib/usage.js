const pool = require('./db');

async function checkAndIncrementUsage(userId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT plan, queries_this_month, last_reset_date FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return { allowed: false, reason: 'User not found' };

    const user = rows[0];
    
    // Check if reset is needed (rudimentary monthly reset logic)
    const lastReset = new Date(user.last_reset_date);
    const now = new Date();
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      await connection.query('UPDATE users SET queries_this_month = 0, last_reset_date = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
      user.queries_this_month = 0;
    }

    if (user.plan === 'free' && user.queries_this_month >= 100) {
      return { allowed: false, reason: 'Free tier limit reached. Please upgrade to Pro.' };
    }

    // Increment usage
    await connection.query('UPDATE users SET queries_this_month = queries_this_month + 1 WHERE id = ?', [userId]);
    return { allowed: true };
  } finally {
    connection.release();
  }
}

module.exports = { checkAndIncrementUsage };
