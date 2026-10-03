import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  // Call Supabase auth.signUp
  res.json({ message: 'User registered successfully' });
});

authRouter.get('/me', authenticate, (req, res) => {
  // Returns profile and list of orgs the user is a member of
  res.json({
    profile: req.user,
    orgs: [
      { id: 'mock-org-id', slug: 'tech-club', name: 'Tech Club', role: 'admin' }
    ]
  });
});
