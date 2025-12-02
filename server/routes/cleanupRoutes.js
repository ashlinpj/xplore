import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { 
  cleanupExpiredArticles, 
  getExpiringArticles,
  extendArticleExpiration 
} from '../services/articleCleanup.js';

const router = express.Router();

// @desc    Manually trigger cleanup of expired articles
// @route   POST /api/cleanup/articles
// @access  Private (Admin only)
router.post('/articles', protect, admin, async (req, res) => {
  try {
    const result = await cleanupExpiredArticles();
    res.json({ 
      message: `Cleanup complete. Deleted ${result.deleted} expired articles.`,
      deleted: result.deleted
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ message: 'Error during cleanup', error: error.message });
  }
});

// @desc    Get articles expiring soon (within 24 hours)
// @route   GET /api/cleanup/expiring
// @access  Private (Admin only)
router.get('/expiring', protect, admin, async (req, res) => {
  try {
    const articles = await getExpiringArticles();
    res.json({ 
      count: articles.length,
      articles 
    });
  } catch (error) {
    console.error('Error getting expiring articles:', error);
    res.status(500).json({ message: 'Error fetching expiring articles', error: error.message });
  }
});

// @desc    Extend article expiration
// @route   POST /api/cleanup/extend/:id
// @access  Private (Admin only)
router.post('/extend/:id', protect, admin, async (req, res) => {
  try {
    const { days = 3 } = req.body;
    const article = await extendArticleExpiration(req.params.id, days);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.json({ 
      message: `Article expiration extended by ${days} days`,
      newExpiresAt: article.expiresAt
    });
  } catch (error) {
    console.error('Error extending expiration:', error);
    res.status(500).json({ message: 'Error extending expiration', error: error.message });
  }
});

// @desc    Cron endpoint for automated cleanup (called by external cron service)
// @route   GET /api/cleanup/cron
// @access  Public (but requires secret key)
router.get('/cron', async (req, res) => {
  try {
    // Simple security: require a secret key in query params
    const { key } = req.query;
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && key !== cronSecret) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const result = await cleanupExpiredArticles();
    res.json({ 
      success: true,
      deleted: result.deleted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron cleanup error:', error);
    res.status(500).json({ message: 'Error during cleanup', error: error.message });
  }
});

export default router;
