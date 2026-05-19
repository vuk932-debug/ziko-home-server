import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isApproved: true,
          isVerified: true,
          trustScore: true,
          isBanned: true,
          isActive: true
        }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const userAny = user as any;
      if (userAny.isBanned || !userAny.isActive) {
        return res.status(403).json({ message: 'User account is inactive or suspended' });
      }

      req.user = userAny;
      console.log(`[AUTH] User authenticated: ${userAny.email} (${userAny.id}), Role: ${userAny.role}`);
      next();
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const softAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isApproved: true,
          isVerified: true,
          trustScore: true,
          isBanned: true,
          isActive: true
        }
      });

      if (user && !user.isBanned && user.isActive) {
        req.user = user;
        console.log(`[SOFT-AUTH] User identified: ${user.email} (${user.id})`);
      }
    } catch (error) {
      // Ignore errors for soft auth
      console.warn('[SOFT-AUTH] Token provided but invalid');
    }
  }
  next();
};

export const roleMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
    }
    next();
  };
};

export const sellerApprovedMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Terminology alignment: CP is the new Seller
  if (req.user && (req.user.role === 'CP' || req.user.role === 'Seller') && !req.user.isApproved) {
    return res.status(403).json({ message: 'Access forbidden: Account is pending admin approval' });
  }
  next();
};
