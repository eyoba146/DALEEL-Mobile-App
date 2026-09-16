import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(sampleNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await notificationsApi.list(token);
      if (res && Array.isArray(res.notifications) && res.notifications.length > 0) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      } else {
        setNotifications(sampleNotifications);
        setUnreadCount(sampleNotifications.filter((n) => !n.isRead).length);
      }
    } catch {
      // Fallback
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter((n) => !n.isRead).length);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationsApi.markAsRead(id, token);
      } catch (err) {
        console.warn('Failed to mark notification as read:', err);
      }
    },
    [token]
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationsApi.markAllAsRead(token);
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
    }
  }, [token]);

  const dismissNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      const wasUnread = target && !target.isRead;

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationsApi.dismiss(id, token);
      } catch (err) {
        console.warn('Failed to dismiss notification:', err);
      }
    },
    [notifications, token]
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
      }}
    >
      {children}
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
