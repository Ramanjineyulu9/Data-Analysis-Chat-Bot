const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { requireAuth } = require('../middleware/auth');
const pool = require('../lib/db');

const router = express.Router();

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard`,
      client_reference_id: req.user.id,
      customer_email: req.user.email,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Could not create checkout session' });
  }
});

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (userId) {
      const connection = await pool.getConnection();
      await connection.query(
        'UPDATE users SET plan = ?, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?',
        ['pro', customerId, subscriptionId, userId]
      );
      connection.release();
    }
  }

  res.send();
});

module.exports = router;
