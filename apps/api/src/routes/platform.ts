import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const platformRouter = Router();

const subscriptionPlans = [
  {
    id: 'plan-free',
    code: 'free',
    name: 'Free Starter Club',
    priceMonthly: 0,
    maxMembers: 150,
    activeEvents: 2,
    features: {
      ticketing: true,
      merch: false,
      aiCopilot: false,
      customBranding: false,
      prioritySupport: false
    }
  },
  {
    id: 'plan-pro',
    code: 'professional',
    name: 'Professional Club',
    priceMonthly: 199900, // ₹1,999 in paise
    maxMembers: 500,
    activeEvents: 10,
    features: {
      ticketing: true,
      merch: true,
      aiCopilot: true,
      customBranding: true,
      prioritySupport: true
    }
  },
  {
    id: 'plan-ent',
    code: 'enterprise',
    name: 'Campus Enterprise Guild',
    priceMonthly: 499900, // ₹4,999 in paise
    maxMembers: null, // Unlimited
    activeEvents: null, // Unlimited
    features: {
      ticketing: true,
      merch: true,
      aiCopilot: true,
      customBranding: true,
      prioritySupport: true,
      customDomain: true,
      ssoIntegration: true
    }
  }
];

const hierarchyData = {
  university: 'Charotar University of Science and Technology (CHARUSAT)',
  colleges: [
    {
      id: 'col-cspit',
      name: 'Chandubhai S. Patel Institute of Technology (CSPIT)',
      departments: ['Computer Engineering', 'Information Technology', 'Electronics & Comm.']
    },
    {
      id: 'col-depstar',
      name: 'Devang Patel Institute of Advance Technology and Research (DEPSTAR)',
      departments: ['Computer Science', 'Artificial Intelligence', 'Data Science']
    }
  ]
};

const moduleToggles: Record<string, boolean> = {
  'ticketing': true,
  'merch': true,
  'gamification': true,
  'ai-copilot': true,
  'audit-log': true,
  'sponsorships': true
};

// Platform SaaS Plans
platformRouter.get('/plans', (req: any, res: any) => {
  res.json({ success: true, data: subscriptionPlans });
});

// Platform Campus Hierarchy Tree
platformRouter.get('/hierarchy', authenticate, (req: any, res: any) => {
  res.json({ success: true, data: hierarchyData });
});

// Module Architecture Feature Flags
platformRouter.get('/modules', authenticate, (req: any, res: any) => {
  res.json({ success: true, data: moduleToggles });
});

platformRouter.patch('/modules/:moduleId', authenticate, (req: any, res: any) => {
  const { moduleId } = req.params;
  const { enabled } = req.body;
  moduleToggles[moduleId] = Boolean(enabled);
  res.json({ success: true, moduleId, enabled: moduleToggles[moduleId] });
});

// Platform Tenant Health Overview
platformRouter.get('/analytics', authenticate, (req: any, res: any) => {
  res.json({
    success: true,
    data: {
      activeTenantsCount: 3,
      totalStudentsEnrolled: 356,
      grossVolumeProcessedPaise: 48500000, // ₹4,85,000
      activeSubscriptions: 2,
      platformUptimePct: 99.98
    }
  });
});
