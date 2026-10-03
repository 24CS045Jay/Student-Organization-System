import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission, OrgRole } from 'shared/src/permissions';

export interface AuthRequest extends Request {
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

// Mock Supabase auth middleware for now, until Supabase client is hooked up
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  // In a real app, we verify the JWT with Supabase here
  req.user = { id: 'mock-user-id', email: 'test@example.com' };
  next();
};

export const resolveOrg = (req: AuthRequest, res: Response, next: NextFunction) => {
  const orgSlug = req.headers['x-org-slug'] as string;
  if (!orgSlug) {
    return res.status(400).json({ error: 'Missing x-org-slug header' });
  }
  
  // In a real app, query DB to ensure user is active member of this org
  // and attach org details and role to request.
  req.org = { id: 'mock-org-id', slug: orgSlug };
  req.orgRole = 'admin'; // Mocking role for now
  
  next();
};

export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!hasPermission(req.orgRole, permission)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
