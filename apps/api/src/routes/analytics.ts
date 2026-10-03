import { Router } from 'express';
import { authenticate, resolveOrg, requirePermission } from '../middleware/auth';

export const analyticsRouter = Router();

// Dashboard Summary Stats
analyticsRouter.get('/summary', authenticate, resolveOrg, (req: any, res: any) => {
  // Aggregate data for role-based dashboards
  res.json({
    metrics: {
      totalMembers: 1250,
      activeMembers: 1100,
      revenueThisMonth: 150000,
      eventsHosted: 12
    }
  });
});

// Membership Growth Analytics
analyticsRouter.get('/membership-growth', authenticate, resolveOrg, requirePermission('members:read'), (req: any, res: any) => {
  res.json({
    growth: [
      { date: '2025-01', count: 100 },
      { date: '2025-02', count: 150 },
      { date: '2025-03', count: 300 }
    ],
    retentionRate: '85%'
  });
});

// Event Profitability
analyticsRouter.get('/event-profitability', authenticate, resolveOrg, requirePermission('finance:read'), (req: any, res: any) => {
  res.json({
    events: [
      { name: 'Tech Symposium', revenue: 200000, cost: 50000, profit: 150000 },
      { name: 'Hackathon', revenue: 80000, cost: 30000, profit: 50000 }
    ]
  });
});
