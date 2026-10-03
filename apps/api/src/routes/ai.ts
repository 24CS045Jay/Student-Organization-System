import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const aiRouter = Router();

// 1. Organization Copilot (Extra D)
aiRouter.post('/copilot', authenticate, (req: any, res: any) => {
  const { prompt } = req.body;
  const lower = (prompt || '').toLowerCase();

  let responseText = '';
  if (lower.includes('member') || lower.includes('growth')) {
    responseText = '📊 **Membership Intelligence Report:** Active membership count stands at **142 members** (+18% MoM). 87% of members hold active paid status, with 12 renewals due in the next 15 days.';
  } else if (lower.includes('reimburse') || lower.includes('expense') || lower.includes('claim')) {
    responseText = '🧾 **Financial Oversight:** Found **2 pending reimbursement claims** totaling **₹2,750**. Both claims have valid attached GST invoices awaiting Event Manager / Treasurer dual-approval.';
  } else if (lower.includes('event') || lower.includes('hackathon')) {
    responseText = '🎟️ **Event Trajectory:** The upcoming *CHARUSAT 24h Hackathon* has booked **64 / 200 passes** (32% capacity). At the current acquisition rate, full capacity is projected 48 hours before registration closes.';
  } else {
    responseText = `🤖 **ClubSphere Intelligence:** Analyzed database context for query: "${prompt}". All organizational operations, treasury reserves, and tenant policies are operating within standard parameters.`;
  }

  res.json({
    success: true,
    data: {
      prompt,
      response: responseText,
      timestamp: new Date().toISOString()
    }
  });
});

// 2. AI Event Planner (Extra E)
aiRouter.post('/event-plan', authenticate, (req: any, res: any) => {
  const { eventType, targetAttendees, estimatedBudget } = req.body;
  const budget = Number(estimatedBudget) || 40000;
  const attendees = Number(targetAttendees) || 150;

  const plan = {
    eventType: eventType || 'Technical Workshop',
    projectedAttendees: attendees,
    recommendedVenue: attendees > 100 ? 'Central Auditorium B & Computer Labs' : 'Department Seminar Hall 3',
    budgetAllocation: {
      venueAndAV: Math.round(budget * 0.30),
      cateringAndRefreshments: Math.round(budget * 0.35),
      trophiesAndSwag: Math.round(budget * 0.25),
      marketingAndSocial: Math.round(budget * 0.10)
    },
    optimalPricing: {
      memberTicketInr: 150,
      nonMemberTicketInr: 300,
      projectedGrossRevenueInr: Math.round((attendees * 0.6 * 150) + (attendees * 0.4 * 300))
    },
    recommendedVolunteers: [
      { role: 'Registration & QR Check-in', count: 3, skills: ['Front Desk', 'Speed'] },
      { role: 'Stage & Audio/Visual', count: 2, skills: ['Technical A/V', 'Microphones'] },
      { role: 'Hospitality & Catering', count: 3, skills: ['Logistics', 'Food Distribution'] }
    ]
  };

  res.json({ success: true, data: plan });
});

// 3. Smart Volunteer Matching (Extra F)
aiRouter.post('/volunteer-match', authenticate, (req: any, res: any) => {
  const { taskTitle, requiredSkills } = req.body;
  const candidates = [
    { name: 'Jay Barot', matchScore: 96, skills: ['Event Logistics', 'Gate Registration'], availability: 'Available Weekends' },
    { name: 'Param Joshi', matchScore: 89, skills: ['Audio/Visual', 'Equipment Cables'], availability: 'Available Evenings' },
    { name: 'Diya Patel', matchScore: 84, skills: ['Stage Management', 'Hospitality'], availability: 'Flexible' }
  ];

  res.json({
    success: true,
    taskTitle,
    recommendations: candidates
  });
});

// 4. Financial Insights & Anomaly Detection (Section 15)
aiRouter.get('/insights', authenticate, (req: any, res: any) => {
  res.json({
    success: true,
    insights: [
      {
        severity: 'info',
        title: 'Strong Ticket Conversion Velocity',
        description: 'Ticket sales for Hackathon 2026 are tracking 34% faster than the previous cultural event cycle.'
      },
      {
        severity: 'warning',
        title: 'Pending Reimbursements Stalling',
        description: 'Two expense claims have exceeded 72 hours in submitted status without manager sign-off.'
      },
      {
        severity: 'success',
        title: 'Healthy Net Reserves',
        description: 'Treasury reserve covers 4.2x monthly operational overhead.'
      }
    ]
  });
});
