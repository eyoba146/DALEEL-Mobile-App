import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AdminRole } from '@prisma/client';
import { sendCoordinatorInquiryAlertEmail } from '../lib/email';

const JWT_SECRET = process.env.JWT_SECRET;

export const contentRouter = Router();

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

// --- Destinations ---

contentRouter.get('/destinations', async (_req: Request, res: Response) => {
  try {
    const destinations = await prisma.destination.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

contentRouter.get('/destinations/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const destination = await prisma.destination.findUnique({
      where: { id },
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    res.json(destination);
  } catch (error) {
    console.error('Error fetching destination by id:', error);
    res.status(500).json({ error: 'Failed to fetch destination details' });
  }
});

// --- Services ---

contentRouter.get('/services', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const services = await prisma.service.findMany({
      where: category && category !== 'All' ? { category: String(category) } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

contentRouter.get('/services/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service partner not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service by id:', error);
    res.status(500).json({ error: 'Failed to fetch service partner details' });
  }
});

contentRouter.post('/services/:id/inquiry', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { fullName, contactEmail, contactPhone, contactWhatsapp, timeframe, message } = req.body;

    if (!fullName || !contactEmail || !message) {
      return res.status(400).json({ error: 'Full name, email address, and inquiry message are required' });
    }

    // Verify service exists
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({ error: 'Service partner not found' });
    }

    const userId = getOptionalUserId(req);

    const inquiry = await prisma.serviceInquiry.create({
      data: {
        serviceId: id,
        userId: userId ?? null,
        fullName: String(fullName).trim(),
        contactEmail: String(contactEmail).trim().toLowerCase(),
        contactPhone: contactPhone ? String(contactPhone).trim() : null,
        contactWhatsapp: contactWhatsapp ? String(contactWhatsapp).trim() : null,
        timeframe: timeframe ? String(timeframe).trim() : null,
        message: String(message).trim(),
      },
    });

    // Alert department coordinators & Super Admin
    sendCoordinatorInquiryAlertEmail({
      category: 'Service Directory',
      title: service.name,
      customerName: String(fullName).trim(),
      customerEmail: String(contactEmail).trim().toLowerCase(),
      customerPhone: contactPhone ? String(contactPhone).trim() : null,
      messageOrDetails: `${timeframe ? `[Timeframe: ${timeframe}] ` : ''}${String(message).trim()}`,
      inquiryId: inquiry.id,
      role: AdminRole.SERVICE_MANAGER,
    }).catch((err) => console.error('Error dispatching service inquiry coordinator alert:', err));

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been transmitted to our verified partner.',
      inquiry,
    });
  } catch (error) {
    console.error('Error creating service inquiry:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

contentRouter.get('/services/:id/my-inquiry', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = getOptionalUserId(req);
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

    if (!userId && !email) {
      return res.json(null);
    }

    const inquiry = await prisma.serviceInquiry.findFirst({
      where: {
        serviceId: id,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(email ? [{ contactEmail: email }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(inquiry || null);
  } catch (error) {
    console.error('Error fetching user service inquiry:', error);
    res.status(500).json({ error: 'Failed to fetch user inquiry' });
  }
});

contentRouter.patch('/services/inquiries/:id', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.serviceInquiry.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Inquiry not found' });
    if (existing.userId && userId && existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this inquiry' });
    }

    const { timeframe, message, contactPhone, contactWhatsapp, fullName } = req.body;
    const updated = await prisma.serviceInquiry.update({
      where: { id },
      data: {
        timeframe: timeframe !== undefined ? (timeframe ? String(timeframe).trim() : null) : undefined,
        message: message ? String(message).trim() : undefined,
        contactPhone: contactPhone !== undefined ? (contactPhone ? String(contactPhone).trim() : null) : undefined,
        contactWhatsapp: contactWhatsapp !== undefined ? (contactWhatsapp ? String(contactWhatsapp).trim() : null) : undefined,
        fullName: fullName ? String(fullName).trim() : undefined,
      },
    });
    res.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error('Error updating service inquiry:', error);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// --- Events ---

contentRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const events = await prisma.eventItem.findMany({
      where: category && category !== 'All' ? { category: String(category) } : undefined,
      orderBy: { date: 'asc' },
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

contentRouter.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const event = await prisma.eventItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event by id:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

contentRouter.post('/events/:id/rsvp', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { fullName, email, phone, ticketsCount, notes } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email address are required' });
    }

    const event = await prisma.eventItem.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const userId = getOptionalUserId(req);

    const rsvp = await prisma.eventRsvp.create({
      data: {
        eventId: id,
        userId: userId ?? null,
        fullName: String(fullName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        ticketsCount: Number(ticketsCount) > 0 ? Math.min(Number(ticketsCount), 10) : 1,
        notes: notes ? String(notes).trim() : null,
        status: 'confirmed',
      },
    });

    // Alert event coordinators & Super Admin
    sendCoordinatorInquiryAlertEmail({
      category: 'Event Gathering',
      title: event.title,
      customerName: String(fullName).trim(),
      customerEmail: String(email).trim().toLowerCase(),
      customerPhone: phone ? String(phone).trim() : null,
      messageOrDetails: `Tickets requested: ${rsvp.ticketsCount}${notes ? ` • Note: ${notes}` : ''}`,
      inquiryId: rsvp.id,
      role: AdminRole.EVENT_MANAGER,
    }).catch((err) => console.error('Error dispatching event RSVP coordinator alert:', err));

    res.status(201).json({
      success: true,
      message: 'Your RSVP has been confirmed! An invitation confirmation has been registered.',
      rsvp,
    });
  } catch (error) {
    console.error('Error creating event RSVP:', error);
    res.status(500).json({ error: 'Failed to register RSVP' });
  }
});

contentRouter.get('/events/:id/my-rsvp', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = getOptionalUserId(req);
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

    if (!userId && !email) {
      return res.json(null);
    }

    const rsvp = await prisma.eventRsvp.findFirst({
      where: {
        eventId: id,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rsvp || null);
  } catch (error) {
    console.error('Error fetching user event rsvp:', error);
    res.status(500).json({ error: 'Failed to fetch user RSVP' });
  }
});

contentRouter.patch('/events/rsvps/:id', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.eventRsvp.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'RSVP not found' });
    if (existing.userId && userId && existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this reservation' });
    }
    if (existing.status === 'confirmed' || existing.status === 'checked_in') {
      return res.status(400).json({
        error: 'This admission pass has already been confirmed and locked. Confirmed passes cannot be modified. Please contact the event organizer.',
      });
    }

    const { ticketsCount, notes, phone, fullName } = req.body;
    const updated = await prisma.eventRsvp.update({
      where: { id },
      data: {
        ticketsCount: Number(ticketsCount) > 0 ? Math.min(Number(ticketsCount), 10) : undefined,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : undefined,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
        fullName: fullName ? String(fullName).trim() : undefined,
      },
    });
    res.json({ success: true, rsvp: updated });
  } catch (error) {
    console.error('Error updating event rsvp:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

// --- Investment Opportunities ---

contentRouter.get('/investments', async (req: Request, res: Response) => {
  try {
    const { sector } = req.query;
    const opportunities = await prisma.investmentOpportunity.findMany({
      where: sector && sector !== 'All' ? { sector: String(sector) } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching investment opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch investment opportunities' });
  }
});

contentRouter.get('/investments/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const opportunity = await prisma.investmentOpportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Investment opportunity not found' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Error fetching investment opportunity by id:', error);
    res.status(500).json({ error: 'Failed to fetch investment opportunity details' });
  }
});

contentRouter.post('/investments/:id/inquiry', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const {
      fullName,
      contactEmail,
      contactPhone,
      contactWhatsapp,
      investmentBudget,
      timeframe,
      message,
    } = req.body;

    if (!fullName || !contactEmail || !message) {
      return res.status(400).json({
        error: 'Full name, email address, and inquiry message are required',
      });
    }

    const opportunity = await prisma.investmentOpportunity.findUnique({ where: { id } });
    if (!opportunity) {
      return res.status(404).json({ error: 'Investment opportunity not found' });
    }

    const userId = getOptionalUserId(req);

    const inquiry = await prisma.investmentInquiry.create({
      data: {
        opportunityId: id,
        userId: userId ?? null,
        fullName: String(fullName).trim(),
        contactEmail: String(contactEmail).trim().toLowerCase(),
        contactPhone: contactPhone ? String(contactPhone).trim() : null,
        contactWhatsapp: contactWhatsapp ? String(contactWhatsapp).trim() : null,
        investmentBudget: investmentBudget ? String(investmentBudget).trim() : null,
        timeframe: timeframe ? String(timeframe).trim() : null,
        message: String(message).trim(),
      },
    });

    // Alert investment officers & Super Admin
    sendCoordinatorInquiryAlertEmail({
      category: 'Diaspora Investment',
      title: opportunity.title,
      customerName: String(fullName).trim(),
      customerEmail: String(contactEmail).trim().toLowerCase(),
      customerPhone: contactPhone ? String(contactPhone).trim() : null,
      messageOrDetails: `${investmentBudget ? `[Budget: ${investmentBudget}] ` : ''}${timeframe ? `[Timeframe: ${timeframe}] ` : ''}${String(message).trim()}`,
      inquiryId: inquiry.id,
      role: AdminRole.INVESTMENT_OFFICER,
    }).catch((err) => console.error('Error dispatching investment coordinator alert:', err));

    res.status(201).json({
      success: true,
      message: 'Your prospectus request and investment inquiry have been transmitted securely.',
      inquiry,
    });
  } catch (error) {
    console.error('Error creating investment inquiry:', error);
    res.status(500).json({ error: 'Failed to submit investment inquiry' });
  }
});

contentRouter.get('/investments/:id/my-inquiry', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = getOptionalUserId(req);
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

    if (!userId && !email) {
      return res.json(null);
    }

    const inquiry = await prisma.investmentInquiry.findFirst({
      where: {
        opportunityId: id,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(email ? [{ contactEmail: email }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(inquiry || null);
  } catch (error) {
    console.error('Error fetching user investment inquiry:', error);
    res.status(500).json({ error: 'Failed to fetch user investment inquiry' });
  }
});

contentRouter.patch('/investments/inquiries/:id', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.investmentInquiry.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Inquiry not found' });
    if (existing.userId && userId && existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this inquiry' });
    }

    const { investmentBudget, timeframe, message, contactPhone, contactWhatsapp, fullName } = req.body;
    const updated = await prisma.investmentInquiry.update({
      where: { id },
      data: {
        investmentBudget: investmentBudget !== undefined ? (investmentBudget ? String(investmentBudget).trim() : null) : undefined,
        timeframe: timeframe !== undefined ? (timeframe ? String(timeframe).trim() : null) : undefined,
        message: message ? String(message).trim() : undefined,
        contactPhone: contactPhone !== undefined ? (contactPhone ? String(contactPhone).trim() : null) : undefined,
        contactWhatsapp: contactWhatsapp !== undefined ? (contactWhatsapp ? String(contactWhatsapp).trim() : null) : undefined,
        fullName: fullName ? String(fullName).trim() : undefined,
      },
    });
    res.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error('Error updating investment inquiry:', error);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// --- Artisan Marketplace Products ---

contentRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
        ...(category && category !== 'All' ? { category: String(category) } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

contentRouter.get('/products/inquiries/my', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

    if (!userId && !email) {
      return res.json([]);
    }

    const inquiries = await prisma.productOrderInquiry.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching user inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

contentRouter.patch('/products/inquiries/:inquiryId', async (req: Request, res: Response) => {
  try {
    const inquiryId = Array.isArray(req.params.inquiryId)
      ? req.params.inquiryId[0]
      : req.params.inquiryId;
    const { quantity, deliveryAddress, notes, phone, whatsapp } = req.body;

    const existing = await prisma.productOrderInquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Order inquiry not found' });
    }

    if (existing.status !== 'pending') {
      return res.status(400).json({
        error: `Inquiry cannot be modified because it is already marked as ${existing.status}.`,
      });
    }

    const updated = await prisma.productOrderInquiry.update({
      where: { id: inquiryId },
      data: {
        ...(quantity !== undefined ? { quantity: Math.max(1, Math.floor(Number(quantity))) } : {}),
        ...(deliveryAddress ? { deliveryAddress: String(deliveryAddress).trim() } : {}),
        ...(notes !== undefined ? { notes: notes ? String(notes).trim() : null } : {}),
        ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
        ...(whatsapp !== undefined ? { whatsapp: whatsapp ? String(whatsapp).trim() : null } : {}),
      },
      include: { product: true },
    });

    res.json({
      success: true,
      message: 'Inquiry details updated successfully.',
      inquiry: updated,
    });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

contentRouter.patch('/products/inquiries/:inquiryId/cancel', async (req: Request, res: Response) => {
  try {
    const inquiryId = Array.isArray(req.params.inquiryId)
      ? req.params.inquiryId[0]
      : req.params.inquiryId;

    const existing = await prisma.productOrderInquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Order inquiry not found' });
    }

    if (existing.status !== 'pending') {
      return res.status(400).json({
        error: `Inquiry cannot be cancelled because it is already marked as ${existing.status}.`,
      });
    }

    const cancelled = await prisma.productOrderInquiry.update({
      where: { id: inquiryId },
      data: { status: 'cancelled' },
      include: { product: true },
    });

    res.json({
      success: true,
      message: 'Inquiry cancelled successfully.',
      inquiry: cancelled,
    });
  } catch (error) {
    console.error('Error cancelling inquiry:', error);
    res.status(500).json({ error: 'Failed to cancel inquiry' });
  }
});

contentRouter.get('/products/:id/my-inquiry', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = getOptionalUserId(req);
    const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

    if (!userId && !email) {
      return res.json(null);
    }

    const inquiry = await prisma.productOrderInquiry.findFirst({
      where: {
        productId: id,
        status: { not: 'cancelled' },
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
      },
    });

    res.json(inquiry || null);
  } catch (error) {
    console.error('Error fetching my product inquiry:', error);
    res.status(500).json({ error: 'Failed to fetch product inquiry' });
  }
});

contentRouter.post('/products/:id/order-inquiry', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const {
      fullName,
      email,
      phone,
      whatsapp,
      quantity,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      notes,
    } = req.body;

    if (!fullName || !email || !deliveryAddress) {
      return res.status(400).json({
        error: 'Full name, email address, and delivery address are required',
      });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const userId = getOptionalUserId(req);
    const parsedQty = Number(quantity) > 0 ? Math.floor(Number(quantity)) : 1;

    const inquiry = await prisma.productOrderInquiry.create({
      data: {
        productId: id,
        userId: userId ?? null,
        fullName: String(fullName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        quantity: parsedQty,
        deliveryAddress: String(deliveryAddress).trim(),
        deliveryLatitude: typeof deliveryLatitude === 'number' ? deliveryLatitude : null,
        deliveryLongitude: typeof deliveryLongitude === 'number' ? deliveryLongitude : null,
        notes: notes ? String(notes).trim() : null,
      },
      include: {
        product: true,
      },
    });

    // Auto-save user default delivery location
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          savedAddress: String(deliveryAddress).trim(),
          ...(typeof deliveryLatitude === 'number' ? { savedLatitude: deliveryLatitude } : {}),
          ...(typeof deliveryLongitude === 'number' ? { savedLongitude: deliveryLongitude } : {}),
        },
      }).catch(() => {});
    }

    // Alert marketplace managers & Super Admin
    sendCoordinatorInquiryAlertEmail({
      category: 'Artisan Marketplace',
      title: `${product.title} (Qty: ${inquiry.quantity})`,
      customerName: String(fullName).trim(),
      customerEmail: String(email).trim().toLowerCase(),
      customerPhone: phone ? String(phone).trim() : null,
      messageOrDetails: `Delivery Address: ${deliveryAddress}${notes ? ` • Note: ${notes}` : ''}`,
      inquiryId: inquiry.id,
      role: AdminRole.MARKETPLACE_MANAGER,
    }).catch((err) => console.error('Error dispatching marketplace coordinator alert:', err));

    res.status(201).json({
      success: true,
      message: 'Your product order inquiry has been transmitted to the artisan merchant.',
      inquiry,
    });
  } catch (error) {
    console.error('Error creating product order inquiry:', error);
    res.status(500).json({ error: 'Failed to submit product order inquiry' });
  }
});

contentRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product by id:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// --- Dynamic Categories API ---

contentRouter.get('/categories', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const categories = await prisma.category.findMany({
      where: type ? { type: String(type) } : undefined,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Intelligent icon inference so admins never need to manually look up icons
function inferCategoryIcon(type: string, name: string): string {
  const n = name.toLowerCase();
  // Food & Beverage
  if (n.includes('coffee') || n.includes('buna') || n.includes('cafe') || n.includes('roast') || n.includes('bean')) return 'cafe-outline';
  if (n.includes('spice') || n.includes('food') || n.includes('culinary') || n.includes('cook')) return 'flame-outline';
  // Fashion & Apparel & Crafts
  if (n.includes('fashion') || n.includes('textil') || n.includes('kemis') || n.includes('cloth') || n.includes('dress') || n.includes('shirt')) return 'shirt-outline';
  if (n.includes('leather') || n.includes('bag') || n.includes('wallet') || n.includes('shoes')) return 'briefcase-outline';
  if (n.includes('jewel') || n.includes('gold') || n.includes('silver') || n.includes('cross') || n.includes('diamond')) return 'diamond-outline';
  if (n.includes('art') || n.includes('craft') || n.includes('pottery') || n.includes('wood') || n.includes('paint')) return 'color-palette-outline';
  // Travel, Stay & Relocation
  if (n.includes('relocat') || n.includes('home') || n.includes('house') || n.includes('settle')) return 'home-outline';
  if (n.includes('hotel') || n.includes('lodge') || n.includes('resort') || n.includes('stay') || n.includes('bed')) return 'bed-outline';
  if (n.includes('tour') || n.includes('guide') || n.includes('travel') || n.includes('safari') || n.includes('hike')) return 'compass-outline';
  if (n.includes('car') || n.includes('transport') || n.includes('vehicle') || n.includes('flight') || n.includes('drive')) return 'car-outline';
  // Legal & Documents
  if (n.includes('legal') || n.includes('law') || n.includes('court') || n.includes('doc') || n.includes('notary') || n.includes('title')) return 'document-text-outline';
  // Finance, Banking & Investment
  if (n.includes('bank') || n.includes('finance') || n.includes('forex') || n.includes('money') || n.includes('currency')) return 'card-outline';
  if (n.includes('invest') || n.includes('equity') || n.includes('fund') || n.includes('capital')) return 'cash-outline';
  if (n.includes('real estate') || n.includes('property') || n.includes('building') || n.includes('housing')) return 'business-outline';
  if (n.includes('agri') || n.includes('farm') || n.includes('crop') || n.includes('horticult') || n.includes('leaf')) return 'leaf-outline';
  if (n.includes('tech') || n.includes('soft') || n.includes('data') || n.includes('digital') || n.includes('app')) return 'hardware-chip-outline';
  if (n.includes('energy') || n.includes('solar') || n.includes('power') || n.includes('hydro')) return 'flash-outline';
  if (n.includes('health') || n.includes('medic') || n.includes('pharma') || n.includes('clinic')) return 'medkit-outline';
  // Events & Summits
  if (n.includes('music') || n.includes('concert') || n.includes('dance') || n.includes('festival') || n.includes('celebrat')) return 'musical-notes-outline';
  if (n.includes('network') || n.includes('social') || n.includes('summit') || n.includes('forum') || n.includes('people')) return 'people-outline';
  if (n.includes('unesco') || n.includes('heritage') || n.includes('historic')) return 'ribbon-outline';
  return 'pricetag-outline';
}

contentRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const { type, name, icon, order } = req.body;
    if (!type || !name) {
      return res.status(400).json({ error: 'Category type and name are required' });
    }

    const resolvedIcon = icon ? String(icon).trim() : inferCategoryIcon(String(type), String(name));

    const category = await prisma.category.upsert({
      where: {
        type_name: {
          type: String(type).trim().toLowerCase(),
          name: String(name).trim(),
        },
      },
      update: {
        icon: resolvedIcon,
        order: typeof order === 'number' ? order : undefined,
      },
      create: {
        type: String(type).trim().toLowerCase(),
        name: String(name).trim(),
        icon: resolvedIcon,
        order: typeof order === 'number' ? order : 0,
      },
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

contentRouter.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category removed' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// --- Dynamic Announcement Banners API ---

contentRouter.get('/announcements', async (_req: Request, res: Response) => {
  try {
    const banners = await prisma.announcementBanner.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(banners);
  } catch (error) {
    console.error('Error fetching announcement banners:', error);
    res.status(500).json({ error: 'Failed to fetch announcement banners' });
  }
});

contentRouter.post('/announcements', async (req: Request, res: Response) => {
  try {
    const { title, description, icon, actionUrl, active, order } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Banner title and description are required' });
    }

    const banner = await prisma.announcementBanner.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        icon: icon ? String(icon).trim() : 'sparkles',
        actionUrl: actionUrl ? String(actionUrl).trim() : null,
        active: typeof active === 'boolean' ? active : true,
        order: typeof order === 'number' ? order : 0,
      },
    });

    res.status(201).json({ success: true, banner });
  } catch (error) {
    console.error('Error creating announcement banner:', error);
    res.status(500).json({ error: 'Failed to create announcement banner' });
  }
});

// --- Unified User Activity & Passes API ---

contentRouter.get('/users/me/activity', async (req: Request, res: Response) => {
  try {
    const userId = getOptionalUserId(req);
    let email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

    if (userId && !email) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email) {
        email = user.email.trim().toLowerCase();
      }
    }

    if (!userId && !email) {
      return res.json({
        items: [],
        counts: {
          total: 0,
          events: 0,
          services: 0,
          orders: 0,
          investments: 0,
          pending: 0,
          confirmed: 0,
        },
      });
    }

    const [rsvps, serviceInquiries, productOrders, investmentInquiries] = await Promise.all([
      prisma.eventRsvp.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceInquiry.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(email ? [{ contactEmail: email }] : []),
          ],
        },
        include: { service: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.productOrderInquiry.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.investmentInquiry.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(email ? [{ contactEmail: email }] : []),
          ],
        },
        include: { opportunity: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedEvents = rsvps.map((rsvp) => ({
      id: rsvp.id,
      type: 'event' as const,
      targetId: rsvp.eventId,
      title: rsvp.event?.title || 'Cultural Gathering / Summit',
      subtitle: `${rsvp.event?.city || 'Addis Ababa'}${rsvp.event?.venue ? ` • ${rsvp.event.venue}` : ''}`,
      status: rsvp.status,
      createdAt: rsvp.createdAt.toISOString(),
      image: rsvp.event?.image,
      meta: {
        date: rsvp.event?.date ? rsvp.event.date.toISOString() : undefined,
        time: rsvp.event?.time || undefined,
        venue: rsvp.event?.venue || undefined,
        city: rsvp.event?.city || undefined,
        ticketsCount: rsvp.ticketsCount,
        passCode: `DAL-EVT-${rsvp.id.slice(0, 8).toUpperCase()}`,
        organizer: rsvp.event?.organizer || undefined,
        notes: rsvp.notes || undefined,
      },
    }));

    const formattedServices = serviceInquiries.map((inq) => ({
      id: inq.id,
      type: 'service' as const,
      targetId: inq.serviceId,
      title: inq.service?.name || 'Verified Diaspora Service',
      subtitle: inq.service?.category || 'Professional Assistance',
      status: inq.status,
      createdAt: inq.createdAt.toISOString(),
      image: inq.service?.image,
      meta: {
        category: inq.service?.category,
        providerName: inq.service?.name,
        timeframe: inq.timeframe || undefined,
        message: inq.message,
        contactPhone: inq.contactPhone || undefined,
        contactWhatsapp: inq.contactWhatsapp || undefined,
      },
    }));

    const formattedOrders = productOrders.map((ord) => ({
      id: ord.id,
      type: 'order' as const,
      targetId: ord.productId,
      title: ord.product?.title || 'Artisan Craft Order',
      subtitle: `${ord.quantity} item${ord.quantity > 1 ? 's' : ''} • ${ord.deliveryAddress}`,
      status: ord.status,
      createdAt: ord.createdAt.toISOString(),
      image: ord.product?.image,
      meta: {
        quantity: ord.quantity,
        unitPrice: ord.product?.price,
        currency: ord.product?.currency || 'ETB',
        totalPrice: ord.quantity * (ord.product?.price || 0),
        deliveryAddress: ord.deliveryAddress,
        notes: ord.notes || undefined,
      },
    }));

    const formattedInvestments = investmentInquiries.map((inv) => ({
      id: inv.id,
      type: 'investment' as const,
      targetId: inv.opportunityId,
      title: inv.opportunity?.title || 'Diaspora Investment Prospectus',
      subtitle: inv.opportunity?.sector ? `Sector: ${inv.opportunity.sector}` : 'Strategic Project',
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
      image: inv.opportunity?.image,
      meta: {
        sector: inv.opportunity?.sector,
        location: inv.opportunity?.location,
        investmentBudget: inv.investmentBudget || undefined,
        timeframe: inv.timeframe || undefined,
        message: inv.message,
      },
    }));

    const allItems = [
      ...formattedEvents,
      ...formattedServices,
      ...formattedOrders,
      ...formattedInvestments,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let pendingCount = 0;
    let confirmedCount = 0;
    for (const item of allItems) {
      const s = item.status.toLowerCase();
      if (s === 'pending' || s === 'in_review') pendingCount++;
      if (s === 'confirmed' || s === 'completed' || s === 'dispatched') confirmedCount++;
    }

    res.json({
      items: allItems,
      counts: {
        total: allItems.length,
        events: formattedEvents.length,
        services: formattedServices.length,
        orders: formattedOrders.length,
        investments: formattedInvestments.length,
        pending: pendingCount,
        confirmed: confirmedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});



