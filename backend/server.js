const express = require('express');
const cors = require('cors');
const passport = require('passport');
const dotenv = require('dotenv');
require('./lib/db'); // Initialize DB pool
require('./lib/migrate'); // Run migrations on startup (for simplicity)

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

// Webhook needs raw body, so we conditionally apply express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use(passport.initialize());

// Routes
const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyze');
const stripeRoutes = require('./routes/stripe');

app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/stripe', stripeRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
