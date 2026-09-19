import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { authenticateAdmin, requireRole, AdminRequest } from '../middleware/adminAuth';
import { AdminRole } from '@prisma/client';
import {
  sendOrderStatusEmail,
  sendServiceInquiryStatusEmail,
  sendEventRsvpStatusEmail,
  sendInvestmentInquiryStatusEmail,
} from '../lib/email';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const adminRouter = Router();

// --- Administrative Authentication ---

adminRouter.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Administrative account not found' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid administrative credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, adminRole: user.adminRole || AdminRole.SUPER_ADMIN },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        adminRole: user.adminRole || AdminRole.SUPER_ADMIN,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Failed to process admin login' });
  }
});

// Unauthenticated Administrative Password Recovery Request
adminRouter.post('/forgot-password', async (req, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.isAdmin) {
      return res.json({
        success: true,
        message: 'If an administrative account exists for this address, a reset request has been logged for the Super Administrator.',
      });
    }

    // Alert all Super Admins in the platform notifications
    const superAdmins = await prisma.user.findMany({
      where: { isAdmin: true, adminRole: AdminRole.SUPER_ADMIN },
      select: { id: true },
    });

    for (const sa of superAdmins) {
      await prisma.notification.create({
        data: {
          userId: sa.id,
          title: 'Administrative Password Reset Requested',
          message: `Coordinator ${user.name} (${user.email}, Role: ${user.adminRole}) has requested a password reset. You can assign a new credential from the Administrative Team portal.`,
          type: 'system',
        },
      });
    }

    res.json({
      success: true,
      message: 'Password reset request registered with the Super Administrator.',
      coordinatorName: user.name,
      coordinatorEmail: user.email,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password recovery request' });
  }
});

// All subsequent routes require a verified admin token
adminRouter.use(authenticateAdmin as any);

adminRouter.get('/me', (req: AdminRequest, res: Response) => {
  const user = req.adminUser!;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    adminRole: user.adminRole || AdminRole.SUPER_ADMIN,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  });
});

// Update current admin profile
adminRouter.patch('/profile', async (req: AdminRequest, res: Response) => {
  try {
    const user = req.adminUser!;
    const { name, phone, avatarUrl } = req.body;

    const updateData: any = {};
    if (name) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        phone: true,
        avatarUrl: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ error: 'Failed to update administrative profile' });
  }
});

// Change current admin password
adminRouter.post('/change-password', async (req: AdminRequest, res: Response) => {
  try {
    const user = req.adminUser!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, fullUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password does not match' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// --- Image & Media Upload (Base64 & Camera) ---

adminRouter.post('/upload', async (req: AdminRequest, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const matches = String(imageBase64).match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(String(imageBase64), 'base64');
    }

    const uniqueName = `daleel-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'http';
    const url = `${protocol}://${host}/uploads/${uniqueName}`;

    res.json({ url, filename: uniqueName });
  } catch (error) {
    console.error('Error uploading admin image:', error);
    res.status(500).json({ error: 'Failed to process image upload' });
  }
});

// --- Platform Stats Overview ---

adminRouter.get('/stats', async (_req: AdminRequest, res: Response) => {
  try {
    const [
      destinationsCount,
      servicesCount,
      eventsCount,
      productsCount,
      investmentsCount,
      serviceInquiriesCount,
      productOrdersCount,
      eventRsvpsCount,
      investmentInquiriesCount,
      adminTeamCount,
      registeredUsersCount,
    ] = await Promise.all([
      prisma.destination.count(),
      prisma.service.count(),
      prisma.eventItem.count(),
      prisma.product.count(),
      prisma.investmentOpportunity.count(),
      prisma.serviceInquiry.count(),
      prisma.productOrderInquiry.count(),
      prisma.eventRsvp.count(),
      prisma.investmentInquiry.count(),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.user.count({ where: { isAdmin: false } }),
    ]);

    res.json({
      destinationsCount,
      servicesCount,
      eventsCount,
      productsCount,
      investmentsCount,
      serviceInquiriesCount,
      productOrdersCount,
      eventRsvpsCount,
      investmentInquiriesCount,
      adminTeamCount,
      registeredUsersCount,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch platform metrics' });
  }
});

// --- Team & Role Management (Super Admin only) ---

adminRouter.get(
  '/team',
  requireRole([AdminRole.SUPER_ADMIN]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const team = await prisma.user.findMany({
        where: { isAdmin: true },
        select: {
          id: true,
          name: true,
          email: true,
          adminRole: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
      res.json(team);
    } catch (error) {
      console.error('Error fetching admin team:', error);
      res.status(500).json({ error: 'Failed to fetch administrative team' });
    }
  }
);

adminRouter.post(
  '/team',
  requireRole([AdminRole.SUPER_ADMIN]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const { name, email, password, adminRole, phone } = req.body;
      if (!name || !email || !password || !adminRole) {
        return res.status(400).json({ error: 'Name, email, password, and adminRole are required' });
      }

      const existing = await prisma.user.findUnique({
        where: { email: String(email).trim().toLowerCase() },
      });

      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await prisma.user.create({
        data: {
          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          passwordHash: hashedPassword,
          isAdmin: true,
          adminRole: adminRole as AdminRole,
          isVerified: true,
          userType: 'diaspora',
          country: 'Ethiopia',
          phone: phone ? String(phone).trim() : null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          adminRole: true,
          phone: true,
          createdAt: true,
        },
      });

      res.status(201).json(newAdmin);
    } catch (error) {
      console.error('Error creating admin team member:', error);
      res.status(500).json({ error: 'Failed to create team member' });
    }
  }
);

adminRouter.patch(
  '/team/:id',
  requireRole([AdminRole.SUPER_ADMIN]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, adminRole, phone, password } = req.body;

      const updateData: any = {};
      if (name) updateData.name = String(name).trim();
      if (adminRole) updateData.adminRole = adminRole as AdminRole;
      if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
      if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          adminRole: true,
          phone: true,
          updatedAt: true,
        },
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating admin member:', error);
      res.status(500).json({ error: 'Failed to update team member' });
    }
  }
);

// Super Admin direct password reset for team coordinator
adminRouter.post(
  '/team/:id/reset-password',
  requireRole([AdminRole.SUPER_ADMIN]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { newPassword } = req.body;

      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const targetUser = await prisma.user.update({
        where: { id },
        data: { passwordHash: hashedPassword },
        select: {
          id: true,
          name: true,
          email: true,
          adminRole: true,
        },
      });

      res.json({
        success: true,
        message: `Password for ${targetUser.name} (${targetUser.email}) has been reset successfully.`,
      });
    } catch (error) {
      console.error('Error resetting coordinator password:', error);
      res.status(500).json({ error: 'Failed to reset coordinator password' });
    }
  }
);

adminRouter.delete(
  '/team/:id',
  requireRole([AdminRole.SUPER_ADMIN]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (req.adminUser?.id === id) {
        return res.status(400).json({ error: 'Cannot remove your own administrative account' });
      }

      await prisma.user.delete({ where: { id } });
      res.json({ success: true, message: 'Team member removed' });
    } catch (error) {
      console.error('Error deleting admin member:', error);
      res.status(500).json({ error: 'Failed to delete team member' });
    }
  }
);

// --- Real-time Floating Sidebar Notification Counts ---

adminRouter.get(
  '/sidebar-counts',
  async (req: AdminRequest, res: Response) => {
    try {
      const role = req.adminUser?.adminRole;
      const canAccessServices = role === AdminRole.SUPER_ADMIN || role === AdminRole.SERVICE_MANAGER || role === AdminRole.DESTINATION_MANAGER;
      const canAccessEvents = role === AdminRole.SUPER_ADMIN || role === AdminRole.EVENT_MANAGER;
      const canAccessMarketplace = role === AdminRole.SUPER_ADMIN || role === AdminRole.MARKETPLACE_MANAGER;
      const canAccessInvestments = role === AdminRole.SUPER_ADMIN || role === AdminRole.INVESTMENT_OFFICER;
      const isSuperAdmin = role === AdminRole.SUPER_ADMIN;

      const activeStatuses = ['pending', 'in_review', 'waitlist'];

      const [servicesCount, eventsCount, marketplaceCount, investmentsCount, unverifiedUsersCount] = await Promise.all([
        canAccessServices ? prisma.serviceInquiry.count({ where: { status: { in: activeStatuses, mode: 'insensitive' } } }) : 0,
        canAccessEvents ? prisma.eventRsvp.count({ where: { status: { in: activeStatuses, mode: 'insensitive' } } }) : 0,
        canAccessMarketplace ? prisma.productOrderInquiry.count({ where: { status: { in: activeStatuses, mode: 'insensitive' } } }) : 0,
        canAccessInvestments ? prisma.investmentInquiry.count({ where: { status: { in: activeStatuses, mode: 'insensitive' } } }) : 0,
        isSuperAdmin ? prisma.user.count({ where: { isAdmin: false, isVerified: false } }) : 0,
      ]);

      const totalPending = servicesCount + eventsCount + marketplaceCount + investmentsCount;

      res.json({
        totalPending,
        services: servicesCount,
        events: eventsCount,
        marketplace: marketplaceCount,
        investments: investmentsCount,
        unverifiedUsers: unverifiedUsersCount,
      });
    } catch (error) {
      console.error('Error fetching sidebar counts:', error);
      res.status(500).json({ error: 'Failed to fetch notification counts' });
    }
  }
);

// --- Registered Mobile Members Directory (Super Admin Only) ---

adminRouter.get(
  '/users',
  requireRole([AdminRole.SUPER_ADMIN]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const { search, userType, isVerified, page = '1', limit = '50' } = req.query;

      const whereClause: any = {
        isAdmin: false,
      };

      if (userType && userType !== 'all') {
        whereClause.userType = String(userType);
      }

      if (isVerified === 'true') {
        whereClause.isVerified = true;
      } else if (isVerified === 'false') {
        whereClause.isVerified = false;
      }

      if (search && String(search).trim()) {
        const query = String(search).trim();
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { country: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ];
      }

      const take = Math.min(Math.max(Number(limit) || 50, 1), 100);
      const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            country: true,
            language: true,
            isVerified: true,
            isActive: true,
            phone: true,
            savedAddress: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                favorites: true,
                serviceInquiries: true,
                eventRsvps: true,
                productOrderInquiries: true,
                investmentInquiries: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      res.json({
        users,
        total,
        page: Number(page) || 1,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      console.error('Error fetching registered users:', error);
      res.status(500).json({ error: 'Failed to fetch registered members' });
    }
  }
);

adminRouter.patch(
  '/users/:id',
  requireRole([AdminRole.SUPER_ADMIN]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { isActive, revokeVerification, isVerified, phone, country, userType } = req.body;

      if (isVerified === true) {
        return res.status(400).json({
          error: 'Email verification can only be performed by the registered user via the 6-digit security code sent to their inbox. Administrators can deactivate accounts or revoke email verification, but cannot forge verification.',
        });
      }

      const updateData: any = {};
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (revokeVerification === true || isVerified === false) updateData.isVerified = false;
      if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
      if (country !== undefined) updateData.country = String(country).trim();
      if (userType !== undefined) updateData.userType = String(userType);

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          country: true,
          language: true,
          isVerified: true,
          isActive: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              favorites: true,
              serviceInquiries: true,
              eventRsvps: true,
              productOrderInquiries: true,
              investmentInquiries: true,
            },
          },
        },
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update member profile' });
    }
  }
);

// --- Role-Based Master Triage Desk ---

adminRouter.get(
  '/inquiries/unified',
  async (req: AdminRequest, res: Response) => {
    try {
      const role = req.adminUser?.adminRole;
      const { department, status, search } = req.query;

      // Determine which modules the coordinator can access
      const canAccessServices = role === AdminRole.SUPER_ADMIN || role === AdminRole.SERVICE_MANAGER || role === AdminRole.DESTINATION_MANAGER;
      const canAccessEvents = role === AdminRole.SUPER_ADMIN || role === AdminRole.EVENT_MANAGER;
      const canAccessMarketplace = role === AdminRole.SUPER_ADMIN || role === AdminRole.MARKETPLACE_MANAGER;
      const canAccessInvestments = role === AdminRole.SUPER_ADMIN || role === AdminRole.INVESTMENT_OFFICER;

      const shouldFetchServices = canAccessServices && (!department || department === 'all' || department === 'services');
      const shouldFetchEvents = canAccessEvents && (!department || department === 'all' || department === 'events');
      const shouldFetchMarketplace = canAccessMarketplace && (!department || department === 'all' || department === 'marketplace');
      const shouldFetchInvestments = canAccessInvestments && (!department || department === 'all' || department === 'investments');

      const promises: Promise<any>[] = [];

      if (shouldFetchServices) {
        promises.push(
          prisma.serviceInquiry.findMany({
            include: { service: { select: { id: true, name: true, category: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
          }).then(list => list.map(item => ({
            id: item.id,
            module: 'SERVICES',
            moduleLabel: 'Verified Service',
            title: item.service.name,
            customerName: item.fullName,
            customerEmail: item.contactEmail,
            customerPhone: item.contactPhone,
            customerWhatsapp: item.contactWhatsapp,
            status: item.status,
            createdAt: item.createdAt,
            details: {
              category: item.service.category,
              timeframe: item.timeframe,
              message: item.message,
            },
          })))
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      if (shouldFetchEvents) {
        promises.push(
          prisma.eventRsvp.findMany({
            include: { event: { select: { id: true, title: true, city: true, venue: true, date: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
          }).then(list => list.map(item => ({
            id: item.id,
            module: 'EVENTS',
            moduleLabel: 'Event Gathering',
            title: item.event.title,
            customerName: item.fullName,
            customerEmail: item.email,
            customerPhone: item.phone,
            customerWhatsapp: null,
            status: item.status,
            createdAt: item.createdAt,
            details: {
              ticketsCount: item.ticketsCount,
              eventDate: item.event.date,
              location: `${item.event.venue ? `${item.event.venue}, ` : ''}${item.event.city}`,
              notes: item.notes,
            },
          })))
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      if (shouldFetchMarketplace) {
        promises.push(
          prisma.productOrderInquiry.findMany({
            include: { product: { select: { id: true, title: true, price: true, currency: true, category: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
          }).then(list => list.map(item => ({
            id: item.id,
            module: 'MARKETPLACE',
            moduleLabel: 'Artisan Marketplace',
            title: `${item.product.title} (x${item.quantity})`,
            customerName: item.fullName,
            customerEmail: item.email,
            customerPhone: item.phone,
            customerWhatsapp: item.whatsapp,
            status: item.status,
            createdAt: item.createdAt,
            details: {
              productTitle: item.product.title,
              quantity: item.quantity,
              unitPrice: `${item.product.price} ${item.product.currency}`,
              totalPrice: `${(item.product.price * item.quantity).toFixed(2)} ${item.product.currency}`,
              deliveryAddress: item.deliveryAddress,
              notes: item.notes,
            },
          })))
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      if (shouldFetchInvestments) {
        promises.push(
          prisma.investmentInquiry.findMany({
            include: { opportunity: { select: { id: true, title: true, sector: true, expectedReturn: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
          }).then(list => list.map(item => ({
            id: item.id,
            module: 'INVESTMENTS',
            moduleLabel: 'Diaspora Investment',
            title: item.opportunity.title,
            customerName: item.fullName,
            customerEmail: item.contactEmail,
            customerPhone: item.contactPhone,
            customerWhatsapp: item.contactWhatsapp,
            status: item.status,
            createdAt: item.createdAt,
            details: {
              sector: item.opportunity.sector,
              targetReturn: item.opportunity.expectedReturn,
              investmentBudget: item.investmentBudget,
              timeframe: item.timeframe,
              message: item.message,
            },
          })))
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      const [servicesInqs, eventsInqs, marketplaceInqs, investmentsInqs] = await Promise.all(promises);
      const allUnified = [...servicesInqs, ...eventsInqs, ...marketplaceInqs, ...investmentsInqs];

      const activeStatuses = ['pending', 'in_review', 'waitlist'];
      const confirmedStatuses = ['confirmed', 'completed', 'checked_in'];
      const cancelledStatuses = ['cancelled', 'rejected', 'declined'];

      // Queue counts across loaded department items
      const activeCount = allUnified.filter(item => activeStatuses.includes(item.status.toLowerCase())).length;
      const confirmedCount = allUnified.filter(item => confirmedStatuses.includes(item.status.toLowerCase())).length;
      const cancelledCount = allUnified.filter(item => cancelledStatuses.includes(item.status.toLowerCase())).length;
      const allCount = allUnified.length;

      let filtered = [...allUnified];
      const queue = (req.query.queue as string) || 'active';

      if (queue === 'active') {
        filtered = filtered.filter(item => activeStatuses.includes(item.status.toLowerCase()));
      } else if (queue === 'confirmed') {
        filtered = filtered.filter(item => confirmedStatuses.includes(item.status.toLowerCase()));
      } else if (queue === 'cancelled') {
        filtered = filtered.filter(item => cancelledStatuses.includes(item.status.toLowerCase()));
      }

      if (status && status !== 'all') {
        filtered = filtered.filter(item => item.status.toLowerCase() === String(status).toLowerCase());
      }

      if (search && String(search).trim()) {
        const q = String(search).trim().toLowerCase();
        filtered = filtered.filter(item =>
          item.customerName.toLowerCase().includes(q) ||
          item.customerEmail.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q)
        );
      }

      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        inquiries: filtered,
        total: filtered.length,
        counts: {
          active: activeCount,
          confirmed: confirmedCount,
          cancelled: cancelledCount,
          all: allCount,
        },
        userRole: role,
        accessibleModules: {
          services: canAccessServices,
          events: canAccessEvents,
          marketplace: canAccessMarketplace,
          investments: canAccessInvestments,
        },
      });
    } catch (error) {
      console.error('Error fetching unified inquiries:', error);
      res.status(500).json({ error: 'Failed to fetch unified triage feed' });
    }
  }
);

adminRouter.patch(
  '/inquiries/unified/:module/:id',
  async (req: AdminRequest, res: Response) => {
    try {
      const moduleName = String(req.params.module).toUpperCase();
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      const role = req.adminUser?.adminRole;

      if (moduleName === 'SERVICES') {
        if (role !== AdminRole.SUPER_ADMIN && role !== AdminRole.SERVICE_MANAGER && role !== AdminRole.DESTINATION_MANAGER) {
          return res.status(403).json({ error: 'Permission denied: Services Lead access required' });
        }
        const updated = await prisma.serviceInquiry.update({
          where: { id },
          data: { status: String(status).toUpperCase() },
          include: { service: true, user: true },
        });

        if (updated.userId) {
          await prisma.notification.create({
            data: {
              userId: updated.userId,
              type: 'service',
              title: `Service Inquiry: ${updated.status}`,
              message: `Your inquiry for "${updated.service.name}" has been updated to ${updated.status.toLowerCase()}.`,
              actionUrl: `/service/${updated.serviceId}`,
            },
          }).catch((err) => console.error('[NOTIF] Failed to create in-app notification:', err));
        }

        console.log(`[STATUS EMAIL] Dispatching service inquiry update (${updated.status}) to: ${updated.contactEmail}`);
        sendServiceInquiryStatusEmail(
          { email: updated.contactEmail, name: updated.fullName },
          updated.service.name,
          updated.status,
          updated.timeframe || undefined
        ).then(() => {
          console.log(`[STATUS EMAIL SUCCESS] Delivered service status to ${updated.contactEmail}`);
        }).catch((err) => {
          console.error(`[STATUS EMAIL FAILED] Error dispatching to ${updated.contactEmail}:`, err);
        });

        return res.json({ success: true, item: updated });
      }

      if (moduleName === 'EVENTS') {
        if (role !== AdminRole.SUPER_ADMIN && role !== AdminRole.EVENT_MANAGER) {
          return res.status(403).json({ error: 'Permission denied: Event Coordinator access required' });
        }
        const updated = await prisma.eventRsvp.update({
          where: { id },
          data: { status: String(status).toLowerCase() },
          include: { event: true, user: true },
        });

        if (updated.userId) {
          await prisma.notification.create({
            data: {
              userId: updated.userId,
              type: 'event',
              title: `RSVP Status: ${updated.status.toUpperCase()}`,
              message: `Your RSVP for "${updated.event.title}" is now ${updated.status.toLowerCase()}.`,
              actionUrl: `/event/${updated.eventId}`,
            },
          }).catch((err) => console.error('[NOTIF] Failed to create in-app notification:', err));
        }

        console.log(`[STATUS EMAIL] Dispatching event RSVP update (${updated.status}) to: ${updated.email}`);
        sendEventRsvpStatusEmail(
          { email: updated.email, name: updated.fullName },
          updated.event.title,
          updated.status,
          updated.ticketsCount,
          new Date(updated.event.date).toLocaleDateString()
        ).then(() => {
          console.log(`[STATUS EMAIL SUCCESS] Delivered event RSVP status to ${updated.email}`);
        }).catch((err) => {
          console.error(`[STATUS EMAIL FAILED] Error dispatching to ${updated.email}:`, err);
        });

        return res.json({ success: true, item: updated });
      }

      if (moduleName === 'MARKETPLACE') {
        if (role !== AdminRole.SUPER_ADMIN && role !== AdminRole.MARKETPLACE_MANAGER) {
          return res.status(403).json({ error: 'Permission denied: Marketplace Lead access required' });
        }
        const updated = await prisma.productOrderInquiry.update({
          where: { id },
          data: { status: String(status).toUpperCase() },
          include: { product: true, user: true },
        });

        if (updated.userId) {
          await prisma.notification.create({
            data: {
              userId: updated.userId,
              type: 'order',
              title: `Order Status: ${updated.status}`,
              message: `Your inquiry for "${updated.product.title}" is now ${updated.status.toLowerCase()}.`,
              actionUrl: `/marketplace`,
            },
          }).catch((err) => console.error('[NOTIF] Failed to create in-app notification:', err));
        }

        console.log(`[STATUS EMAIL] Dispatching order inquiry update (${updated.status}) to: ${updated.email}`);
        sendOrderStatusEmail(
          { email: updated.email, name: updated.fullName },
          updated.product.title,
          updated.status,
          updated.quantity,
          `${(updated.product.price * updated.quantity).toFixed(2)} ${updated.product.currency}`
        ).then(() => {
          console.log(`[STATUS EMAIL SUCCESS] Delivered order status to ${updated.email}`);
        }).catch((err) => {
          console.error(`[STATUS EMAIL FAILED] Error dispatching to ${updated.email}:`, err);
        });

        return res.json({ success: true, item: updated });
      }

      if (moduleName === 'INVESTMENTS') {
        if (role !== AdminRole.SUPER_ADMIN && role !== AdminRole.INVESTMENT_OFFICER) {
          return res.status(403).json({ error: 'Permission denied: Investment Officer access required' });
        }
        const updated = await prisma.investmentInquiry.update({
          where: { id },
          data: { status: String(status).toUpperCase() },
          include: { opportunity: true, user: true },
        });

        if (updated.userId) {
          await prisma.notification.create({
            data: {
              userId: updated.userId,
              type: 'investment',
              title: `Investment Inquiry: ${updated.status}`,
              message: `Your prospectus request for "${updated.opportunity.title}" is now ${updated.status.toLowerCase()}.`,
              actionUrl: `/investment/${updated.opportunityId}`,
            },
          }).catch((err) => console.error('[NOTIF] Failed to create in-app notification:', err));
        }

        console.log(`[STATUS EMAIL] Dispatching investment inquiry update (${updated.status}) to: ${updated.contactEmail}`);
        sendInvestmentInquiryStatusEmail(
          { email: updated.contactEmail, name: updated.fullName },
          updated.opportunity.title,
          updated.status,
          updated.investmentBudget || undefined
        ).then(() => {
          console.log(`[STATUS EMAIL SUCCESS] Delivered investment status to ${updated.contactEmail}`);
        }).catch((err) => {
          console.error(`[STATUS EMAIL FAILED] Error dispatching to ${updated.contactEmail}:`, err);
        });

        return res.json({ success: true, item: updated });
      }

      res.status(400).json({ error: 'Invalid module specified' });
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      res.status(500).json({ error: 'Failed to update inquiry status' });
    }
  }
);

// --- Destinations (Heritage & Tourism) (SUPER_ADMIN, DESTINATION_MANAGER) ---

adminRouter.get(
  '/destinations',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.DESTINATION_MANAGER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const destinations = await prisma.destination.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(destinations);
    } catch (error) {
      console.error('Error fetching admin destinations:', error);
      res.status(500).json({ error: 'Failed to fetch destinations' });
    }
  }
);

adminRouter.post(
  '/destinations',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.DESTINATION_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const {
        name,
        region,
        blurb,
        description,
        image,
        elevation,
        bestTimeToVisit,
        unescoStatus,
        rating,
        gettingThere,
        highlights,
        latitude,
        longitude,
      } = req.body;

      if (!name || !region || !blurb || !image) {
        return res.status(400).json({ error: 'Name, region, blurb, and image are required' });
      }

      const destination = await prisma.destination.create({
        data: {
          name: String(name).trim(),
          region: String(region).trim(),
          blurb: String(blurb).trim(),
          description: description ? String(description).trim() : String(blurb).trim(),
          image: String(image).trim(),
          elevation: elevation ? String(elevation).trim() : null,
          bestTimeToVisit: bestTimeToVisit ? String(bestTimeToVisit).trim() : null,
          unescoStatus: Boolean(unescoStatus),
          rating: typeof rating === 'number' ? rating : 4.9,
          gettingThere: gettingThere ? String(gettingThere).trim() : null,
          highlights: highlights ? String(highlights).trim() : null,
          latitude: typeof latitude === 'number' ? latitude : null,
          longitude: typeof longitude === 'number' ? longitude : null,
        },
      });

      res.status(201).json(destination);
    } catch (error) {
      console.error('Error creating destination:', error);
      res.status(500).json({ error: 'Failed to create destination' });
    }
  }
);

adminRouter.put(
  '/destinations/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.DESTINATION_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = req.body;

      const destination = await prisma.destination.update({
        where: { id },
        data: {
          name: data.name ? String(data.name).trim() : undefined,
          region: data.region ? String(data.region).trim() : undefined,
          blurb: data.blurb ? String(data.blurb).trim() : undefined,
          description: data.description ? String(data.description).trim() : undefined,
          image: data.image ? String(data.image).trim() : undefined,
          elevation: data.elevation !== undefined ? (data.elevation ? String(data.elevation).trim() : null) : undefined,
          bestTimeToVisit: data.bestTimeToVisit !== undefined ? (data.bestTimeToVisit ? String(data.bestTimeToVisit).trim() : null) : undefined,
          unescoStatus: data.unescoStatus !== undefined ? Boolean(data.unescoStatus) : undefined,
          rating: typeof data.rating === 'number' ? data.rating : undefined,
          gettingThere: data.gettingThere !== undefined ? (data.gettingThere ? String(data.gettingThere).trim() : null) : undefined,
          highlights: data.highlights !== undefined ? (data.highlights ? String(data.highlights).trim() : null) : undefined,
          latitude: data.latitude !== undefined ? (typeof data.latitude === 'number' ? data.latitude : null) : undefined,
          longitude: data.longitude !== undefined ? (typeof data.longitude === 'number' ? data.longitude : null) : undefined,
        },
      });

      res.json(destination);
    } catch (error) {
      console.error('Error updating destination:', error);
      res.status(500).json({ error: 'Failed to update destination' });
    }
  }
);

adminRouter.delete(
  '/destinations/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.DESTINATION_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await prisma.destination.delete({ where: { id } });
      res.json({ success: true, message: 'Destination removed' });
    } catch (error) {
      console.error('Error deleting destination:', error);
      res.status(500).json({ error: 'Failed to delete destination' });
    }
  }
);

// --- Services (Business & Partner Directory) (SUPER_ADMIN, SERVICE_MANAGER) ---

adminRouter.get(
  '/services',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.SERVICE_MANAGER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const services = await prisma.service.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(services);
    } catch (error) {
      console.error('Error fetching admin services:', error);
      res.status(500).json({ error: 'Failed to fetch service directory' });
    }
  }
);

adminRouter.post(
  '/services',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.SERVICE_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const {
        name,
        category,
        region,
        location,
        subCity,
        blurb,
        description,
        image,
        verified,
        phone,
        email,
        website,
        whatsapp,
        latitude,
        longitude,
      } = req.body;

      if (!name || !category || !blurb || !image) {
        return res.status(400).json({ error: 'Name, category, blurb, and image are required' });
      }

      const service = await prisma.service.create({
        data: {
          name: String(name).trim(),
          category: String(category).trim(),
          location: String(region || location || 'Addis Ababa').trim(),
          address: subCity ? String(subCity).trim() : null,
          blurb: String(blurb).trim(),
          description: description ? String(description).trim() : String(blurb).trim(),
          image: String(image).trim(),
          verified: Boolean(verified ?? true),
          phone: phone ? String(phone).trim() : null,
          email: email ? String(email).trim() : null,
          whatsapp: whatsapp ? String(whatsapp).trim() : null,
          latitude: typeof latitude === 'number' ? latitude : null,
          longitude: typeof longitude === 'number' ? longitude : null,
        },
      });

      res.status(201).json(service);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: 'Failed to create service partner' });
    }
  }
);

adminRouter.put(
  '/services/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.SERVICE_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = req.body;

      const service = await prisma.service.update({
        where: { id },
        data: {
          name: data.name ? String(data.name).trim() : undefined,
          category: data.category ? String(data.category).trim() : undefined,
          location: data.region || data.location ? String(data.region || data.location).trim() : undefined,
          address: data.subCity !== undefined ? (data.subCity ? String(data.subCity).trim() : null) : (data.address !== undefined ? String(data.address).trim() : undefined),
          blurb: data.blurb ? String(data.blurb).trim() : undefined,
          description: data.description ? String(data.description).trim() : undefined,
          image: data.image ? String(data.image).trim() : undefined,
          verified: data.verified !== undefined ? Boolean(data.verified) : undefined,
          phone: data.phone !== undefined ? (data.phone ? String(data.phone).trim() : null) : undefined,
          email: data.email !== undefined ? (data.email ? String(data.email).trim() : null) : undefined,
          whatsapp: data.whatsapp !== undefined ? (data.whatsapp ? String(data.whatsapp).trim() : null) : undefined,
          latitude: data.latitude !== undefined ? (typeof data.latitude === 'number' ? data.latitude : null) : undefined,
          longitude: data.longitude !== undefined ? (typeof data.longitude === 'number' ? data.longitude : null) : undefined,
        },
      });

      res.json(service);
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ error: 'Failed to update service partner' });
    }
  }
);

adminRouter.delete(
  '/services/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.SERVICE_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await prisma.service.delete({ where: { id } });
      res.json({ success: true, message: 'Service partner removed' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service partner' });
    }
  }
);

adminRouter.get(
  '/services-inquiries',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.SERVICE_MANAGER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const inquiries = await prisma.serviceInquiry.findMany({
        include: {
          service: { select: { id: true, name: true, category: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(inquiries);
    } catch (error) {
      console.error('Error fetching service inquiries:', error);
      res.status(500).json({ error: 'Failed to fetch client inquiries' });
    }
  }
);

adminRouter.patch(
  '/services-inquiries/:id/status',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.SERVICE_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      const normalizedStatus = String(status).trim();
      const updated = await prisma.serviceInquiry.update({
        where: { id },
        data: { status: normalizedStatus },
        include: {
          service: { select: { id: true, name: true, category: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // 1. In-App Notification (if user is registered)
      if (updated.userId) {
        try {
          await prisma.notification.create({
            data: {
              userId: updated.userId,
              title: `Service Inquiry: ${normalizedStatus.replace(/_/g, ' ').toUpperCase()}`,
              message: `Your inquiry for "${updated.service.name}" has been updated to ${normalizedStatus.replace(/_/g, ' ')}.`,
              type: 'service',
              actionUrl: `/service/${updated.serviceId}`,
            },
          });
        } catch (notifErr) {
          console.error('Failed to create in-app notification for service inquiry:', notifErr);
        }
      }

      // 2. Transactional Email Notification
      if (updated.contactEmail) {
        sendServiceInquiryStatusEmail(
          {
            email: updated.contactEmail,
            name: updated.fullName || updated.user?.name || 'Valued Client',
          },
          updated.service.name,
          normalizedStatus,
          updated.timeframe || undefined
        ).catch((emailErr) => {
          console.error('Failed to dispatch service inquiry status email:', emailErr);
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      res.status(500).json({ error: 'Failed to update inquiry status' });
    }
  }
);

// --- Events & Gatherings (SUPER_ADMIN, EVENT_MANAGER) ---

adminRouter.get(
  '/events',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const events = await prisma.eventItem.findMany({
        include: { _count: { select: { rsvps: true } } },
        orderBy: { date: 'asc' },
      });
      res.json(events);
    } catch (error) {
      console.error('Error fetching admin events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  }
);

adminRouter.post(
  '/events',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const {
        title,
        date,
        time,
        city,
        venue,
        description,
        image,
        category,
        price,
        organizer,
        agenda,
        capacity,
        latitude,
        longitude,
      } = req.body;

      if (!title || !date || !image || !category) {
        return res.status(400).json({ error: 'Title, date, image, and category are required' });
      }

      const parsedDate = new Date(date);
      const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      const event = await prisma.eventItem.create({
        data: {
          title: String(title).trim(),
          date: validDate,
          time: time ? String(time).trim() : null,
          city: city ? String(city).trim() : 'Addis Ababa',
          venue: venue ? String(venue).trim() : null,
          description: description ? String(description).trim() : '',
          image: String(image).trim(),
          category: String(category).trim(),
          price: price ? String(price).trim() : 'Free',
          organizer: organizer ? String(organizer).trim() : null,
          agenda: agenda ? String(agenda).trim() : null,
          capacity: typeof capacity === 'number' ? capacity : null,
          latitude: typeof latitude === 'number' ? latitude : null,
          longitude: typeof longitude === 'number' ? longitude : null,
        },
      });

      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

adminRouter.put(
  '/events/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = req.body;

      const event = await prisma.eventItem.update({
        where: { id },
        data: {
          title: data.title ? String(data.title).trim() : undefined,
          date: data.date ? new Date(data.date) : undefined,
          time: data.time !== undefined ? (data.time ? String(data.time).trim() : null) : undefined,
          city: data.city ? String(data.city).trim() : undefined,
          venue: data.venue !== undefined ? (data.venue ? String(data.venue).trim() : null) : undefined,
          description: data.description !== undefined ? String(data.description).trim() : undefined,
          image: data.image ? String(data.image).trim() : undefined,
          category: data.category ? String(data.category).trim() : undefined,
          price: data.price !== undefined ? (data.price ? String(data.price).trim() : null) : undefined,
          organizer: data.organizer !== undefined ? (data.organizer ? String(data.organizer).trim() : null) : undefined,
          agenda: data.agenda !== undefined ? (data.agenda ? String(data.agenda).trim() : null) : undefined,
          capacity: data.capacity !== undefined ? (typeof data.capacity === 'number' ? data.capacity : null) : undefined,
          latitude: data.latitude !== undefined ? (typeof data.latitude === 'number' ? data.latitude : null) : undefined,
          longitude: data.longitude !== undefined ? (typeof data.longitude === 'number' ? data.longitude : null) : undefined,
        },
      });

      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

adminRouter.delete(
  '/events/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await prisma.eventItem.delete({ where: { id } });
      res.json({ success: true, message: 'Event removed' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  }
);

adminRouter.get(
  '/events-rsvps',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const rsvps = await prisma.eventRsvp.findMany({
        include: {
          event: { select: { id: true, title: true, date: true, venue: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(rsvps);
    } catch (error) {
      console.error('Error fetching event rsvps:', error);
      res.status(500).json({ error: 'Failed to fetch event attendee RSVPs' });
    }
  }
);

adminRouter.patch(
  '/events-rsvps/:id/status',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      const normalizedStatus = String(status).trim();
      const updated = await prisma.eventRsvp.update({
        where: { id },
        data: { status: normalizedStatus },
        include: {
          event: { select: { id: true, title: true, date: true, venue: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // 1. In-App Notification (if user is registered)
      if (updated.userId) {
        try {
          await prisma.notification.create({
            data: {
              userId: updated.userId,
              title: `Event RSVP: ${normalizedStatus.replace(/_/g, ' ').toUpperCase()}`,
              message: `Your reservation for "${updated.event.title}" is now ${normalizedStatus.replace(/_/g, ' ')}.`,
              type: 'event',
              actionUrl: `/event/${updated.eventId}`,
            },
          });
        } catch (notifErr) {
          console.error('Failed to create in-app notification for event RSVP:', notifErr);
        }
      }

      // 2. Transactional Email Notification
      if (updated.email) {
        sendEventRsvpStatusEmail(
          {
            email: updated.email,
            name: updated.fullName || updated.user?.name || 'Valued Guest',
          },
          updated.event.title,
          normalizedStatus,
          updated.ticketsCount,
          updated.event.date ? new Date(updated.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined
        ).catch((emailErr) => {
          console.error('Failed to dispatch event RSVP status email:', emailErr);
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating event RSVP status:', error);
      res.status(500).json({ error: 'Failed to update RSVP status' });
    }
  }
);

// --- Event Live Check-In & Gate Desk API ---

adminRouter.post(
  '/events/check-in',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const { code, eventId } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Pass reference code or ticket identifier is required' });
      }

      const cleanCode = code.trim();
      let passSub = cleanCode;
      if (cleanCode.toUpperCase().startsWith('DAL-EVT-')) {
        passSub = cleanCode.substring('DAL-EVT-'.length);
      }

      const candidates = await prisma.eventRsvp.findMany({
        where: {
          ...(eventId ? { eventId } : {}),
          OR: [
            { id: cleanCode },
            { id: { startsWith: passSub.toLowerCase() } },
            { id: { startsWith: passSub.toUpperCase() } },
            { email: { equals: cleanCode, mode: 'insensitive' } },
            { fullName: { contains: cleanCode, mode: 'insensitive' } },
          ],
        },
        include: {
          event: { select: { id: true, title: true, date: true, venue: true, city: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (candidates.length === 0) {
        if (eventId) {
          const otherEventPass = await prisma.eventRsvp.findFirst({
            where: {
              OR: [
                { id: cleanCode },
                { id: { startsWith: passSub.toLowerCase() } },
                { id: { startsWith: passSub.toUpperCase() } },
              ],
            },
            include: { event: { select: { title: true } } },
          });
          if (otherEventPass) {
            return res.status(400).json({
              success: false,
              reason: 'WRONG_EVENT',
              message: `This pass is valid for "${otherEventPass.event.title}", not the currently selected event!`,
            });
          }
        }
        return res.status(404).json({
          success: false,
          reason: 'NOT_FOUND',
          message: `No reservation pass found matching "${cleanCode}".`,
        });
      }

      const rsvp = candidates[0];
      const currentStatus = rsvp.status.toLowerCase();

      if (currentStatus === 'checked_in') {
        return res.status(409).json({
          success: false,
          reason: 'ALREADY_CHECKED_IN',
          message: 'Already Checked In! Guest was previously admitted.',
          rsvp: {
            ...rsvp,
            passCode: `DAL-EVT-${rsvp.id.slice(0, 8).toUpperCase()}`,
          },
        });
      }

      if (currentStatus === 'cancelled' || currentStatus === 'rejected') {
        return res.status(400).json({
          success: false,
          reason: 'CANCELLED',
          message: `Admission Denied. This pass was ${rsvp.status.toUpperCase()}.`,
          rsvp: {
            ...rsvp,
            passCode: `DAL-EVT-${rsvp.id.slice(0, 8).toUpperCase()}`,
          },
        });
      }

      const updated = await prisma.eventRsvp.update({
        where: { id: rsvp.id },
        data: { status: 'checked_in' },
        include: {
          event: { select: { id: true, title: true, date: true, venue: true, city: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (updated.userId) {
        prisma.notification.create({
          data: {
            userId: updated.userId,
            title: 'Welcome to ' + updated.event.title + '!',
            message: 'Your admission pass has been scanned and verified at the venue gate.',
            type: 'event',
            actionUrl: `/activity`,
          },
        }).catch(() => {});
      }

      return res.json({
        success: true,
        reason: 'CHECKED_IN',
        message: 'Pass Verified Successfully! Guest Admitted.',
        rsvp: {
          ...updated,
          passCode: `DAL-EVT-${updated.id.slice(0, 8).toUpperCase()}`,
        },
      });
    } catch (error) {
      console.error('Error during event pass check-in:', error);
      res.status(500).json({ error: 'Failed to process event pass check-in' });
    }
  }
);

adminRouter.get(
  '/events/:id/attendance',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const event = await prisma.eventItem.findUnique({
        where: { id: eventId },
        select: { id: true, title: true, date: true, venue: true, capacity: true },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const allRsvps = await prisma.eventRsvp.findMany({
        where: { eventId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      let totalTickets = 0;
      let checkedInTickets = 0;
      let checkedInCount = 0;
      let confirmedCount = 0;
      let pendingCount = 0;
      let cancelledCount = 0;

      const formattedAttendees = allRsvps.map((r) => {
        const passCode = `DAL-EVT-${r.id.slice(0, 8).toUpperCase()}`;
        const s = r.status.toLowerCase();
        const tickets = r.ticketsCount || 1;

        if (s !== 'cancelled' && s !== 'rejected') {
          totalTickets += tickets;
        }

        if (s === 'checked_in') {
          checkedInCount++;
          checkedInTickets += tickets;
        } else if (s === 'confirmed') {
          confirmedCount++;
        } else if (s === 'pending') {
          pendingCount++;
        } else if (s === 'cancelled' || s === 'rejected') {
          cancelledCount++;
        }

        return {
          id: r.id,
          passCode,
          fullName: r.fullName || r.user?.name || 'Guest',
          email: r.email,
          phone: r.phone,
          ticketsCount: tickets,
          notes: r.notes,
          status: r.status,
          createdAt: r.createdAt,
        };
      });

      const remainingTickets = Math.max(0, totalTickets - checkedInTickets);
      const attendanceRate = totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 100) : 0;

      res.json({
        event,
        metrics: {
          totalRsvps: allRsvps.length,
          totalTickets,
          checkedInCount,
          checkedInTickets,
          remainingTickets,
          confirmedCount,
          pendingCount,
          cancelledCount,
          attendanceRate,
          capacity: event.capacity || null,
        },
        attendees: formattedAttendees,
      });
    } catch (error) {
      console.error('Error fetching event attendance stats:', error);
      res.status(500).json({ error: 'Failed to fetch event attendance stats' });
    }
  }
);

adminRouter.post(
  '/events/undo-check-in/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.EVENT_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await prisma.eventRsvp.update({
        where: { id },
        data: { status: 'confirmed' },
        include: {
          event: { select: { id: true, title: true } },
        },
      });

      res.json({
        success: true,
        message: 'Check-in reverted to confirmed',
        rsvp: {
          ...updated,
          passCode: `DAL-EVT-${updated.id.slice(0, 8).toUpperCase()}`,
        },
      });
    } catch (error) {
      console.error('Error reverting check-in:', error);
      res.status(500).json({ error: 'Failed to revert check-in' });
    }
  }
);


// --- Artisan Marketplace (SUPER_ADMIN, MARKETPLACE_MANAGER) ---

adminRouter.get(
  '/products',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.MARKETPLACE_MANAGER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const products = await prisma.product.findMany({
        include: { _count: { select: { inquiries: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json(products);
    } catch (error) {
      console.error('Error fetching admin products:', error);
      res.status(500).json({ error: 'Failed to fetch marketplace products' });
    }
  }
);

adminRouter.post(
  '/products',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.MARKETPLACE_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const {
        title,
        price,
        currency,
        category,
        sellerName,
        sellerVerified,
        sellerLocation,
        sellerPhone,
        sellerWhatsapp,
        image,
        blurb,
        description,
        materials,
        origin,
        inStock,
      } = req.body;

      if (!title || typeof price !== 'number' || !category || !sellerName || !image) {
        return res.status(400).json({ error: 'Title, price, category, sellerName, and image are required' });
      }

      const product = await prisma.product.create({
        data: {
          title: String(title).trim(),
          price: Number(price),
          currency: currency ? String(currency).trim() : 'ETB',
          category: String(category).trim(),
          sellerName: String(sellerName).trim(),
          sellerVerified: Boolean(sellerVerified ?? true),
          sellerLocation: sellerLocation ? String(sellerLocation).trim() : 'Addis Ababa',
          sellerPhone: sellerPhone ? String(sellerPhone).trim() : null,
          sellerWhatsapp: sellerWhatsapp ? String(sellerWhatsapp).trim() : null,
          image: String(image).trim(),
          blurb: blurb ? String(blurb).trim() : String(title).trim(),
          description: description ? String(description).trim() : null,
          materials: materials ? String(materials).trim() : null,
          origin: origin ? String(origin).trim() : null,
          inStock: Boolean(inStock ?? true),
        },
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create marketplace product' });
    }
  }
);

adminRouter.put(
  '/products/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.MARKETPLACE_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: {
          title: data.title ? String(data.title).trim() : undefined,
          price: typeof data.price === 'number' ? data.price : undefined,
          currency: data.currency ? String(data.currency).trim() : undefined,
          category: data.category ? String(data.category).trim() : undefined,
          sellerName: data.sellerName ? String(data.sellerName).trim() : undefined,
          sellerVerified: data.sellerVerified !== undefined ? Boolean(data.sellerVerified) : undefined,
          sellerLocation: data.sellerLocation ? String(data.sellerLocation).trim() : undefined,
          sellerPhone: data.sellerPhone !== undefined ? (data.sellerPhone ? String(data.sellerPhone).trim() : null) : undefined,
          sellerWhatsapp: data.sellerWhatsapp !== undefined ? (data.sellerWhatsapp ? String(data.sellerWhatsapp).trim() : null) : undefined,
          image: data.image ? String(data.image).trim() : undefined,
          blurb: data.blurb ? String(data.blurb).trim() : undefined,
          description: data.description !== undefined ? String(data.description).trim() : undefined,
          materials: data.materials !== undefined ? String(data.materials).trim() : undefined,
          origin: data.origin !== undefined ? String(data.origin).trim() : undefined,
          inStock: data.inStock !== undefined ? Boolean(data.inStock) : undefined,
        },
      });

      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update marketplace product' });
    }
  }
);

adminRouter.delete(
  '/products/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.MARKETPLACE_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await prisma.product.delete({ where: { id } });
      res.json({ success: true, message: 'Product removed' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
);

adminRouter.get(
  '/orders',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.MARKETPLACE_MANAGER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const orders = await prisma.productOrderInquiry.findMany({
        include: {
          product: { select: { id: true, title: true, price: true, currency: true, image: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(orders);
    } catch (error) {
      console.error('Error fetching marketplace orders:', error);
      res.status(500).json({ error: 'Failed to fetch customer product orders' });
    }
  }
);

adminRouter.patch(
  '/orders/:id/status',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.MARKETPLACE_MANAGER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      const normalizedStatus = String(status).trim();
      const updated = await prisma.productOrderInquiry.update({
        where: { id },
        data: { status: normalizedStatus },
        include: {
          product: { select: { id: true, title: true, price: true, currency: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // 1. In-App Notification (if user is registered)
      if (updated.userId) {
        try {
          await prisma.notification.create({
            data: {
              userId: updated.userId,
              title: `Order Status: ${normalizedStatus.replace(/_/g, ' ').toUpperCase()}`,
              message: `Your order for "${updated.product.title}" (Qty: ${updated.quantity}) is now ${normalizedStatus.replace(/_/g, ' ')}.`,
              type: 'order',
              actionUrl: `/marketplace`,
            },
          });
        } catch (notifErr) {
          console.error('Failed to create in-app notification for order:', notifErr);
        }
      }

      // 2. Transactional Email Notification
      if (updated.email) {
        sendOrderStatusEmail(
          {
            email: updated.email,
            name: updated.fullName || updated.user?.name || 'Valued Patron',
          },
          updated.product.title,
          normalizedStatus,
          updated.quantity,
          updated.notes || undefined
        ).catch((emailErr) => {
          console.error('Failed to dispatch order status email:', emailErr);
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
);

// --- Diaspora Investments (SUPER_ADMIN, INVESTMENT_OFFICER) ---

adminRouter.get(
  '/investments',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.INVESTMENT_OFFICER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const investments = await prisma.investmentOpportunity.findMany({
        include: { _count: { select: { inquiries: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json(investments);
    } catch (error) {
      console.error('Error fetching investments:', error);
      res.status(500).json({ error: 'Failed to fetch investment deals' });
    }
  }
);

adminRouter.post(
  '/investments',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.INVESTMENT_OFFICER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const {
        title,
        sector,
        location,
        region,
        minInvestment,
        blurb,
        image,
        description,
        expectedReturn,
        timeline,
        contactEmail,
        contactPhone,
      } = req.body;

      if (!title || !sector) {
        return res.status(400).json({ error: 'Title and sector are required' });
      }

      const opp = await prisma.investmentOpportunity.create({
        data: {
          title: String(title).trim(),
          sector: String(sector).trim(),
          location: String(location || region || 'Ethiopia').trim(),
          minInvestment: typeof minInvestment === 'number' ? minInvestment : 10000,
          blurb: blurb ? String(blurb).trim() : (description ? String(description).slice(0, 120) : String(title).trim()),
          image: image ? String(image).trim() : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
          description: description ? String(description).trim() : null,
          expectedReturn: expectedReturn ? String(expectedReturn).trim() : null,
          timeline: timeline ? String(timeline).trim() : null,
          contactEmail: contactEmail ? String(contactEmail).trim() : null,
          contactPhone: contactPhone ? String(contactPhone).trim() : null,
        },
      });

      res.status(201).json(opp);
    } catch (error) {
      console.error('Error creating investment:', error);
      res.status(500).json({ error: 'Failed to create investment opportunity' });
    }
  }
);

adminRouter.put(
  '/investments/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.INVESTMENT_OFFICER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = req.body;

      const opp = await prisma.investmentOpportunity.update({
        where: { id },
        data: {
          title: data.title ? String(data.title).trim() : undefined,
          sector: data.sector ? String(data.sector).trim() : undefined,
          location: data.location || data.region ? String(data.location || data.region).trim() : undefined,
          minInvestment: typeof data.minInvestment === 'number' ? data.minInvestment : undefined,
          blurb: data.blurb ? String(data.blurb).trim() : undefined,
          image: data.image ? String(data.image).trim() : undefined,
          description: data.description ? String(data.description).trim() : undefined,
          expectedReturn: data.expectedReturn !== undefined ? (data.expectedReturn ? String(data.expectedReturn).trim() : null) : undefined,
          timeline: data.timeline !== undefined ? (data.timeline ? String(data.timeline).trim() : null) : undefined,
          contactEmail: data.contactEmail !== undefined ? (data.contactEmail ? String(data.contactEmail).trim() : null) : undefined,
          contactPhone: data.contactPhone !== undefined ? (data.contactPhone ? String(data.contactPhone).trim() : null) : undefined,
        },
      });

      res.json(opp);
    } catch (error) {
      console.error('Error updating investment:', error);
      res.status(500).json({ error: 'Failed to update investment opportunity' });
    }
  }
);

adminRouter.delete(
  '/investments/:id',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.INVESTMENT_OFFICER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await prisma.investmentOpportunity.delete({ where: { id } });
      res.json({ success: true, message: 'Investment opportunity removed' });
    } catch (error) {
      console.error('Error deleting investment:', error);
      res.status(500).json({ error: 'Failed to delete investment opportunity' });
    }
  }
);

adminRouter.get(
  '/investments-inquiries',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.INVESTMENT_OFFICER]) as any,
  async (_req: AdminRequest, res: Response) => {
    try {
      const inquiries = await prisma.investmentInquiry.findMany({
        include: {
          opportunity: { select: { id: true, title: true, sector: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(inquiries);
    } catch (error) {
      console.error('Error fetching investment inquiries:', error);
      res.status(500).json({ error: 'Failed to fetch prospectus inquiries' });
    }
  }
);

adminRouter.patch(
  '/investments-inquiries/:id/status',
  requireRole([AdminRole.SUPER_ADMIN, AdminRole.INVESTMENT_OFFICER]) as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;
      const normalizedStatus = String(status).trim();
      const updated = await prisma.investmentInquiry.update({
        where: { id },
        data: { status: normalizedStatus },
        include: {
          opportunity: { select: { id: true, title: true, sector: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // 1. In-App Notification (if user is registered)
      if (updated.userId) {
        try {
          await prisma.notification.create({
            data: {
              userId: updated.userId,
              title: `Investment Inquiry: ${normalizedStatus.replace(/_/g, ' ').toUpperCase()}`,
              message: `Your inquiry for "${updated.opportunity.title}" is now ${normalizedStatus.replace(/_/g, ' ')}.`,
              type: 'investment',
              actionUrl: `/investment/${updated.opportunityId}`,
            },
          });
        } catch (notifErr) {
          console.error('Failed to create in-app notification for investment inquiry:', notifErr);
        }
      }

      // 2. Transactional Email Notification
      if (updated.contactEmail) {
        sendInvestmentInquiryStatusEmail(
          {
            email: updated.contactEmail,
            name: updated.fullName || updated.user?.name || 'Valued Investor',
          },
          updated.opportunity.title,
          normalizedStatus,
          updated.investmentBudget || undefined
        ).catch((emailErr) => {
          console.error('Failed to dispatch investment inquiry status email:', emailErr);
        });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating investment inquiry status:', error);
      res.status(500).json({ error: 'Failed to update inquiry status' });
    }
  }
);
