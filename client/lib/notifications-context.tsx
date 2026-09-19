import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import InAppNotificationBanner from '../components/InAppNotificationBanner';
import { AppNotification, notificationsApi } from './api';
import { useAuth } from './auth-context';

export const sampleNotifications: AppNotification[] = [
  {
    id: 'notif1',
    title: 'Welcome to DALEEL Diaspora Bridge',
    message: 'Your unified digital bridge for authentic Ethiopian heritage, vetted services, artisan crafts, and investment opportunities.',
    type: 'system',
    actionUrl: '/(tabs)/explore',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif2',
    title: 'Upcoming Cultural Gathering: Timkat Epiphany',
    message: 'Timkat sacred baptismal celebrations begin in Lalibela and Gondar in 12 days. Check schedule and reserve accommodation.',
    type: 'event',
    actionUrl: '/event/e1',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'notif3',
    title: 'Artisan Marketplace: Direct Shipping Available',
    message: 'Master weavers in Shiro Meda and Bonga micro-roasters now offer international DHL diaspora air cargo dispatch.',
    type: 'order',
    actionUrl: '/marketplace',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'notif4',
    title: 'Diaspora Investment Hub: Bole Residences',
    message: 'Off-plan units in Bole Atlas SkyLine Luxury Residences are open for diaspora syndicate fractional ownership.',
    type: 'investment',
    actionUrl: '/investment/inv1',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'notif5',
    title: 'Legal & Relocation Concierge: Yellow Card Assistance',
    message: 'Verified legal partners in Bole are accepting foreign citizen of Ethiopian origin identity card (Yellow Card) renewals.',
    type: 'service',
    actionUrl: '/service/s2',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

type NotificationsContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: (category?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  triggerAlert: (notification: AppNotification) => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(sampleNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<AppNotification | null>(null);

  // Keep track of seen notification IDs to detect brand new incoming alerts
  const knownNotificationIdsRef = useRef<Set<string>>(new Set(sampleNotifications.map((n) => n.id)));
  const isInitialLoadRef = useRef(true);

  const refreshNotifications = useCallback(
    async (category?: string) => {
      try {
        setIsLoading(true);
        const res = await notificationsApi.list(token, category);
        if (res && Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);

          // Check if any notification is new and unread
          if (!isInitialLoadRef.current) {
            const incomingNew = res.notifications.find(
              (n) => !n.isRead && !knownNotificationIdsRef.current.has(n.id)
            );
            if (incomingNew) {
              setActiveAlert(incomingNew);
            }
          }

          // Update known set
          const updatedSet = new Set(knownNotificationIdsRef.current);
          res.notifications.forEach((n) => updatedSet.add(n.id));
          knownNotificationIdsRef.current = updatedSet;
          isInitialLoadRef.current = false;
        }
      } catch (err) {
        // Only keep sample on network error if notifications are empty
        if (notifications.length === 0) {
          setNotifications(sampleNotifications);
          setUnreadCount(sampleNotifications.filter((n) => !n.isRead).length);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [token, notifications.length]
  );

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Periodic polling for real-time alerts (every 15s)
  useEffect(() => {
    const timer = setInterval(() => {
      refreshNotifications();
    }, 15000);

    return () => clearInterval(timer);
  }, [refreshNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (activeAlert?.id === id) {
        setActiveAlert(null);
      }

      try {
        await notificationsApi.markAsRead(id, token);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
    },
    [token, activeAlert?.id]
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setActiveAlert(null);

    try {
      await notificationsApi.markAllAsRead(token);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  }, [token]);

  const dismissNotification = useCallback(
    async (id: string) => {
      // Instant optimistic local removal
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
      if (activeAlert?.id === id) {
        setActiveAlert(null);
      }

      try {
        await notificationsApi.dismiss(id, token);
      } catch (err) {
        console.warn('Failed to dismiss notification:', err);
      }
    },
    [token, activeAlert?.id]
  );

  const clearAllNotifications = useCallback(async () => {
    // Instant optimistic clearing
    setNotifications([]);
    setUnreadCount(0);
    setActiveAlert(null);

    try {
      await notificationsApi.clearAll(token);
    } catch (err) {
      console.warn('Failed to clear all notifications:', err);
    }
  }, [token]);

  const triggerAlert = useCallback((notification: AppNotification) => {
    setActiveAlert(notification);
    // Add to known set so it doesn't re-trigger from polling
    knownNotificationIdsRef.current.add(notification.id);
  }, []);

  const handleOpenAlert = useCallback(
    (notification: AppNotification) => {
      markAsRead(notification.id);
      setActiveAlert(null);
      if (notification.actionUrl) {
        router.push(notification.actionUrl as any);
      } else {
        router.push('/notifications');
      }
    },
    [markAsRead, router]
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAllNotifications,
        triggerAlert,
      }}
    >
      {children}
      <InAppNotificationBanner
        notification={activeAlert}
        onDismiss={() => setActiveAlert(null)}
        onOpen={handleOpenAlert}
      />
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
