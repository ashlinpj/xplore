import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { VAPID_PUBLIC_KEY, getApiUrl } from '../lib/api';

const NotificationContext = createContext(null);

const checkPushSupport = () => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
};

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
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!isSupported) {
      console.log('[Push] Not supported in this browser');
      return;
    }

    console.log('[Push] Supported! Checking existing subscription...');
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

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

  const subscribe = useCallback(async (token = null) => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser. Try Chrome, Edge, or Firefox.');
    }

    const authToken = token || localStorage.getItem('token');

    try {
      setIsLoading(true);

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied. Please allow notifications in your browser settings.');
      }

      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      
      const swReg = await navigator.serviceWorker.ready;

      const subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

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

      subscriptionRef.current = subscription;
      setIsSubscribed(true);
      setUserPreference(true);
      
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

  const unsubscribe = useCallback(async (token = null) => {
    const authToken = token || localStorage.getItem('token');

    try {
      setIsLoading(true);

      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      if (subscriptionRef.current) {
        await fetch(getApiUrl('/api/notifications/unsubscribe'), {
          method: 'POST',
          headers,
          body: JSON.stringify({ endpoint: subscriptionRef.current.endpoint })
        });

        await subscriptionRef.current.unsubscribe();
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

  const syncWithUserPreference = useCallback(async (token) => {
    if (!isSupported || !token) return;
    
    try {
      const response = await fetch(getApiUrl('/api/notifications/preference'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPreference(data.pushNotificationsEnabled);
        
        if (data.pushNotificationsEnabled && !subscriptionRef.current) {
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
    subscribe,
    unsubscribe,
    toggleSubscription,
    syncWithUserPreference
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
