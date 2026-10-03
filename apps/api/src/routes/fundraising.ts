import { Router } from 'express';
import { authenticate, resolveOrg, requirePermission } from '../middleware/auth';

export const fundraisingRouter = Router();

fundraisingRouter.get('/fundraisers', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'List of fundraisers' });
});

fundraisingRouter.post('/fundraisers', authenticate, resolveOrg, requirePermission('events:write'), (req, res) => {
  res.json({ message: 'Fundraiser created successfully' });
});

fundraisingRouter.get('/fundraisers/:id/progress', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'Fundraiser progress for ' + req.params.id });
});

fundraisingRouter.get('/tasks', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'List of tasks' });
});

fundraisingRouter.post('/tasks', authenticate, resolveOrg, requirePermission('events:write'), (req, res) => {
  res.json({ message: 'Task created successfully' });
});

fundraisingRouter.patch('/tasks/:id', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'Task ' + req.params.id + ' updated' });
});

fundraisingRouter.get('/volunteers', authenticate, resolveOrg, requirePermission('members:read'), (req, res) => {
  res.json({ message: 'List of volunteers' });
});

fundraisingRouter.post('/volunteer-hours', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'Volunteer hours logged' });
});

fundraisingRouter.get('/leaderboard', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'Volunteer leaderboard' });
});
