import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import ArticleCard from '../components/ArticleCard';
import { Bookmark, Loader2, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function Bookmarks() {
  const { user, token, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchBookmarks();
  }, [isAuthenticated, navigate]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch(`${API_URL}/articles/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBookmarks(data);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      showToast('Failed to load bookmarks', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-primary" />
              My Bookmarks
            </h1>
            <p className="text-muted-foreground text-sm">
              {bookmarks.length} saved article{bookmarks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {bookmarks.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {bookmarks.map((article, index) => (
              <motion.div
                key={article._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ArticleCard article={article} onRefresh={fetchBookmarks} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Bookmark className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
              No bookmarks yet
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Save articles you want to read later by clicking the bookmark icon on any article.
            </p>
            <Link
              to="/"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Articles
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default Bookmarks;
