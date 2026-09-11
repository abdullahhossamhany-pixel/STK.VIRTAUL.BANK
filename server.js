const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for external frontends (Vercel, Netlify, v0, etc.)
app.use(cors());
app.use(express.json());

// 1. Fetch Dynamic Gift Cards Catalog from Kripicard
app.post('/api/giftcards/catalog', async (req, res) => {
  try {
    const { search, country } = req.body;
    const response = await axios.post('https://home.kripicard.com/api/gifts/packages', {
      api_key: process.env.KRIPICARD_API_KEY,
      search: search || '',
      country: country || ''
    });
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Kripicard Catalog Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch gift cards' });
  }
});

// 2. Universal Order Checkout Endpoint
app.post('/api/checkout', async (req, res) => {
  try {
    const { orderType, amount, title, targetNumber, email } = req.body;

    let description = `${orderType.toUpperCase()}: ${title}`;
    if (targetNumber) description += ` | Phone: ${targetNumber}`;
    if (email) description += ` | Email: ${email}`;

    const response = await axios.post('https://api.nowpayments.io/v1/invoice', {
      price_amount: amount,
      price_currency: 'usd',
      order_id: `ORD_${Date.now()}`,
      order_description: description,
      ipn_callback_url: `${req.protocol}://${req.get('host')}/webhooks/nowpayments`,
      is_fee_paid_by_user: true
    }, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ invoice_url: response.data.invoice_url });
  } catch (err) {
    console.error('Checkout Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate checkout link' });
  }
});

// 3. NOWPayments Webhook Handler
app.post('/webhooks/nowpayments', async (req, res) => {
  const { payment_status, order_id } = req.body;
  if (payment_status === 'finished') {
    console.log(`Payment confirmed for order ${order_id}. Executing API fulfillment.`);
  }
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend server listening on port ${PORT}`));
