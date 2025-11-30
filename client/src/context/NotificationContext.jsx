import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { VAPID_PUBLIC_KEY, getApiUrl } from '../lib/api';

const NotificationContext = createContext(null);

// Check if push notifications are supported
const checkPushSupport = () => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
};

// Convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationProvider({ children }) {
  const [isSupported] = useState(() => checkPushSupport());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState('default');
  const [userPreference, setUserPreference] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef(null);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('xplore_notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) {
        console.log('[Notifications] Failed to parse saved notifications');
      }
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('xplore_notifications', JSON.stringify(notifications.slice(0, 20))); // Keep last 20
    }
  }, [notifications]);

  // Listen for messages from service worker
  useEffect(() => {
    if (!isSupported) return;

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        console.log('[Notifications] Received from SW:', event.data.payload);
        addNotification(event.data.payload);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [isSupported]);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: Date.now(),
      title: notification.title || 'New Notification',
      body: notification.body || '',
      url: notification.data?.url || '/',
      articleId: notification.data?.articleId,
      image: notification.image,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    setUnreadCount(prev => prev + 1);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('xplore_notifications');
  }, []);

  // Check support and existing subscription on mount
  useEffect(() => {
    if (!isSupported) {
      console.log('[Push] Not supported in this browser');
      return;
    }

    console.log('[Push] Supported! Checking existing subscription...');
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Register service worker early
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('[Push] Service Worker registered');
        return registration.pushManager.getSubscription();
      })
      .then(subscription => {
        if (subscription) {
          console.log('[Push] Found existing subscription');
          subscriptionRef.current = subscription;
          setIsSubscribed(true);
        }
      })
      .catch(err => console.log('[Push] SW registration error:', err));
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (token = null) => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser. Try Chrome, Edge, or Firefox.');
    }

    // If no token passed, try to get from localStorage
    const authToken = token || localStorage.getItem('token');

    try {
      setIsLoading(true);
      console.log('[Push] Starting subscription...');

      // Step 1: Request permission
      console.log('[Push] Requesting permission...');
      const permissionResult = await Notification.requestPermission();
      console.log('[Push] Permission result:', permissionResult);
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied. Please allow notifications in your browser settings.');
      }

      // Step 2: Register/get service worker
      console.log('[Push] Getting service worker...');
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      
      // Wait for the service worker to be ready
      const swReg = await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker is ready');

      // Step 3: Subscribe to push
      console.log('[Push] Creating push subscription...');
      const subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('[Push] Subscription created:', subscription.endpoint);

      // Step 4: Send subscription to server with auth token
      console.log('[Push] Saving to server...');
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(getApiUrl('/api/notifications/subscribe'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ subscription: subscription.toJSON() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save subscription');
      }

      console.log('[Push] Subscription saved! You will now receive push notifications.');
      subscriptionRef.current = subscription;
      setIsSubscribed(true);
      setUserPreference(true);
      
      // Show a test notification
      await swReg.showNotification('🔔 Notifications Enabled!', {
        body: 'You will now receive alerts when new articles are posted.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        tag: 'welcome-notification'
      });
      
      return true;
    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (token = null) => {
    // If no token passed, try to get from localStorage
    const authToken = token || localStorage.getItem('token');

    try {
      setIsLoading(true);
      console.log('[Push] Unsubscribing...');

      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      if (subscriptionRef.current) {
        // Unsubscribe on server
        await fetch(getApiUrl('/api/notifications/unsubscribe'), {
          method: 'POST',
          headers,
          body: JSON.stringify({ endpoint: subscriptionRef.current.endpoint })
        });

        // Unsubscribe locally
        await subscriptionRef.current.unsubscribe();
        console.log('[Push] Unsubscribed successfully');
      }

      subscriptionRef.current = null;
      setIsSubscribed(false);
      setUserPreference(false);
      
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync with user preference when logged in (called from AuthContext)
  const syncWithUserPreference = useCallback(async (token) => {
    if (!isSupported || !token) return;
    
    try {
      console.log('[Push] Syncing with user preference...');
      const response = await fetch(getApiUrl('/api/notifications/preference'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPreference(data.pushNotificationsEnabled);
        
        // If user has notifications enabled but this device isn't subscribed, auto-subscribe
        if (data.pushNotificationsEnabled && !subscriptionRef.current) {
          console.log('[Push] User preference is enabled, auto-subscribing this device...');
          try {
            await subscribe(token);
          } catch (error) {
            console.log('[Push] Auto-subscribe failed (permission may be needed):', error.message);
          }
        }
      }
    } catch (error) {
      console.log('[Push] Failed to sync preference:', error);
    }
  }, [isSupported, subscribe]);

  // Toggle subscription
  const toggleSubscription = useCallback(async () => {
    if (isSubscribed) {
      return await unsubscribe();
    } else {
      return await subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  const value = {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    userPreference,
    notifications,
    unreadCount,
    subscribe,
    unsubscribe,
    toggleSubscription,
    syncWithUserPreference,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
