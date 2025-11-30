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
import { Search, Menu, X, Bell, BellOff, BellRing, Bookmark, Shield, LogOut, Settings, User, Home, Loader2, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { 
    isSupported, 
    isSubscribed, 
    isLoading: notifLoading, 
    toggleSubscription,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
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
            
            {/* Notification Dropdown - Always show on desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`hidden md:flex relative ${isSubscribed ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                  {notifLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSubscribed ? (
                    <BellRing className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-card border-white/10" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Notifications</span>
                    <div className="flex gap-1">
                      {notifications.length > 0 && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Read all
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-red-400"
                            onClick={(e) => { e.preventDefault(); clearNotifications(); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                
                {/* Notification toggle */}
                <DropdownMenuItem 
                  className="focus:bg-white/5 cursor-pointer"
                  onClick={handleNotificationToggle}
                  disabled={notifLoading}
                >
                  {isSubscribed ? (
                    <>
                      <BellOff className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Turn off notifications</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-primary">Turn on notifications</span>
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-white/10" />
                
                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No notifications yet</p>
                      {!isSubscribed && (
                        <p className="text-xs mt-1">Enable notifications to get updates</p>
                      )}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <DropdownMenuItem 
                        key={notif.id}
                        className={`focus:bg-white/5 cursor-pointer flex flex-col items-start gap-1 py-3 ${!notif.read ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.url) navigate(notif.url);
                        }}
                      >
                        <div className="flex items-start gap-2 w-full">
                          {!notif.read && (
                            <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                          )}
                          <div className={`flex-1 ${notif.read ? 'pl-4' : ''}`}>
                            <p className="font-medium text-sm line-clamp-1">{notif.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg w-full transition-colors ${
                  isSubscribed 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {notifLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSubscribed ? (
                    <BellRing className="w-5 h-5" />
                  ) : (
                    <BellOff className="w-5 h-5" />
                  )}
                  {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
                </div>
                {unreadCount > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Recent notifications in mobile menu */}
              {notifications.length > 0 && (
                <div className="mt-2 ml-3 mr-1 space-y-1">
                  <p className="text-xs text-muted-foreground px-2 mb-1">Recent:</p>
                  {notifications.slice(0, 3).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.url) navigate(notif.url);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-2 rounded text-xs hover:bg-white/5 ${!notif.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.read && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1 flex-shrink-0" />}
                        <div className={!notif.read ? '' : 'pl-3.5'}>
                          <p className="line-clamp-1 font-medium">{notif.title}</p>
                          <p className="text-muted-foreground line-clamp-1">{notif.body}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
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