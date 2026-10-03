import { Router } from 'express';
import { authenticate, resolveOrg, requirePermission } from '../middleware/auth';

export const orgRouter = Router();

orgRouter.post('/', authenticate, (req, res) => {
  // Create a new organization and assign the creator as 'admin'
  res.json({ message: 'Organization created successfully' });
});

orgRouter.get('/:id', authenticate, resolveOrg, (req, res) => {
  res.json({
    id: req.org?.id,
    slug: req.org?.slug,
    name: 'Tech Club',
    type: 'technical'
  });
});

orgRouter.post('/:id/invite', authenticate, resolveOrg, requirePermission('settings:write'), (req, res) => {
  const { email, role } = req.body;
  // Invite user to the org
  res.json({ message: `Invited ${email} as ${role}` });
});
