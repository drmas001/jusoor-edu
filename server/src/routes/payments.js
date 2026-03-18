const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const User = require('../models/User');

const router = express.Router();

// Simulate payment gateway delay (1-2 seconds)
const simulateGatewayDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

// Generate a fake charge ID like a real gateway would
const generateChargeId = (method) => {
  const prefix = method === 'apple_pay' ? 'ap' : method === 'google_pay' ? 'gp' : 'ch';
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
};

// POST /api/payments/create-charge
// Creates a payment charge (simulated - replace with Tap/Stripe API call)
router.post('/create-charge', auth, async (req, res) => {
  try {
    const { amount, method, type, offerId } = req.body;

    // Validation
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'المبلغ غير صالح' });
    }
    if (!['apple_pay', 'google_pay', 'credit_card'].includes(method)) {
      return res.status(400).json({ message: 'طريقة الدفع غير صالحة' });
    }
    if (!['wallet_deposit', 'platform_fee', 'session_payment'].includes(type)) {
      return res.status(400).json({ message: 'نوع الدفع غير صالح' });
    }

    // Generate idempotency key
    const idempotencyKey = `${req.user._id}_${type}_${amount}_${Date.now()}`;

    // Create payment record
    const payment = new Payment({
      userId: req.user._id,
      type,
      method,
      amount,
      status: 'processing',
      offerId: offerId || null,
      idempotencyKey,
    });
    await payment.save();

    // ============================================
    // SIMULATED PAYMENT GATEWAY
    // Replace this block with real Tap/Stripe API call
    // ============================================
    await simulateGatewayDelay();

    const chargeId = generateChargeId(method);
    const simulatedSuccess = true; // Always succeed in simulation

    if (simulatedSuccess) {
      // Simulate card info for credit card payments
      const cardInfo =
        method === 'credit_card'
          ? { brand: 'Visa', last4: String(Math.floor(1000 + Math.random() * 9000)) }
          : method === 'apple_pay'
          ? { brand: 'Apple Pay', last4: null }
          : { brand: 'Google Pay', last4: null };

      payment.chargeId = chargeId;
      payment.status = 'succeeded';
      payment.cardInfo = cardInfo;
      payment.gatewayResponse = {
        id: chargeId,
        status: 'CAPTURED',
        amount,
        currency: 'SAR',
        method,
        simulated: true,
      };
      await payment.save();

      // Credit user wallet for deposits
      if (type === 'wallet_deposit') {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { balance: amount },
        });
      }

      // Platform fee: isFeePaid is marked by /offers/:id/pay-fee route
      // No duplicate update here

      return res.json({
        success: true,
        payment: {
          id: payment._id,
          chargeId,
          status: 'succeeded',
          amount,
          method,
          cardInfo,
        },
      });
    }
    // ============================================
    // END SIMULATED GATEWAY
    // ============================================
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ message: 'حدث خطأ في معالجة الدفع' });
  }
});

// POST /api/payments/webhook
// Webhook endpoint for payment gateway callbacks
// In production: Tap/Stripe will POST here after payment completes
router.post('/webhook', async (req, res) => {
  try {
    // ============================================
    // PRODUCTION: Verify webhook signature here
    // const signature = req.headers['tap-signature'];
    // verify(signature, req.body, WEBHOOK_SECRET);
    // ============================================

    const { chargeId, status } = req.body;

    if (!chargeId) {
      return res.status(400).json({ message: 'Missing chargeId' });
    }

    const payment = await Payment.findOne({ chargeId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Prevent processing already finalized payments
    if (['succeeded', 'failed', 'refunded'].includes(payment.status)) {
      return res.json({ message: 'Already processed' });
    }

    if (status === 'CAPTURED' || status === 'succeeded') {
      payment.status = 'succeeded';
      await payment.save();

      // Credit wallet
      if (payment.type === 'wallet_deposit') {
        await User.findByIdAndUpdate(payment.userId, {
          $inc: { balance: payment.amount },
        });
      }
    } else {
      payment.status = 'failed';
      await payment.save();
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

// GET /api/payments/verify/:paymentId
// Verify payment status (client polls this after redirect)
router.get('/verify/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      userId: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      type: payment.type,
      cardInfo: payment.cardInfo,
      createdAt: payment.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/payments/history
// Get user's payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-gatewayResponse -idempotencyKey');

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
