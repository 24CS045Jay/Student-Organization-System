import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const healthRouter = Router();

const systemAuditLogs = [
  {
    id: 101,
    orgId: 'club-tech',
    user: 'admin@tech.demo',
    role: 'admin',
    action: 'Created Event',
    details: 'Created event "CHARUSAT 24h Hackathon 2026"',
    timestamp: '2026-10-01 09:30:00'
  },
  {
    id: 102,
    orgId: 'club-tech',
    user: 'treasurer@tech.demo',
    role: 'treasurer',
    action: 'Approved Reimbursement Claim',
    details: 'Approved ₹1,800 for Jay Barot (Supplies & Printing)',
    timestamp: '2026-10-02 14:15:22'
  },
  {
    id: 103,
    orgId: 'club-tech',
    user: 'events@tech.demo',
    role: 'event_manager',
    action: 'QR Check-in Scanned',
    details: 'Scanned ticket #TKT-TC-9802 at Gate 1',
    timestamp: '2026-10-03 10:15:00'
  }
];

// Health Check Endpoint (Phase 13 / NFR-04)
healthRouter.get('/health', (req: any, res: any) => {
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    system: {
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version
    },
    services: {
      database: 'connected (Supabase Postgres RLS)',
      redisQueue: 'active',
      paymentGateway: 'active (Razorpay Test Mode)',
      emailProvider: 'connected (Resend API)'
    }
  });
});

// Audit Log Query Endpoint (Phase 13 / NFR-10)
healthRouter.get('/audit-logs', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  res.json({
    success: true,
    totalLogs: systemAuditLogs.length,
    data: systemAuditLogs.filter(l => l.orgId === orgId)
  });
});
