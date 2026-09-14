import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const contentRouter = Router();

contentRouter.get('/destinations', async (_req, res) => {
  const destinations = await prisma.destination.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(destinations);
});

contentRouter.get('/services', async (req, res) => {
  const { category } = req.query;
  const services = await prisma.service.findMany({
    where: category ? { category: String(category) } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  res.json(services);
});

contentRouter.get('/events', async (_req, res) => {
  const events = await prisma.eventItem.findMany({ orderBy: { date: 'asc' } });
  res.json(events);
});
