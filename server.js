const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Serve Store Frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Create Payment Invoice Endpoint
app.post('/api/create-payment', async (req, res) => {
  try {
    const { amount, firstName, lastName } = req.body;

    const response = await axios.post('https://api.nowpayments.io/v1/invoice', {
      price_amount: amount,
      price_currency: 'usd',
      order_id: `CARD_${Date.now()}`,
      order_description: `Virtual Card for ${firstName} ${lastName}`,
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
    console.error('Invoice Creation Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create payment invoice' });
  }
});

// Gift Cards & Mobile Top-Up Endpoint
app.post('/api/giftcards/packages', async (req, res) => {
  try {
    const { search, country } = req.body;
    const response = await axios.post('https://home.kripicard.com/api/gifts/packages', {
      api_key: process.env.KRIPICARD_API_KEY,
      search: search || '',
      country: country || ''
    });
    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gift card packages' });
  }
});

// eSIM Packages Endpoint
app.post('/api/esim/packages', async (req, res) => {
  try {
    const { country } = req.body;
    const response = await axios.post('https://home.kripicard.com/api/esim/packages', {
      api_key: process.env.KRIPICARD_API_KEY,
      country: country || 'US'
    });
    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch eSIM packages' });
  }
});

// NOWPayments IPN Webhook Handler
app.post('/webhooks/nowpayments', async (req, res) => {
  try {
    const { payment_status, order_id } = req.body;

    if (payment_status === 'finished') {
      console.log(`Payment confirmed for Order: ${order_id}`);
      // Automated fulfillment logic goes here
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(500).send('Webhook processing failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
