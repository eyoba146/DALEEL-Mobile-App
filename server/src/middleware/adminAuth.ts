import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AdminRole, User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AdminRequest extends Request {
  adminUser?: User;
}

export async function authenticateAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired administrative session token' });
  }
}

export function requireRole(allowedRoles: AdminRole[]) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({ error: 'Unauthenticated administrative user' });
    }

    // Super Admin has full permission across all modules
    if (req.adminUser.adminRole === AdminRole.SUPER_ADMIN || !req.adminUser.adminRole) {
      return next();
    }

    if (!allowedRoles.includes(req.adminUser.adminRole)) {
      return res.status(403).json({
        error: `Permission denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.adminUser.adminRole}`,
      });
    }

    next();
  };
}
