import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

export const reviewsRouter = Router();

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

// Initial seed reviews for core artisan products & services if empty
const SAMPLE_REVIEWS = [
  {
    targetType: 'service',
    targetId: 's1', // Addis Relocation Partners
    authorName: 'Dawit Wolde-Mariam (Toronto)',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    rating: 5,
    title: 'Flawless relocation from Toronto to Addis!',
    comment: 'The container customs clearance through Modjo dry port was handled without a single hitch. Their team expedited our Yellow Card and leased an exceptional home in Old Airport. Essential service for returning diaspora.',
    photos: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800',
    verified: true,
    status: 'approved',
    helpfulCount: 28,
  },
  {
    targetType: 'service',
    targetId: 's1',
    authorName: 'Sara Kifle (Washington D.C.)',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    rating: 5,
    title: 'Peace of mind for expat families',
    comment: 'Helped our kids get placed at Bingham International within 3 weeks of arrival. Always responsive on WhatsApp at all hours.',
    verified: true,
    status: 'approved',
    helpfulCount: 14,
  },
  {
    targetType: 'service',
    targetId: 's2', // Habesha Legal Group
    authorName: 'Yohannes Tadesse (London)',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    rating: 5,
    title: 'Bulletproof land title verification',
    comment: 'Before purchasing property in Bole Bulbula, Habesha Legal conducted a full registry deed audit and discovered conflicting claims. Saved me hundreds of thousands of dollars.',
    verified: true,
    status: 'approved',
    helpfulCount: 39,
  },
  {
    targetType: 'product',
    targetId: 'p1', // Royal Habesha Kemis
    authorName: 'Hanna Berhane (Atlanta)',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    rating: 5,
    title: 'Breathtaking craftsmanship for our wedding ceremony',
    comment: 'The pure cotton Shemma and 24K gold thread embroidery is stunning. Arrived in Atlanta via DHL in perfect condition. Authentic master weaving.',
    photos: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
    verified: true,
    status: 'approved',
    helpfulCount: 42,
  },
  {
    targetType: 'product',
    targetId: 'p2', // Guji Highland Peaberry
    authorName: 'Samuel Haile (Seattle)',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    rating: 5,
    title: 'Unbelievable floral and bergamot notes',
    comment: 'Hands down the best Ethiopian specialty coffee I have ever roasted. Direct fair-trade from Uraga washing station. Will definitely order monthly.',
    photos: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
    verified: true,
    status: 'approved',
    helpfulCount: 19,
  },
];

// Seed on module load if table is empty
(async () => {
  try {
    const count = await prisma.review.count();
    if (count === 0) {
      for (const rev of SAMPLE_REVIEWS) {
        await prisma.review.create({ data: rev });
      }
      console.log('Seeded initial diaspora community reviews.');
    }
  } catch {
    // Ignore if DB not ready
  }
})();

// GET /api/reviews/:targetType/:targetId
reviewsRouter.get('/:targetType/:targetId', async (req: Request, res: Response) => {
  const targetType = String(req.params.targetType);
  const targetId = String(req.params.targetId);

  try {
    const reviews = await prisma.review.findMany({
      where: {
        targetType,
        targetId,
        status: 'approved',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            userType: true,
            country: true,
          },
        },
      },
    });

    const totalReviews = reviews.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRating = 0;

    for (const r of reviews) {
      const star = Math.max(1, Math.min(5, r.rating));
      distribution[star] = (distribution[star] || 0) + 1;
      sumRating += star;
    }

    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 5.0;

    res.json({
      targetType,
      targetId,
      totalReviews,
      averageRating,
      distribution,
      reviews,
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

// POST /api/reviews
reviewsRouter.post('/', async (req: Request, res: Response) => {
  const userId = getOptionalUserId(req);
  const { targetType, targetId, rating, title, comment, photos, authorName } = req.body;

  if (!targetType || !targetId || !comment) {
    res.status(400).json({ error: 'targetType, targetId, and review comment are required' });
    return;
  }

  const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));

  try {
    let resolvedAuthorName = authorName?.trim();
    let resolvedAvatar: string | undefined = undefined;

    if (userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser) {
        resolvedAuthorName = resolvedAuthorName || dbUser.name;
        resolvedAvatar = dbUser.avatarUrl || undefined;
      }
    }

    if (!resolvedAuthorName) {
      resolvedAuthorName = 'Diaspora Community Member';
    }

    const review = await prisma.review.create({
      data: {
        targetType,
        targetId,
        userId: userId || null,
        authorName: resolvedAuthorName,
        authorAvatar: resolvedAvatar,
        rating: numericRating,
        title: title?.trim() || null,
        comment: comment.trim(),
        photos: Array.isArray(photos) ? photos.join(',') : (photos?.trim() || null),
        verified: true,
        status: 'approved',
        helpfulCount: 0,
      },
    });

    res.status(201).json({ review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

export async function resolveTargetInfo(targetType: string, targetId: string) {
  try {
    if (targetType === 'product') {
      const p = await prisma.product.findUnique({ where: { id: targetId } });
      if (p) return { targetTitle: p.title, targetImage: p.image, targetCategory: p.category };
      if (targetId === 'p1') return { targetTitle: 'Royal Habesha Kemis', targetImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800', targetCategory: 'Traditional Attire' };
      if (targetId === 'p2') return { targetTitle: 'Guji Highland Peaberry Coffee', targetImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800', targetCategory: 'Specialty Coffee' };
    } else if (targetType === 'service') {
      const s = await prisma.service.findUnique({ where: { id: targetId } });
      if (s) return { targetTitle: s.name, targetImage: s.image, targetCategory: s.category };
      if (targetId === 's1') return { targetTitle: 'Addis Relocation Partners', targetImage: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800', targetCategory: 'Relocation & Housing' };
      if (targetId === 's2') return { targetTitle: 'Habesha Legal Group', targetImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', targetCategory: 'Legal & Land Title' };
      if (targetId === 's3') return { targetTitle: 'Bole Executive Concierge & Chauffeur', targetImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800', targetCategory: 'Logistics & Transport' };
    } else if (targetType === 'destination') {
      const d = await prisma.destination.findUnique({ where: { id: targetId } });
      if (d) return { targetTitle: d.name, targetImage: d.image, targetCategory: d.region };
      if (targetId === 'd1') return { targetTitle: 'Lalibela Rock-Hewn Churches', targetImage: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd1?w=800', targetCategory: 'Amhara Region' };
      if (targetId === 'd2') return { targetTitle: 'Simien Mountains National Park', targetImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', targetCategory: 'Highland Escarpments' };
      if (targetId === 'd3') return { targetTitle: 'Gondar Fasil Ghebbi Royal Enclosure', targetImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800', targetCategory: 'Imperial Castles' };
      if (targetId === 'd4') return { targetTitle: 'Harar Jugol Fortified Historic Town', targetImage: 'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?w=800', targetCategory: 'Historic Walled City' };
    }
  } catch (err) {
    console.warn('resolveTargetInfo error:', err);
  }
  return {
    targetTitle: `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} (${targetId})`,
    targetImage: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800',
    targetCategory: targetType,
  };
}

// GET /api/reviews/my (Reviews authored by the current user)
reviewsRouter.get('/my', async (req: Request, res: Response) => {
  const userId = getOptionalUserId(req);
  const email = req.query.email ? String(req.query.email).trim().toLowerCase() : undefined;

  try {
    let resolvedUser: { id: string; name: string } | null = null;
    if (userId) {
      resolvedUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
    } else if (email) {
      resolvedUser = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
    }

    const whereCondition = resolvedUser
      ? {
          OR: [
            { userId: resolvedUser.id },
            { authorName: resolvedUser.name },
          ],
        }
      : { userId: 'unauthenticated' };

    const rawReviews = await prisma.review.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            userType: true,
            country: true,
          },
        },
      },
    });

    const reviews = await Promise.all(
      rawReviews.map(async (r) => {
        const targetMeta = await resolveTargetInfo(r.targetType, r.targetId);
        return {
          ...r,
          ...targetMeta,
        };
      })
    );

    const totalReviews = reviews.length;
    const totalHelpfulReceived = reviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0);
    const avgRatingGiven = totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

    res.json({
      reviews,
      stats: {
        totalReviews,
        totalHelpfulReceived,
        avgRatingGiven,
      },
    });
  } catch (error) {
    console.error('Fetch my reviews error:', error);
    res.status(500).json({ error: 'Failed to retrieve your reviews' });
  }
});

// PATCH /api/reviews/:id (Author edits their review)
reviewsRouter.patch('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { rating, title, comment, photos } = req.body;

  try {
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const updateData: any = {};
    if (rating !== undefined) updateData.rating = Math.max(1, Math.min(5, Number(rating)));
    if (title !== undefined) updateData.title = String(title).trim() || null;
    if (comment !== undefined) updateData.comment = String(comment).trim();
    if (photos !== undefined) {
      updateData.photos = Array.isArray(photos) ? photos.join(',') : (String(photos).trim() || null);
    }

    const updated = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    res.json({ review: updated });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE /api/reviews/:id (Author deletes review)
reviewsRouter.delete('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// POST /api/reviews/:id/helpful
reviewsRouter.post('/:id/helpful', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const updated = await prisma.review.update({
      where: { id },
      data: {
        helpfulCount: { increment: 1 },
      },
    });
    res.json({ review: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});
