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
  const subscriptionRef = useRef(null);

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

  // Subscribe to push notifications (real mobile-like notifications)
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser. Try Chrome, Edge, or Firefox.');
    }

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
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      
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

      // Step 4: Send subscription to server
      console.log('[Push] Saving to server...');
      const response = await fetch(getApiUrl('/api/notifications/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save subscription');
      }

      console.log('[Push] Subscription saved! You will now receive push notifications.');
      subscriptionRef.current = subscription;
      setIsSubscribed(true);
      
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
  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[Push] Unsubscribing...');

      if (subscriptionRef.current) {
        // Unsubscribe on server
        await fetch(getApiUrl('/api/notifications/unsubscribe'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscriptionRef.current.endpoint })
        });

        // Unsubscribe locally
        await subscriptionRef.current.unsubscribe();
        console.log('[Push] Unsubscribed successfully');
      }

      subscriptionRef.current = null;
      setIsSubscribed(false);
      
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    subscribe,
    unsubscribe,
    toggleSubscription
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
