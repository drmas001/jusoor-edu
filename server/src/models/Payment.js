const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // What this payment is for
    type: {
      type: String,
      enum: ['wallet_deposit', 'platform_fee', 'session_payment'],
      required: true,
    },
    // Payment method used
    method: {
      type: String,
      enum: ['apple_pay', 'google_pay', 'credit_card', 'wallet'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'SAR',
    },
    // Payment gateway charge ID (from Tap/Stripe)
    chargeId: {
      type: String,
      default: null,
    },
    // Status from payment gateway
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    // Related offer (for platform_fee or session_payment)
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      default: null,
    },
    // Card details (last 4 digits, brand) - never store full card
    cardInfo: {
      brand: { type: String, default: null },
      last4: { type: String, default: null },
    },
    // Gateway raw response for debugging
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Idempotency key to prevent duplicate charges
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ chargeId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
