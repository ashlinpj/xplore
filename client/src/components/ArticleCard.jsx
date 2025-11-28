import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Eye, ThumbsUp, ThumbsDown, Share2, Clock, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const API_URL = '/api';

export function ArticleCard({ article, featured = false, onRefresh }) {
  const [likes, setLikes] = useState(article.likes);
  const [dislikes, setDislikes] = useState(article.dislikes);
  const [shares, setShares] = useState(article.shares || 0);
  const [isLiked, setIsLiked] = useState(article.isLiked || false);
  const [isDisliked, setIsDisliked] = useState(article.isDisliked || false);
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked || false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to like articles.",
        variant: "destructive"
      });
      return;
    }
    
    // Optimistic update
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    setIsLiked(!wasLiked);
    setIsDisliked(false);
    setLikes(prev => wasLiked ? prev - 1 : prev + 1);
    if (wasDisliked) setDislikes(prev => prev - 1);
    
    try {
      const response = await fetch(`${API_URL}/articles/${article._id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setIsLiked(data.isLiked);
        setIsDisliked(data.isDisliked);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setIsDisliked(wasDisliked);
    }
  };

  const handleDislike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to dislike articles.",
        variant: "destructive"
      });
      return;
    }
    
    // Optimistic update
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    setIsDisliked(!wasDisliked);
    setIsLiked(false);
    setDislikes(prev => wasDisliked ? prev - 1 : prev + 1);
    if (wasLiked) setLikes(prev => prev - 1);
    
    try {
      const response = await fetch(`${API_URL}/articles/${article._id}/dislike`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setIsLiked(data.isLiked);
        setIsDisliked(data.isDisliked);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setIsDisliked(wasDisliked);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/article/${article._id}`;
    
    // Copy to clipboard
    await navigator.clipboard.writeText(shareUrl);
    
    // If authenticated, track share
    if (isAuthenticated && token) {
      try {
        const response = await fetch(`${API_URL}/articles/${article._id}/share`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setShares(data.shares);
        }
      } catch (error) {
        // Silently fail share tracking
      }
    }
    
    toast({
      title: "Link copied!",
      description: "Article link copied to clipboard.",
    });
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to bookmark articles.",
        variant: "destructive"
      });
      return;
    }
    
    // Optimistic update
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    
    try {
      const response = await fetch(`${API_URL}/articles/${article._id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
        toast({
          title: data.isBookmarked ? "Bookmarked!" : "Removed from bookmarks",
          description: data.isBookmarked 
            ? "Article saved to your bookmarks." 
            : "Article removed from bookmarks.",
        });
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      // Revert on error
      setIsBookmarked(wasBookmarked);
      toast({
        title: "Error",
        description: "Failed to update bookmark.",
        variant: "destructive"
      });
    }
  };

  if (featured) {
    return (
      <Link to={`/article/${article._id}`} className="group relative grid md:grid-cols-2 gap-0 overflow-hidden rounded-xl border border-white/10 bg-card hover:border-primary/50 transition-all duration-300 h-[500px]">
        <div className="relative h-full w-full overflow-hidden">
          <img 
            src={article.image} 
            alt={article.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-60 md:hidden" />
        </div>
        <div className="relative flex flex-col justify-center p-8 md:p-12 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="border-primary text-primary font-mono">
              {article.category}
            </Badge>
            {article.isLive && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-heading font-bold leading-tight mb-4 group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8 line-clamp-3">
            {article.excerpt}
          </p>
          
          <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-primary">By {article.author}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className={`${isLiked ? 'text-green-400' : 'text-muted-foreground'} hover:text-green-400`} 
                onClick={handleLike}
              >
                <ThumbsUp className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} /> {likes}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className={`${isBookmarked ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`} 
                onClick={handleBookmark}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-white" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/article/${article._id}`} className="group flex flex-col bg-card rounded-lg overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 h-full">
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2">
          <Badge className="bg-black/50 backdrop-blur-sm border-white/10 text-white">
            {article.category}
          </Badge>
        </div>
        {isBookmarked && (
          <div className="absolute top-2 right-2">
            <Bookmark className="w-5 h-5 text-primary fill-current" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
           <span className="font-mono text-primary">{article.author}</span>
           <span>{formatDistanceToNow(new Date(article.createdAt))} ago</span>
        </div>
        
        <h3 className="text-xl font-heading font-bold leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {article.excerpt}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewers?.toLocaleString() || 0}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className={`w-3 h-3 ${isLiked ? 'text-green-400' : ''}`} />
              {likes}
            </span>
          </div>
          
          <div className="flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className={`h-8 w-8 ${isLiked ? 'text-green-400' : 'hover:text-green-400'}`} 
              onClick={handleLike}
            >
              <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className={`h-8 w-8 ${isDisliked ? 'text-red-400' : 'hover:text-red-400'}`} 
              onClick={handleDislike}
            >
              <ThumbsDown className={`w-3 h-3 ${isDisliked ? 'fill-current' : ''}`} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className={`h-8 w-8 ${isBookmarked ? 'text-primary' : 'hover:text-primary'}`} 
              onClick={handleBookmark}
            >
              <Bookmark className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 hover:text-blue-400" 
              onClick={handleShare}
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ArticleCard;
