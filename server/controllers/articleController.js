import Article from '../models/Article.js';
import User from '../models/User.js';
import { sendNotificationToAll } from '../routes/notificationRoutes.js';
import { updateArticleProtection } from '../services/articleCleanup.js';

// @desc    Get all articles
// @route   GET /api/articles
// @access  Public
export const getArticles = async (req, res) => {
  try {
    const { category, limit = 10, page = 1, since, search } = req.query;
    let query = {};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by date (for notification polling)
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Article.countDocuments(query);
    
    // For polling (since param), return just the articles array
    if (since) {
      return res.json(articles);
    }
    
    // If user is authenticated, include their interaction status
    let articlesWithUserStatus = articles;
    if (req.user) {
      const user = await User.findById(req.user._id);
      articlesWithUserStatus = articles.map(article => {
        const articleObj = article.toObject();
        articleObj.isLiked = article.likedBy.includes(req.user._id);
        articleObj.isDisliked = article.dislikedBy.includes(req.user._id);
        articleObj.isBookmarked = user.bookmarks.includes(article._id);
        articleObj.isShared = article.sharedBy.includes(req.user._id);
        return articleObj;
      });
    }
    
    res.json({
      articles: articlesWithUserStatus,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single article
// @route   GET /api/articles/:id
// @access  Public
export const getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Track unique views
    let viewIncremented = false;
    
    if (req.user) {
      // For logged-in users, check if they've viewed before
      if (!article.viewedBy.includes(req.user._id)) {
        article.viewedBy.push(req.user._id);
        article.viewers += 1;
        viewIncremented = true;
      }
    } else {
      // For anonymous users, use visitor ID from header or generate one
      const visitorId = req.headers['x-visitor-id'];
      if (visitorId) {
        const hasViewed = article.anonymousViews.some(v => v.visitorId === visitorId);
        if (!hasViewed) {
          article.anonymousViews.push({ visitorId });
          article.viewers += 1;
          viewIncremented = true;
        }
      } else {
        // No visitor ID, increment anyway (fallback for old clients)
        article.viewers += 1;
        viewIncremented = true;
      }
    }
    
    if (viewIncremented) {
      await article.save();
    }
    
    // If user is authenticated, include their interaction status
    let articleResponse = article.toObject();
    if (req.user) {
      const user = await User.findById(req.user._id);
      articleResponse.isLiked = article.likedBy.includes(req.user._id);
      articleResponse.isDisliked = article.dislikedBy.includes(req.user._id);
      articleResponse.isBookmarked = user.bookmarks.includes(article._id);
      articleResponse.isShared = article.sharedBy.includes(req.user._id);
    }
    
    res.json(articleResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create article
// @route   POST /api/articles
// @access  Private (Admin only)
export const createArticle = async (req, res) => {
  try {
    const articleData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const article = await Article.create(articleData);
    
    // Send push notification to all subscribers
    sendNotificationToAll(article);
    
    res.status(201).json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private (Admin only)
export const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    res.json(updatedArticle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private (Admin only)
export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    await Article.findByIdAndDelete(req.params.id);
    
    // Remove article from all users' bookmarks
    await User.updateMany(
      { bookmarks: req.params.id },
      { $pull: { bookmarks: req.params.id } }
    );
    
    res.json({ message: 'Article removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Like an article
// @route   POST /api/articles/:id/like
// @access  Private
export const likeArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const userId = req.user._id;
    const alreadyLiked = article.likedBy.some(id => id.toString() === userId.toString());
    const alreadyDisliked = article.dislikedBy.some(id => id.toString() === userId.toString());
    
    if (alreadyLiked) {
      // Unlike - remove like
      article.likedBy = article.likedBy.filter(id => id.toString() !== userId.toString());
      article.likes = Math.max(0, article.likes - 1);
    } else {
      // Add like
      article.likedBy.push(userId);
      article.likes += 1;
      
      // Remove dislike if present
      if (alreadyDisliked) {
        article.dislikedBy = article.dislikedBy.filter(id => id.toString() !== userId.toString());
        article.dislikes = Math.max(0, article.dislikes - 1);
      }
    }
    
    await article.save();
    
    res.json({ 
      likes: article.likes, 
      dislikes: article.dislikes,
      isLiked: !alreadyLiked,
      isDisliked: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Dislike an article
// @route   POST /api/articles/:id/dislike
// @access  Private
export const dislikeArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const userId = req.user._id;
    const alreadyLiked = article.likedBy.some(id => id.toString() === userId.toString());
    const alreadyDisliked = article.dislikedBy.some(id => id.toString() === userId.toString());
    
    if (alreadyDisliked) {
      // Un-dislike - remove dislike
      article.dislikedBy = article.dislikedBy.filter(id => id.toString() !== userId.toString());
      article.dislikes = Math.max(0, article.dislikes - 1);
    } else {
      // Add dislike
      article.dislikedBy.push(userId);
      article.dislikes += 1;
      
      // Remove like if present
      if (alreadyLiked) {
        article.likedBy = article.likedBy.filter(id => id.toString() !== userId.toString());
        article.likes = Math.max(0, article.likes - 1);
      }
    }
    
    await article.save();
    
    res.json({ 
      likes: article.likes, 
      dislikes: article.dislikes,
      isLiked: false,
      isDisliked: !alreadyDisliked
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Share an article
// @route   POST /api/articles/:id/share
// @access  Private
export const shareArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const userId = req.user._id;
    const alreadyShared = article.sharedBy.some(id => id.toString() === userId.toString());
    
    if (!alreadyShared) {
      article.sharedBy.push(userId);
      article.shares += 1;
    }
    
    await article.save();
    
    res.json({ 
      shares: article.shares,
      isShared: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Bookmark an article
// @route   POST /api/articles/:id/bookmark
// @access  Private
export const bookmarkArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    const user = await User.findById(req.user._id);
    const userId = req.user._id;
    const articleId = article._id;
    
    const isBookmarked = user.bookmarks.some(id => id.toString() === articleId.toString());
    
    if (isBookmarked) {
      // Remove bookmark
      user.bookmarks = user.bookmarks.filter(id => id.toString() !== articleId.toString());
      article.bookmarkedBy = article.bookmarkedBy.filter(id => id.toString() !== userId.toString());
    } else {
      // Add bookmark
      user.bookmarks.push(articleId);
      article.bookmarkedBy.push(userId);
    }
    
    await user.save();
    await article.save();
    
    // Update article protection status (protects from auto-deletion if bookmarked)
    await updateArticleProtection(articleId);
    
    res.json({ 
      isBookmarked: !isBookmarked,
      bookmarksCount: article.bookmarkedBy.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user's bookmarked articles
// @route   GET /api/articles/bookmarks
// @access  Private
export const getBookmarkedArticles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('bookmarks');
    
    res.json(user.bookmarks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get live updates
// @route   GET /api/articles/live-updates
// @access  Public
export const getLiveUpdates = async (req, res) => {
  try {
    const liveArticles = await Article.find({ isLive: true })
      .select('title excerpt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Create live update strings from articles or use defaults
    const updates = liveArticles.length > 0 
      ? liveArticles.map(a => a.title)
      : [
          "SpaceX Starship V3 launch confirmed for 10:00 AM EST",
          "Apple announces surprise event for new Vision Pro",
          "Bitcoin breaks $150k barrier amidst global adoption",
          "OpenAI releases GPT-6 with full reasoning capabilities",
          "Tesla Model 2 production starts in Mexico Gigafactory"
        ];
    
    res.json(updates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get admin stats
// @route   GET /api/articles/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalViews = await Article.aggregate([
      { $group: { _id: null, total: { $sum: '$viewers' } } }
    ]);
    const totalLikes = await Article.aggregate([
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]);
    
    const recentArticles = await Article.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category viewers likes createdAt');
    
    const categoryStats = await Article.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      totalArticles,
      totalUsers,
      totalViews: totalViews[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0,
      recentArticles,
      categoryStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
