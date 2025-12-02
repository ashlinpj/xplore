import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiUrl } from '../lib/api';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  ThumbsUp,
  Users,
  FileText,
  TrendingUp,
  X,
  Save,
  Image,
  Loader2,
  BarChart3,
  Radio,
  Upload,
  ImagePlus,
  Video
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const categories = ['Hardware', 'Wearables', 'Future Tech', 'Space', 'AI', 'Mobile', 'Gaming', 'Science'];

function AdminDashboard() {
  const { user, token, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  
  const [stats, setStats] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: 'AI',
    image: '',
    media: [],
    isLive: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [useImageUrl, setUseImageUrl] = useState(false); // Default to upload for Cloudinary

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, articlesRes] = await Promise.all([
        fetch(`${API_URL}/articles/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/articles?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        setArticles(articlesData.articles || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only image files are allowed (jpeg, jpg, png, gif, webp)', 'error');
      return;
    }

    // Validate file size (10MB for Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File is too large. Maximum size is 10MB', 'error');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file to Cloudinary
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const response = await fetch(getApiUrl('/api/upload/image'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image: data.url }));
        showToast('Image uploaded successfully', 'success');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to upload image', 'error');
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload image', 'error');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Handle multiple media uploads (images and videos)
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Validate files
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    for (const file of files) {
      if (![...allowedImageTypes, ...allowedVideoTypes].includes(file.type)) {
        showToast(`Invalid file type: ${file.name}`, 'error');
        return;
      }
      if (file.size > maxSize) {
        showToast(`File too large: ${file.name} (max 50MB)`, 'error');
        return;
      }
    }

    setUploading(true);
    const uploadFormData = new FormData();
    files.forEach(file => uploadFormData.append('media', file));

    try {
      const response = await fetch(getApiUrl('/api/upload/media'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadFormData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          media: [...prev.media, ...data.media]
        }));
        showToast(`${data.media.length} file(s) uploaded successfully`, 'success');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to upload media', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload media', 'error');
    } finally {
      setUploading(false);
      if (mediaInputRef.current) {
        mediaInputRef.current.value = '';
      }
    }
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Image is now optional
    
    setSubmitting(true);

    try {
      const url = editingArticle 
        ? `${API_URL}/articles/${editingArticle._id}`
        : `${API_URL}/articles`;
      
      const method = editingArticle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(editingArticle ? 'Article updated successfully' : 'Article created successfully', 'success');
        setShowModal(false);
        setEditingArticle(null);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to save article', 'error');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      showToast('Failed to save article', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      author: article.author,
      category: article.category,
      image: article.image,
      media: article.media || [],
      isLive: article.isLive || false
    });
    setImagePreview(article.image);
    setShowModal(true);
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Article deleted successfully', 'success');
        fetchData();
      } else {
        showToast('Failed to delete article', 'error');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      showToast('Failed to delete article', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      author: '',
      category: 'AI',
      image: '',
      isLive: false
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openNewArticleModal = () => {
    setEditingArticle(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm">
                Welcome back, {user?.username}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openNewArticleModal}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Article
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Articles</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalArticles}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Eye className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Views</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalViews?.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-500/10 rounded-lg">
                  <ThumbsUp className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Likes</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalLikes?.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Category Stats */}
        {stats?.categoryStats && stats.categoryStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-6 mb-8"
          >
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Articles by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.categoryStats.map((cat, index) => (
                <div key={cat._id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-muted-foreground">{cat._id}</span>
                  <span className="font-bold text-primary">{cat.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Articles Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              All Articles ({articles.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.map((article) => (
                  <tr key={article._id} className="hover:bg-background/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="max-w-xs">
                          <p className="text-foreground font-medium truncate">{article.title}</p>
                          <p className="text-muted-foreground text-sm">{article.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {article.viewers}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" /> {article.likes}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {article.isLive ? (
                        <span className="flex items-center gap-1 text-red-500 text-sm">
                          <Radio className="w-4 h-4 animate-pulse" /> Live
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Published</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(article)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(article._id)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {articles.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No articles yet. Create your first one!</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Article Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-foreground">
                  {editingArticle ? 'Edit Article' : 'Create New Article'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    placeholder="Enter article title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Excerpt *
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    required
                    rows={2}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                    placeholder="Brief summary of the article..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Content *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                    placeholder="Full article content..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Author *
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      placeholder="Author name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Image className="w-4 h-4 inline mr-1" />
                    Article Image *
                  </label>
                  
                  {/* Toggle between URL and Upload */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setUseImageUrl(true)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        useImageUrl 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseImageUrl(false)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        !useImageUrl 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>

                  {/* Image Input Area */}
                  <div className="space-y-3">
                    {useImageUrl ? (
                      /* URL Input */
                      <div>
                        <input
                          type="url"
                          name="image"
                          value={formData.image}
                          onChange={handleInputChange}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use images from Unsplash, Pexels, or any direct image URL
                        </p>
                        {formData.image && (
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-full h-40 object-cover rounded-lg mt-3"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/400x200?text=Invalid+URL';
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      /* File Upload */
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          className="hidden"
                        />
                        
                        {!formData.image && !imagePreview ? (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="text-sm text-muted-foreground">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload image</span>
                                <span className="text-xs text-muted-foreground">JPEG, PNG, GIF, WebP (max 5MB)</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="relative">
                            <img
                              src={imagePreview || formData.image}
                              alt="Preview"
                              className="w-full h-40 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/400x200?text=Image+Error';
                              }}
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="p-2 bg-background/80 backdrop-blur rounded-lg hover:bg-background transition-colors"
                                title="Change image"
                              >
                                {uploading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={removeImage}
                                className="p-2 bg-red-500/80 backdrop-blur rounded-lg hover:bg-red-500 transition-colors"
                                title="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-yellow-500">
                          ⚠️ File upload only works in local development. Use Image URL for production.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Media Gallery Upload (Images & Videos to Cloudinary) */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Video className="w-4 h-4 inline mr-1" />
                    Additional Media (Images & Videos)
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload additional images and videos for your article. These will be stored in cloud storage.
                  </p>
                  
                  <input
                    type="file"
                    ref={mediaInputRef}
                    onChange={handleMediaUpload}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                    multiple
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload media files</span>
                        <span className="text-xs text-muted-foreground">Images (5MB) & Videos (50MB)</span>
                      </>
                    )}
                  </button>

                  {/* Media Preview Grid */}
                  {formData.media && formData.media.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {formData.media.map((item, index) => (
                        <div key={index} className="relative group">
                          {item.type === 'video' ? (
                            <video
                              src={item.url}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeMedia(index)}
                              className="p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                            {item.type === 'video' ? '🎬' : '🖼️'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Article Expiration Notice */}
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⏳ Articles are automatically deleted after 3 days to save storage. 
                    Users can bookmark articles to protect them from deletion.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isLive"
                    id="isLive"
                    checked={formData.isLive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                  <label htmlFor="isLive" className="text-sm text-foreground flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-500" />
                    Mark as Live (appears in live ticker)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingArticle ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboard;
