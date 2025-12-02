import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { AuthModal } from './AuthModal';
import { Button } from './ui/Button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Search, Menu, X, Bell, BellOff, BellRing, Bookmark, Shield, LogOut, Settings, User, Home, Loader2 } from 'lucide-react';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { 
    isSupported, 
    isSubscribed, 
    isLoading: notifLoading, 
    toggleSubscription
  } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const searchInputRef = useRef(null);

  // Focus search input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
      setSearchOpen(false);
      setMobileMenuOpen(false);
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
    navigate('/');
  };

  const handleNotificationToggle = async () => {
    // Check if push is supported
    if (!isSupported) {
      showToast('Push notifications are not supported in this browser. Try Chrome, Edge, or Firefox.', 'error');
      return;
    }
    
    try {
      const wasSubscribed = isSubscribed;
      await toggleSubscription();
      if (wasSubscribed) {
        showToast('Notifications turned off', 'success');
      }
      // Success message for subscribe is shown via the test notification
    } catch (error) {
      console.error('Notification toggle error:', error);
      if (error.message?.includes('denied')) {
        showToast('Please allow notifications in your browser settings', 'error');
      } else {
        showToast(error.message || 'Failed to enable notifications', 'error');
      }
    }
  };

  const categories = [
    { name: 'Tech', href: '/?category=tech' },
    { name: 'Science', href: '/?category=science' },
    { name: 'Space', href: '/?category=space' },
    { name: 'Cars', href: '/?category=automotive' },
    { name: 'Reviews', href: '/?category=reviews' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-8 h-8 bg-primary flex items-center justify-center font-bold text-black rounded-sm skew-x-[-10deg]">
                X
              </div>
              <span className="font-heading font-bold text-2xl tracking-tighter">XPLORE</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              {categories.map((cat) => (
                <Link 
                  key={cat.name}
                  to={cat.href} 
                  className="hover:text-primary transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-primary"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>
            
            {/* Notification Toggle Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={`hidden md:flex ${isSubscribed ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              onClick={handleNotificationToggle}
              disabled={notifLoading}
              title={isSubscribed ? 'Notifications On - Click to turn off' : 'Turn on notifications'}
            >
              {notifLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSubscribed ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border border-primary/50">
                      <AvatarImage src={user.avatar} alt={user.username || 'User'} />
                      <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-white/10" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center gap-2">
                        {user.username}
                        {isAdmin && (
                          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Admin</span>
                        )}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email || 'user@example.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem 
                        className="focus:bg-white/5 cursor-pointer text-primary" 
                        onClick={() => navigate('/admin')}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                    </>
                  )}
                  <DropdownMenuItem 
                    className="focus:bg-white/5 cursor-pointer" 
                    onClick={() => navigate('/bookmarks')}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="focus:bg-white/5 text-red-400 cursor-pointer" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:block">
                <AuthModal />
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-white/10 bg-background/95 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-muted border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button type="submit" className="bg-primary text-black hover:bg-primary/90">
                  Search
                </Button>
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div 
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-background border-r border-white/10 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-8 h-8 bg-primary flex items-center justify-center font-bold text-black rounded-sm skew-x-[-10deg]">
                X
              </div>
              <span className="font-heading font-bold text-xl tracking-tighter">XPLORE</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Search */}
          <div className="p-4 border-b border-white/10">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <Button type="submit" size="icon" className="bg-primary text-black hover:bg-primary/90">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              <Link 
                to="/" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                Home
              </Link>
              
              {/* Notification Toggle for Mobile - Always show */}
              <button
                onClick={() => {
                  handleNotificationToggle();
                }}
                disabled={notifLoading}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-colors ${
                  isSubscribed 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                {notifLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSubscribed ? (
                  <BellRing className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
                {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
              </button>
              
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
              </div>
              
              {categories.map((cat) => (
                <Link 
                  key={cat.name}
                  to={cat.href} 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}

              {user && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
                  </div>
                  
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-primary hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="w-5 h-5" />
                      Admin Dashboard
                    </Link>
                  )}
                  
                  <Link 
                    to="/bookmarks" 
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bookmark className="w-5 h-5" />
                    Bookmarks
                  </Link>
                  
                  <button
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-white transition-colors w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </button>
                  
                  <button
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-white/5 hover:text-white transition-colors w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-white/10">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3">
                  <Avatar className="h-10 w-10 border border-primary/50">
                    <AvatarImage src={user.avatar} alt={user.username || 'User'} />
                    <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {user.username || 'User'}
                      {isAdmin && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Admin</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </div>
            ) : (
              <AuthModal />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;