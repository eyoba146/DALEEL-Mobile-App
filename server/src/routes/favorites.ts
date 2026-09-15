import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const favoritesRouter = Router();
favoritesRouter.use(requireAuth);

favoritesRouter.get('/', async (req, res) => {
  const favorites = await prisma.favorite.findMany({ where: { userId: req.auth!.userId } });
  res.json(favorites);
});

const addSchema = z.object({
  itemType: z.enum(['destination', 'service', 'event', 'investment']),
  itemId: z.string().min(1),
});

favoritesRouter.post('/', async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'itemType and itemId are required' });

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_itemType_itemId: {
        userId: req.auth!.userId,
        itemType: parsed.data.itemType,
        itemId: parsed.data.itemId,
      },
    },
    update: {},
    create: { userId: req.auth!.userId, ...parsed.data },
  });
  res.status(201).json(favorite);
});

favoritesRouter.delete('/', async (req, res) => {
  const { itemType, itemId } = req.body;
  if (!itemType || !itemId) return res.status(400).json({ error: 'itemType and itemId are required' });

  await prisma.favorite.deleteMany({
    where: {
      userId: req.auth!.userId,
      itemType,
      itemId,
    },
  });
  res.status(204).send();
});

favoritesRouter.delete('/:id', async (req, res) => {
  const favorite = await prisma.favorite.findUnique({ where: { id: req.params.id } });
  if (!favorite || favorite.userId !== req.auth!.userId) {
    return res.status(404).json({ error: 'Favorite not found' });
  }
  await prisma.favorite.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
