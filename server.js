require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Helper function to verify NOWPayments HMAC signature
function verifySignature(params, secret, signature) {
  const sortedKeys = Object.keys(params).sort();
  const sortedObj = {};
  sortedKeys.forEach(key => sortedObj[key] = params[key]);
  
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(JSON.stringify(sortedObj));
  return hmac.digest('hex') === signature;
}

// 1. ENDPOINT TO CREATE PAYMENT INVOICE
app.post('/api/create-payment', async (req, res) => {
  try {
    const { amount, firstName, lastName } = req.body;

    const response = await axios.post('https://api.nowpayments.io/v1/invoice', {
      price_amount: amount,
      price_currency: 'usd',
      order_id: `CARD_${Date.now()}`,
      order_description: `Virtual Card for ${firstName} ${lastName}`,
      ipn_callback_url: 'https://YOUR-RENDER-APP-NAME.onrender.com/webhooks/nowpayments',
      success_url: 'https://yourwebsite.com/success'
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

// 2. WEBHOOK LISTENER
app.post('/webhooks/nowpayments', async (req, res) => {
  const signature = req.headers['x-nowpayments-sig'];
  const isValid = verifySignature(req.body, process.env.NOWPAYMENTS_IPN_SECRET, signature);

  if (!isValid) {
    console.error('Invalid IPN Signature!');
    return res.status(400).send('Invalid Signature');
  }

  if (req.body.payment_status === 'finished') {
    console.log('Payment confirmed finished! Triggering Kripicard API...');

    const nameMatch = req.body.order_description.replace('Virtual Card for ', '').split(' ');
    const firstName = nameMatch[0] || 'Customer';
    const lastName = nameMatch[1] || 'User';

    try {
      const cardResponse = await axios.post('https://home.kripicard.com/api/premium/Create_card', {
        api_key: process.env.KRIPICARD_API_KEY,
        amount: 10,
        bankBin: 1,
        first_name: firstName,
        last_name: lastName
      });

      console.log('Automated Card Issuance Result:', cardResponse.data);
    } catch (error) {
      console.error('Kripicard API Error:', error.response?.data || error.message);
    }
  }

  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
