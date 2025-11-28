import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous subscriptions
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastNotified: {
    type: Date
  }
});

// Index for faster queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ isActive: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
