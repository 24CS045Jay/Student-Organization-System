import { Router } from 'express';
import { authenticate, resolveOrg, requirePermission } from '../middleware/auth';

export const financeRouter = Router();

financeRouter.get('/finance/dashboard', authenticate, resolveOrg, requirePermission('finance:read'), (req, res) => {
  res.json({ message: 'Finance dashboard data' });
});

financeRouter.get('/income', authenticate, resolveOrg, requirePermission('finance:read'), (req, res) => {
  res.json({ message: 'Income records' });
});

financeRouter.post('/income', authenticate, resolveOrg, requirePermission('finance:write'), (req, res) => {
  res.json({ message: 'Income recorded' });
});

financeRouter.get('/expenses', authenticate, resolveOrg, requirePermission('finance:read'), (req, res) => {
  res.json({ message: 'Expense records' });
});

financeRouter.post('/expenses', authenticate, resolveOrg, requirePermission('finance:write'), (req, res) => {
  res.json({ message: 'Expense recorded' });
});

financeRouter.post('/expenses/:id/receipt', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'Receipt uploaded for expense ' + req.params.id });
});

financeRouter.get('/budgets', authenticate, resolveOrg, requirePermission('finance:read'), (req, res) => {
  res.json({ message: 'Budgets list' });
});

financeRouter.post('/budgets', authenticate, resolveOrg, requirePermission('finance:write'), (req, res) => {
  res.json({ message: 'Budget created' });
});

financeRouter.post('/reimbursements', authenticate, resolveOrg, (req, res) => {
  res.json({ message: 'Reimbursement submitted' });
});

financeRouter.post('/reimbursements/:id/manager-approve', authenticate, resolveOrg, requirePermission('events:write'), (req, res) => {
  res.json({ message: 'Reimbursement ' + req.params.id + ' manager approved' });
});

financeRouter.post('/reimbursements/:id/treasurer-approve', authenticate, resolveOrg, requirePermission('finance:write'), (req, res) => {
  res.json({ message: 'Reimbursement ' + req.params.id + ' treasurer approved' });
});

financeRouter.post('/reimbursements/:id/pay', authenticate, resolveOrg, requirePermission('finance:write'), (req, res) => {
  res.json({ message: 'Reimbursement ' + req.params.id + ' paid' });
});

financeRouter.post('/reimbursements/:id/reject', authenticate, resolveOrg, requirePermission('finance:write'), (req, res) => {
  res.json({ message: 'Reimbursement ' + req.params.id + ' rejected' });
});
