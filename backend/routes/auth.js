const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../lib/db');

const router = express.Router();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback'
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      const email = profile.emails[0].value;
      const connection = await pool.getConnection();
      
      const [rows] = await connection.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [profile.id, email]);
      let user;

      if (rows.length > 0) {
        user = rows[0];
        // Ensure google_id is set if they signed up previously without it
        if (!user.google_id) {
          await connection.query('UPDATE users SET google_id = ?, avatar = ? WHERE id = ?', [profile.id, profile.photos[0].value, user.id]);
        }
      } else {
        const userId = crypto.randomUUID();
        await connection.query('INSERT INTO users (id, email, name, avatar, google_id) VALUES (?, ?, ?, ?, ?)', 
          [userId, email, profile.displayName, profile.photos[0].value, profile.id]);
        const [newRows] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
        user = newRows[0];
      }
      
      connection.release();
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), async (req, res) => {
  const token = jwt.sign(
    { id: req.user.id, email: req.user.email, plan: req.user.plan },
    process.env.JWT_SECRET || 'supersecretjwt',
    { expiresIn: '7d' }
  );

  const connection = await pool.getConnection();
  await connection.query('INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', 
    [crypto.randomUUID(), req.user.id, token]);
  connection.release();

  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

const { requireAuth } = require('../middleware/auth');

router.get('/me', requireAuth, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id, email, name, avatar, plan, queries_this_month FROM users WHERE id = ?', [req.user.id]);
    connection.release();

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
