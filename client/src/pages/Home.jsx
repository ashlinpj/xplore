import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { LiveTicker } from '../components/LiveTicker';
import { ArticleCard } from '../components/ArticleCard';
import { articlesAPI } from '../lib/api';
import { motion } from 'framer-motion';
import { Search, X, FileText } from 'lucide-react';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data } = await articlesAPI.getAll();
        // Use real data from database (empty array if no articles)
        setArticles(data.articles || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Filter articles based on search and category
  useEffect(() => {
    let result = [...articles];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query) ||
        article.content?.toLowerCase().includes(query) ||
        article.author?.toLowerCase().includes(query) ||
        article.category?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (categoryFilter) {
      result = result.filter(article => 
        article.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    setFilteredArticles(result);
  }, [articles, searchQuery, categoryFilter]);

  const clearFilters = () => {
    setSearchParams({});
  };

  const featuredArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse text-xl font-heading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-black">
      <Navbar />
      <LiveTicker />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Search/Filter Results Header */}
        {(searchQuery || categoryFilter) && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {searchQuery && <>Showing results for "<span className="text-primary font-medium">{searchQuery}</span>"</>}
                {searchQuery && categoryFilter && <span className="mx-2">in</span>}
                {categoryFilter && <span className="text-secondary font-medium capitalize">{categoryFilter}</span>}
              </span>
              <span className="text-muted-foreground">
                ({filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'})
              </span>
            </div>
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredArticles.length === 0 && !loading && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-heading font-bold mb-2">
              {searchQuery || categoryFilter ? 'No articles found' : 'No articles yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? `No articles match "${searchQuery}"`
                : categoryFilter
                  ? `No articles in category "${categoryFilter}"`
                  : 'Check back later for the latest tech news!'}
            </p>
            {(searchQuery || categoryFilter) && (
              <button 
                onClick={clearFilters}
                className="px-6 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                View All Articles
              </button>
            )}
          </div>
        )}

        {/* Hero Section */}
        {featuredArticle && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ArticleCard article={featuredArticle} featured />
          </motion.section>
        )}

        {/* Latest News Grid */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <h2 className="text-3xl font-heading font-bold flex items-center gap-2">
              <span className="w-2 h-8 bg-secondary block skew-x-[-10deg]"></span>
              Latest Stories
            </h2>
            <div className="text-sm font-mono text-muted-foreground">
              {new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridArticles.map((article, index) => (
              <motion.div
                key={article._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ArticleCard article={article} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trending / Sidebar Style Section */}
        <section className="grid lg:grid-cols-4 gap-8 border-t border-white/10 pt-12">
           <div className="lg:col-span-3">
             <h3 className="text-2xl font-heading font-bold mb-6">Deep Dives</h3>
             <div className="space-y-6">
                {articles.slice(0, 3).map(article => (
                  <Link 
                    key={`wide-${article._id}`} 
                    to={`/article/${article._id}`}
                    className="block"
                  >
                    <div className="flex gap-4 items-start group cursor-pointer hover:bg-white/5 p-4 rounded-lg transition-colors">
                       <div className="w-32 h-20 shrink-0 overflow-hidden rounded bg-muted">
                         <img src={article.image} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                         <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{article.title}</h4>
                         <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{article.excerpt}</p>
                       </div>
                    </div>
                  </Link>
                ))}
             </div>
           </div>
           
           <div className="space-y-6">
             <h3 className="text-xl font-heading font-bold text-primary">Trending Topics</h3>
             <div className="flex flex-wrap gap-2">
               {[
                 { tag: "#AI", category: "ai" },
                 { tag: "#SpaceX", category: "space" },
                 { tag: "#Crypto", category: "crypto" },
                 { tag: "#VR", category: "wearables" },
                 { tag: "#Hardware", category: "hardware" },
                 { tag: "#Tesla", category: "automotive" },
                 { tag: "#Tech", category: "tech" }
               ].map(item => (
                 <Link 
                   key={item.tag} 
                   to={`/?category=${item.category}`}
                   className="px-3 py-1 bg-muted rounded-full text-sm font-mono hover:bg-primary hover:text-black cursor-pointer transition-colors"
                 >
                   {item.tag}
                 </Link>
               ))}
             </div>
           </div>
        </section>
      </main>
      
      <footer className="border-t border-white/10 mt-20 bg-black py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 XPLORE Media Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
