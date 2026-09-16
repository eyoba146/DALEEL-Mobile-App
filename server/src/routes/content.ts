import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

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
        notes: notes ? String(notes).trim() : null,
      },
      include: {
        product: true,
      },
    });

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

