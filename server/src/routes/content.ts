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

contentRouter.get('/events', async (_req: Request, res: Response) => {
  try {
    const events = await prisma.eventItem.findMany({ orderBy: { date: 'asc' } });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
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

