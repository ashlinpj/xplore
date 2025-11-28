import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { LiveTicker } from '../components/LiveTicker';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { ThumbsUp, ThumbsDown, Share2, Eye, MessageSquare, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { articlesAPI } from '../lib/api';
import { useToast } from '../context/ToastContext';

// Mock article for fallback
const MOCK_ARTICLE = {
  _id: "1",
  title: "The Quantum Leap: Next-Gen Processors Are Here",
  excerpt: "Intel and AMD's latest chips promise a 40% performance boost in AI workloads.",
  content: `The semiconductor industry has reached a pivotal moment with the announcement of next-generation processors from both Intel and AMD. These new chips represent a quantum leap in computing capability, promising a staggering 40% performance improvement in AI-related workloads.

The technological advancement comes at a crucial time when artificial intelligence applications are becoming increasingly demanding. From machine learning model training to real-time inference, the new processors are designed to handle the computational heavy lifting that modern AI requires.

Industry analysts predict that these chips will accelerate the adoption of AI across various sectors, from healthcare to autonomous vehicles. The improved energy efficiency also addresses growing concerns about the environmental impact of data centers.`,
  author: "Sarah Jenkins",
  createdAt: new Date().toISOString(),
  category: "Hardware",
  image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000",
  viewers: 1240,
  likes: 850,
  dislikes: 12,
  isLive: true,
};

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data } = await articlesAPI.getOne(id);
        setArticle(data);
        setLikes(data.likes);
        setDislikes(data.dislikes);
      } catch (error) {
        console.log('Using mock article');
        setArticle(MOCK_ARTICLE);
        setLikes(MOCK_ARTICLE.likes);
        setDislikes(MOCK_ARTICLE.dislikes);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleLike = async () => {
    try {
      const { data } = await articlesAPI.like(id);
      setLikes(data.likes);
      setDislikes(data.dislikes);
    } catch (error) {
      setLikes(prev => prev + 1);
    }
  };

  const handleDislike = async () => {
    try {
      const { data } = await articlesAPI.dislike(id);
      setLikes(data.likes);
      setDislikes(data.dislikes);
    } catch (error) {
      setDislikes(prev => prev + 1);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Article link copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse text-xl font-heading">Loading...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-heading font-bold mb-4">Article Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <LiveTicker />

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6 text-muted-foreground hover:text-primary"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <header className="mb-8 text-center">
           <div className="flex items-center justify-center gap-2 mb-6">
              <Badge variant="outline" className="border-primary text-primary text-sm px-3 py-1">
                {article.category}
              </Badge>
              {article.isLive && (
                <Badge variant="destructive" className="animate-pulse">
                  LIVE COVERAGE
                </Badge>
              )}
           </div>
           
           <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight mb-6 text-balance">
             {article.title}
           </h1>
           
           <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
             {article.excerpt}
           </p>
           
           <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground border-y border-white/10 py-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${article.author}`} />
                  <AvatarFallback>{article.author[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{article.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(article.createdAt), "MMM d, yyyy • h:mm a")}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.viewers?.toLocaleString() || 0}
              </div>
           </div>
        </header>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-10 border border-white/10 shadow-2xl">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
        </div>

        <div className="prose prose-invert prose-lg max-w-none font-serif">
          {article.content?.split('\n\n').map((paragraph, index) => (
            <p key={index} className={index === 0 ? "text-xl mb-6 first-letter:text-5xl first-letter:font-bold first-letter:mr-1 first-letter:float-left" : ""}>
              {paragraph}
            </p>
          ))}
          
          <blockquote className="border-l-4 border-primary pl-4 italic text-xl my-8 text-white/80 bg-white/5 p-4 rounded-r-lg">
            "Technology is best when it brings people together."
          </blockquote>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="gap-2 border-white/10 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                onClick={handleLike}
              >
                <ThumbsUp className="w-4 h-4" /> Like ({likes})
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                onClick={handleDislike}
              >
                <ThumbsDown className="w-4 h-4" /> Dislike ({dislikes})
              </Button>
            </div>
            
            <div className="flex gap-4">
              <Button variant="ghost" className="gap-2">
                <MessageSquare className="w-4 h-4" /> Comments (12)
              </Button>
              <Button variant="ghost" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" /> Share
              </Button>
            </div>
          </div>
        </div>
      </article>

      <footer className="border-t border-white/10 mt-20 bg-black py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 XPLORE Media Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
