import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

export const notificationsRouter = Router();

// Helper to extract optional auth user ID
function getOptionalUserId(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ') || !JWT_SECRET) return undefined;
  try {
    const token = header.slice('Bearer '.length);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return undefined;
  }
}

// 1. List notifications + unread count
notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);
    const { category } = req.query;

    let typeFilter: any = undefined;
    if (category && category !== 'All') {
      const catLower = String(category).toLowerCase();
      if (catLower === 'orders' || catLower === 'order') {
        typeFilter = { in: ['order', 'orders'] };
      } else if (catLower === 'events' || catLower === 'event') {
        typeFilter = { in: ['event', 'events'] };
      } else if (catLower === 'investments' || catLower === 'investment') {
        typeFilter = { in: ['investment', 'investments'] };
      } else if (catLower === 'announcements' || catLower === 'announcement') {
        typeFilter = { in: ['announcement', 'announcements', 'system', 'service'] };
      } else {
        typeFilter = catLower;
      }
    }

    const whereClause: any = {
      OR: [
        { userId: null },
        ...(userId ? [{ userId }] : []),
      ],
      ...(typeFilter ? { type: typeFilter } : {}),
    };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 2. Mark single notification as read
notificationsRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// 3. Mark all as read
notificationsRouter.patch('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);

    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: null },
          ...(userId ? [{ userId }] : []),
        ],
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// 4. Dismiss / delete notification
notificationsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.notification.delete({ where: { id } });
    res.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// 5. Get notification preferences
notificationsRouter.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);

    if (!userId) {
      return res.json({
        orders: true,
        events: true,
        investments: true,
        announcements: true,
      });
    }

    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId,
          orders: true,
          events: true,
          investments: true,
          announcements: true,
        },
      });
    }

    res.json(pref);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// 6. Update notification preferences
notificationsRouter.patch('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);
    const { orders, events, investments, announcements } = req.body;

    if (!userId) {
      return res.json({
        orders: orders ?? true,
        events: events ?? true,
        investments: investments ?? true,
        announcements: announcements ?? true,
      });
    }

    const updated = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        orders: orders ?? true,
        events: events ?? true,
        investments: investments ?? true,
        announcements: announcements ?? true,
      },
      update: {
        ...(orders !== undefined ? { orders: Boolean(orders) } : {}),
        ...(events !== undefined ? { events: Boolean(events) } : {}),
        ...(investments !== undefined ? { investments: Boolean(investments) } : {}),
        ...(announcements !== undefined ? { announcements: Boolean(announcements) } : {}),
      },
    });

    res.json({
      success: true,
      preferences: updated,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});
