import Article from '../models/Article.js';
import { deleteFromCloudinary } from './cloudinary.js';

/**
 * Delete expired articles that are not bookmarked
 * Articles expire after 3 days unless they are bookmarked by at least one user
 */
export const cleanupExpiredArticles = async () => {
  try {
    const now = new Date();
    
    // Find articles that:
    // 1. Have expired (expiresAt < now)
    // 2. Are not protected (no bookmarks)
    // 3. Have no users in bookmarkedBy array
    const expiredArticles = await Article.find({
      expiresAt: { $lt: now },
      isProtected: false,
      $or: [
        { bookmarkedBy: { $exists: false } },
        { bookmarkedBy: { $size: 0 } }
      ]
    });

    console.log(`Found ${expiredArticles.length} expired articles to delete`);

    for (const article of expiredArticles) {
      // Delete media from Cloudinary
      if (article.media && article.media.length > 0) {
        for (const mediaItem of article.media) {
          if (mediaItem.publicId) {
            try {
              const resourceType = mediaItem.type === 'video' ? 'video' : 'image';
              await deleteFromCloudinary(mediaItem.publicId, resourceType);
              console.log(`Deleted ${mediaItem.type} from Cloudinary: ${mediaItem.publicId}`);
            } catch (err) {
              console.error(`Failed to delete media from Cloudinary: ${err.message}`);
            }
          }
        }
      }

      // Delete the article from database
      await Article.findByIdAndDelete(article._id);
      console.log(`Deleted expired article: ${article.title}`);
    }

    return { deleted: expiredArticles.length };
  } catch (error) {
    console.error('Error cleaning up expired articles:', error);
    throw error;
  }
};

/**
 * Update article protection status based on bookmarks
 * Called when a user bookmarks or unbookmarks an article
 */
export const updateArticleProtection = async (articleId) => {
  try {
    const article = await Article.findById(articleId);
    
    if (!article) {
      return null;
    }

    // If article has bookmarks, protect it from deletion
    const isProtected = article.bookmarkedBy && article.bookmarkedBy.length > 0;
    
    if (article.isProtected !== isProtected) {
      article.isProtected = isProtected;
      await article.save();
      console.log(`Article "${article.title}" protection status: ${isProtected ? 'protected' : 'unprotected'}`);
    }

    return article;
  } catch (error) {
    console.error('Error updating article protection:', error);
    throw error;
  }
};

/**
 * Extend article expiration by 3 more days
 * Can be called to keep an article alive longer
 */
export const extendArticleExpiration = async (articleId, days = 3) => {
  try {
    const article = await Article.findById(articleId);
    
    if (!article) {
      return null;
    }

    const newExpiration = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    article.expiresAt = newExpiration;
    await article.save();

    return article;
  } catch (error) {
    console.error('Error extending article expiration:', error);
    throw error;
  }
};

/**
 * Get articles that will expire soon (within 24 hours)
 */
export const getExpiringArticles = async () => {
  try {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const now = new Date();
    
    const expiringArticles = await Article.find({
      expiresAt: { $gt: now, $lt: tomorrow },
      isProtected: false,
      $or: [
        { bookmarkedBy: { $exists: false } },
        { bookmarkedBy: { $size: 0 } }
      ]
    }).select('title expiresAt category');

    return expiringArticles;
  } catch (error) {
    console.error('Error getting expiring articles:', error);
    throw error;
  }
};

export default {
  cleanupExpiredArticles,
  updateArticleProtection,
  extendArticleExpiration,
  getExpiringArticles
};
