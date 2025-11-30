import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { X, Bell, ChevronRight } from 'lucide-react';

export function NotificationPopup() {
  const { popupNotification, dismissPopup } = useNotifications();
  const navigate = useNavigate();

  if (!popupNotification) return null;

  const handleClick = () => {
    if (popupNotification.url) {
      navigate(popupNotification.url);
    }
    dismissPopup();
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] p-3 animate-slide-down"
      style={{
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <div 
        className="max-w-lg mx-auto bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-2xl shadow-primary/20 overflow-hidden cursor-pointer"
        onClick={handleClick}
      >
        {/* Colored top bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-green-400 to-primary" />
        
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">New Article</span>
                <span className="text-xs text-muted-foreground">Just now</span>
              </div>
              <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                {popupNotification.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {popupNotification.body}
              </p>
              
              {/* Tap to read indicator */}
              <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                <span>Tap to read</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
            
            {/* Close button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                dismissPopup();
              }}
              className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* Progress bar that shows auto-dismiss timer */}
        <div className="h-0.5 bg-muted">
          <div 
            className="h-full bg-primary"
            style={{
              animation: 'shrink 6s linear forwards'
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

export default NotificationPopup;
