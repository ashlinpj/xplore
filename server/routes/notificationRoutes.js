import express from 'express';
import webpush from 'web-push';
import Subscription from '../models/Subscription.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@xplore.com';

// Configure web-push
webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// @desc    Get VAPID public key
// @route   GET /api/notifications/vapid-public-key
// @access  Public
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
// @access  Public (with optional auth)
router.post('/subscribe', optionalAuth, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    // Check if subscription already exists
    let existingSub = await Subscription.findOne({ endpoint: subscription.endpoint });
    
    if (existingSub) {
      // Update existing subscription
      existingSub.keys = subscription.keys;
      existingSub.isActive = true;
      if (req.user) {
        existingSub.userId = req.user._id;
      }
      await existingSub.save();
      return res.json({ message: 'Subscription updated', subscribed: true });
    }

    // Create new subscription
    const newSubscription = new Subscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userId: req.user?._id || null,
      isActive: true
    });

    await newSubscription.save();
    res.status(201).json({ message: 'Subscribed to notifications', subscribed: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Failed to subscribe', error: error.message });
  }
});

// @desc    Unsubscribe from push notifications
// @route   POST /api/notifications/unsubscribe
// @access  Public
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required' });
    }

    const subscription = await Subscription.findOne({ endpoint });
    
    if (subscription) {
      subscription.isActive = false;
      await subscription.save();
    }

    res.json({ message: 'Unsubscribed from notifications', subscribed: false });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe', error: error.message });
  }
});

// @desc    Check subscription status
// @route   POST /api/notifications/status
// @access  Public
router.post('/status', async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.json({ subscribed: false });
    }

    const subscription = await Subscription.findOne({ endpoint, isActive: true });
    res.json({ subscribed: !!subscription });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ message: 'Failed to check status', error: error.message });
  }
});

// @desc    Send notification to all subscribers (called internally when article is created)
// @route   This is not an API endpoint, it's exported for internal use
export const sendNotificationToAll = async (article) => {
  try {
    const subscriptions = await Subscription.find({ isActive: true });
    
    const payload = JSON.stringify({
      title: '🚀 New Article on XPLORE',
      body: article.title,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      image: article.image,
      data: {
        url: `/article/${article._id}`,
        articleId: article._id
      },
      tag: `article-${article._id}`,
      requireInteraction: true
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          payload
        );
        
        // Update last notified
        sub.lastNotified = new Date();
        await sub.save();
      } catch (error) {
        console.error(`Failed to send to ${sub.endpoint}:`, error.message);
        
        // If subscription is invalid, mark as inactive
        if (error.statusCode === 404 || error.statusCode === 410) {
          sub.isActive = false;
          await sub.save();
        }
      }
    });

    await Promise.allSettled(sendPromises);
    console.log(`Notifications sent to ${subscriptions.length} subscribers`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

export default router;
