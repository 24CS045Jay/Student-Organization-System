import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { orgRouter } from './routes/org';
import { merchRouter } from './routes/merch';
import { fundraisingRouter } from './routes/fundraising';
import { financeRouter } from './routes/finance';
import { membershipRouter } from './routes/membership';
import { reportsRouter } from './routes/reports';
import { analyticsRouter } from './routes/analytics';

import { eventsRouter } from './routes/events';
import { differentiatorsRouter } from './routes/differentiators';
import { platformRouter } from './routes/platform';
import { aiRouter } from './routes/ai';
import { healthRouter } from './routes/health';
import { emailRouter } from './routes/email';

import { syncRouter } from './routes/sync';
import { membershipService } from './services/membershipService';

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/email', emailRouter);
app.use('/api/v1/orgs', orgRouter);
app.use('/api/v1', eventsRouter);
app.use('/api/v1', merchRouter);
app.use('/api/v1', fundraisingRouter);
app.use('/api/v1', financeRouter);
app.use('/api/v1', membershipRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1', differentiatorsRouter);
app.use('/api/v1/platform', platformRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1', healthRouter);
app.use('/api/v1/sync', syncRouter);

// Automated Membership Renewal & Expiration Scheduler (FR-06, FR-18)
const runAutomatedReminders = () => {
  const orgKeys = ['tech-club', 'cult-club', 'sports-club'];
  orgKeys.forEach((slug) => {
    try {
      const res = membershipService.processDailyReminders(slug);
      if (res.expired_count > 0 || res.reminders_created > 0) {
        console.log(`[Automated Cron] Org ${slug}: Expired ${res.expired_count}, sent ${res.reminders_created} renewal notices (30/15/3 days).`);
      }
    } catch (e: any) {
      console.error(`[Automated Cron Error] ${slug}:`, e.message);
    }
  });
};

// Initial trigger and recurring 1-hour interval
runAutomatedReminders();
setInterval(runAutomatedReminders, 60 * 60 * 1000);

app.get('/', (req: any, res: any) => {
  res.json({
    name: 'ClubSphere API — Master Campus OS',
    version: '2.0.0',
    executedPhases: [
      'Phase 0: Monorepo Foundation',
      'Phase 1: Auth & Multi-Tenancy (RLS)',
      'Phase 2: Membership Management & Dues',
      'Phase 3: Events & Live Razorpay Gateway',
      'Phase 4: Digital QR Scanner & Anti-Passback',
      'Phase 5: Resend Communication & In-App Alerts',
      'Phase 6: Merchandise Inventory & POS',
      'Phase 7: Fundraising, Volunteers & Kanban',
      'Phase 8: Treasury, Append-Only Ledger & Reimbursements',
      'Phase 9: Reports & Cross-Tenant Analytics',
      'Phase 10: Certificates, Feedback, Sponsors & Donations',
      'Phase 11: SaaS Hierarchy, Tier Limits & Feature Flags',
      'Phase 12: AI Copilot, Event Planner & Insights',
      'Phase 13: System Hardening, Audit Logs & Health'
    ],
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`ClubSphere API running on http://localhost:${port}`);
});
