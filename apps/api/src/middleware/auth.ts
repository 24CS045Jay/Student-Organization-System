import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission, OrgRole } from 'shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      org?: {
        id: string;
        slug: string;
      };
      orgRole?: OrgRole;
    }
  }
}

export type AuthRequest = Request;

// Mock Supabase auth middleware for now, until Supabase client is hooked up
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  // In a real app, we verify the JWT with Supabase here
  req.user = { id: 'mock-user-id', email: 'test@example.com' };
  next();
};

export const resolveOrg = (req: Request, res: Response, next: NextFunction) => {
  const orgSlug = (req.headers['x-org-slug'] as string) || (req.headers['x-org-id'] as string) || 'tech-club';
  
  // In a real app, query DB to ensure user is active member of this org
  // and attach org details and role to request.
  req.org = { id: 'mock-org-id', slug: orgSlug };
  req.orgRole = (req.headers['x-org-role'] as OrgRole) || 'admin';
  
  next();
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasPermission(req.orgRole, permission)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
