import express from 'express';
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  likeArticle,
  dislikeArticle,
  shareArticle,
  bookmarkArticle,
  getBookmarkedArticles,
  getLiveUpdates,
  getAdminStats
} from '../controllers/articleController.js';
import { protect, optionalAuth, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/live-updates', getLiveUpdates);
router.get('/', optionalAuth, getArticles);
router.get('/bookmarks', protect, getBookmarkedArticles);
router.get('/stats', protect, admin, getAdminStats);
router.get('/:id', optionalAuth, getArticle);

// Admin only routes
router.post('/', protect, admin, createArticle);
router.put('/:id', protect, admin, updateArticle);
router.delete('/:id', protect, admin, deleteArticle);

// User interaction routes (require login)
router.post('/:id/like', protect, likeArticle);
router.post('/:id/dislike', protect, dislikeArticle);
router.post('/:id/share', protect, shareArticle);
router.post('/:id/bookmark', protect, bookmarkArticle);

export default router;
