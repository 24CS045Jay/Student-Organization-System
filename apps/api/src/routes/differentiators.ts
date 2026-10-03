import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const differentiatorsRouter = Router();

// In-memory backing store for demo/hybrid executions
let certificates = [
  {
    id: 'cert-1',
    orgId: 'club-tech',
    certificateNo: 'CERT-TC-2026-001',
    studentName: 'Diya Patel',
    studentId: '22CE045',
    eventName: 'CHARUSAT 24h Hackathon 2026',
    issuedAt: '2026-09-15',
    qrCode: 'CERT-TC-2026-001-VERIFIED',
    type: 'Certificate of Excellence'
  },
  {
    id: 'cert-2',
    orgId: 'club-tech',
    certificateNo: 'CERT-TC-2026-002',
    studentName: 'Priya Desai',
    studentId: '23CS104',
    eventName: 'Generative AI Workshop',
    issuedAt: '2026-09-20',
    qrCode: 'CERT-TC-2026-002-VERIFIED',
    type: 'Certificate of Participation'
  }
];

let feedbackList = [
  {
    id: 'fb-1',
    orgId: 'club-tech',
    eventTitle: 'CHARUSAT 24h Hackathon 2026',
    author: 'Jay Barot',
    ratings: { overall: 5, speaker: 5, content: 5, venue: 4, organization: 5 },
    comment: 'Exceptional mentoring and flawless logistics! The 24h food arrangements were top tier.',
    createdAt: '2026-09-18'
  },
  {
    id: 'fb-2',
    orgId: 'club-tech',
    eventTitle: 'Generative AI Workshop',
    author: 'Param Joshi',
    ratings: { overall: 4, speaker: 5, content: 4, venue: 4, organization: 4 },
    comment: 'Hands-on prompts and HuggingFace fine-tuning sessions were extremely practical.',
    createdAt: '2026-09-22'
  }
];

let sponsorsList = [
  {
    id: 'sp-1',
    orgId: 'club-tech',
    company: 'TechCorp Solutions',
    tier: 'Gold Sponsor',
    amount: 50000,
    contact: 'sponsorships@techcorp.io',
    contactPerson: 'Aditya Mehta',
    status: 'Confirmed',
    contractSigned: true,
    perks: ['Title Logo on Stage', 'Recruitment Booth', '5min Keynote Address']
  },
  {
    id: 'sp-2',
    orgId: 'club-tech',
    company: 'CloudNative Systems',
    tier: 'Silver Sponsor',
    amount: 25000,
    contact: 'partners@cloudnative.dev',
    contactPerson: 'Sneha Rao',
    status: 'Confirmed',
    contractSigned: true,
    perks: ['Lanyard Logo', 'Digital Pass Branding', 'Swag Kit Inserts']
  }
];

let donationsList = [
  {
    id: 'don-1',
    orgId: 'club-tech',
    donorName: 'Anonymous Alumnus (Batch 2020)',
    amount: 15000,
    date: '2026-09-10',
    campaign: 'Hardware & Robotics Lab Fund',
    anonymous: true,
    receiptNo: 'DON-REC-8921'
  },
  {
    id: 'don-2',
    orgId: 'club-tech',
    donorName: 'Dr. R. K. Patel',
    amount: 10000,
    date: '2026-09-14',
    campaign: 'Student Hackathon Travel Grant',
    anonymous: false,
    receiptNo: 'DON-REC-8922'
  }
];

// --- 1. Digital Certificates (Extra L) ---
differentiatorsRouter.get('/certificates', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  res.json({ success: true, data: certificates.filter(c => c.orgId === orgId) });
});

differentiatorsRouter.post('/certificates', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  const { studentName, studentId, eventName, type } = req.body;
  const newCert = {
    id: `cert-${Date.now()}`,
    orgId,
    certificateNo: `CERT-${orgId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    studentName: studentName || 'Student Recipient',
    studentId: studentId || '23CS001',
    eventName: eventName || 'Certified Workshop',
    issuedAt: new Date().toISOString().split('T')[0],
    qrCode: `CERT-VERIFIED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    type: type || 'Certificate of Completion'
  };
  certificates.unshift(newCert);
  res.status(201).json({ success: true, data: newCert });
});

// Public certificate verification route (NFR-03 & Extra L)
differentiatorsRouter.get('/public/certificates/:code/verify', (req: any, res: any) => {
  const code = (req.params.code || '').trim().toUpperCase();
  const cert = certificates.find(c => c.certificateNo.toUpperCase() === code || c.qrCode.toUpperCase() === code);
  if (!cert) {
    return res.status(404).json({ valid: false, message: 'Certificate verification failed. Record not found.' });
  }
  res.json({
    valid: true,
    certificateNo: cert.certificateNo,
    studentName: cert.studentName,
    eventName: cert.eventName,
    issuedAt: cert.issuedAt,
    type: cert.type,
    issuer: 'ClubSphere Verified Credential Authority'
  });
});

// --- 2. Event Feedback & Analytics (Extra M) ---
differentiatorsRouter.get('/feedback', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  const clubFb = feedbackList.filter(f => f.orgId === orgId);
  const avgRating = clubFb.length ? (clubFb.reduce((acc, f) => acc + f.ratings.overall, 0) / clubFb.length).toFixed(1) : 5.0;
  res.json({ success: true, data: clubFb, stats: { totalResponses: clubFb.length, averageRating: Number(avgRating) } });
});

differentiatorsRouter.post('/feedback', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  const { eventTitle, ratings, comment } = req.body;
  const newFb = {
    id: `fb-${Date.now()}`,
    orgId,
    eventTitle: eventTitle || 'Club Event',
    author: req.user?.email || 'Student Attendee',
    ratings: ratings || { overall: 5, speaker: 5, content: 5, venue: 5, organization: 5 },
    comment: comment || 'Great organization!',
    createdAt: new Date().toISOString().split('T')[0]
  };
  feedbackList.unshift(newFb);
  res.status(201).json({ success: true, data: newFb });
});

// --- 3. Sponsors & Partnerships (Extra J) ---
differentiatorsRouter.get('/sponsors', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  res.json({ success: true, data: sponsorsList.filter(s => s.orgId === orgId) });
});

differentiatorsRouter.post('/sponsors', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  const newSponsor = {
    id: `sp-${Date.now()}`,
    orgId,
    ...req.body,
    status: 'Confirmed',
    contractSigned: true
  };
  sponsorsList.unshift(newSponsor);
  res.status(201).json({ success: true, data: newSponsor });
});

// --- 4. Donations & Campaign Funding (Extra K) ---
differentiatorsRouter.get('/donations', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  res.json({ success: true, data: donationsList.filter(d => d.orgId === orgId) });
});

differentiatorsRouter.post('/donations', (req: any, res: any) => {
  const { orgId, donorName, amount, campaign, anonymous } = req.body;
  const newDonation = {
    id: `don-${Date.now()}`,
    orgId: orgId || 'club-tech',
    donorName: anonymous ? 'Anonymous Supporter' : (donorName || 'Alumni Contributor'),
    amount: Number(amount) || 1000,
    date: new Date().toISOString().split('T')[0],
    campaign: campaign || 'Club General Fund',
    anonymous: Boolean(anonymous),
    receiptNo: `DON-REC-${Math.floor(1000 + Math.random() * 9000)}`
  };
  donationsList.unshift(newDonation);
  res.status(201).json({
    success: true,
    message: 'Donation received successfully. 80G tax receipt generated.',
    data: newDonation
  });
});
