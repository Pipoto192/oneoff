const mongoose = require('mongoose');

const CodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['30days', 'lifetime'], default: '30days' },
  isRedeemed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const SubscriptionSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  expiryDate: { type: Date, required: true }, // null for lifetime? Or far future
  type: { type: String, enum: ['30days', 'lifetime'], required: true }
});

const Code = mongoose.model('Code', CodeSchema);
const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = { Code, Subscription };
