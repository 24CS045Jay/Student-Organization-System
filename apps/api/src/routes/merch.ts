import { Router } from 'express';
import { authenticate, resolveOrg, requirePermission } from '../middleware/auth';

export const merchRouter = Router();

// Products
merchRouter.get('/products', authenticate, resolveOrg, (req: any, res: any) => {
  res.json({ message: 'List of products for org ' + req.org?.id });
});

merchRouter.post('/products', authenticate, resolveOrg, requirePermission('events:write'), (req, res) => {
  res.json({ message: 'Product created successfully' });
});

merchRouter.post('/products/:id/variants', authenticate, resolveOrg, requirePermission('events:write'), (req, res) => {
  res.json({ message: 'Variant added to product ' + req.params.id });
});

// Inventory
merchRouter.get('/inventory', authenticate, resolveOrg, requirePermission('events:read'), (req, res) => {
  res.json({ message: 'Inventory list' });
});

merchRouter.post('/inventory/adjust', authenticate, resolveOrg, requirePermission('events:write'), (req, res) => {
  res.json({ message: 'Inventory adjusted' });
});

// Orders
merchRouter.get('/merch/orders', authenticate, resolveOrg, requirePermission('events:read'), (req, res) => {
  res.json({ message: 'List of merchandise orders' });
});

merchRouter.post('/merch/checkout', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'Merch checkout successful' });
});

merchRouter.patch('/merch/orders/:id/status', authenticate, resolveOrg, requirePermission('events:write'), (req, res) => {
  res.json({ message: 'Order ' + req.params.id + ' status updated' });
});
