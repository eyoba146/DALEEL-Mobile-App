import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticateAdmin, requireRole, AdminRequest } from '../middleware/adminAuth';
import { AdminRole } from '@prisma/client';

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
      const updated = await prisma.serviceInquiry.update({
        where: { id },
        data: { status: String(status).trim() },
      });
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
      const updated = await prisma.eventRsvp.update({
        where: { id },
        data: { status: String(status).trim() },
      });
      res.json(updated);
    } catch (error) {
      console.error('Error updating event RSVP status:', error);
      res.status(500).json({ error: 'Failed to update RSVP status' });
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
      const updated = await prisma.productOrderInquiry.update({
        where: { id },
        data: { status: String(status).trim() },
      });
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
      const updated = await prisma.investmentInquiry.update({
        where: { id },
        data: { status: String(status).trim() },
      });
      res.json(updated);
    } catch (error) {
      console.error('Error updating investment inquiry status:', error);
      res.status(500).json({ error: 'Failed to update inquiry status' });
    }
  }
);
