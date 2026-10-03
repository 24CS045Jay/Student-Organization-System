import { Router } from 'express';
import { authenticate } from '../middleware/auth';

export const eventsRouter = Router();

let events = [
  {
    id: 'ev-1',
    orgId: 'club-tech',
    title: 'CHARUSAT 24h Hackathon 2026',
    category: 'Hackathon',
    startsAt: '2026-10-18T09:00:00Z',
    location: 'Central Computing Lab & Auditorium B',
    capacity: 200,
    sold: 64,
    memberPrice: 150,
    nonMemberPrice: 350,
    status: 'Published'
  },
  {
    id: 'ev-2',
    orgId: 'club-tech',
    title: 'Generative AI & LLM Systems Workshop',
    category: 'Workshop',
    startsAt: '2026-10-25T14:00:00Z',
    location: 'Lab 402, CSPIT IT Building',
    capacity: 60,
    sold: 42,
    memberPrice: 100,
    nonMemberPrice: 250,
    status: 'Published'
  }
];

let tickets = [
  {
    id: 'TKT-TC-9801',
    orgId: 'club-tech',
    eventId: 'ev-1',
    attendeeName: 'Jay Barot',
    email: 'jay.barot@charusat.edu.in',
    seat: 'Pass #12',
    status: 'Valid',
    checkedInAt: null
  },
  {
    id: 'TKT-TC-9802',
    orgId: 'club-tech',
    eventId: 'ev-1',
    attendeeName: 'Param Joshi',
    email: 'param.j@charusat.edu.in',
    seat: 'Pass #13',
    status: 'Attended',
    checkedInAt: '10:15 AM, Today'
  }
];

// Events List
eventsRouter.get('/events', (req: any, res: any) => {
  res.json({ success: true, data: events });
});

eventsRouter.post('/events', authenticate, (req: any, res: any) => {
  const orgId = req.orgId || 'club-tech';
  const newEv = {
    id: `ev-${Date.now()}`,
    orgId,
    ...req.body,
    sold: 0,
    status: req.body.status || 'Published'
  };
  events.unshift(newEv);
  res.status(201).json({ success: true, data: newEv });
});

// Ticket Checkout & Reservation
eventsRouter.post('/events/:eventId/checkout', (req: any, res: any) => {
  const { eventId } = req.params;
  const ev = events.find(e => e.id === eventId);
  if (!ev) return res.status(404).json({ error: 'Event not found' });
  if (ev.sold >= ev.capacity) return res.status(400).json({ error: 'Event completely SOLD OUT!' });

  const { name, email, isMember, paymentDetails } = req.body;
  ev.sold += 1;

  const newTicket = {
    id: `TKT-TC-${Math.floor(1000 + Math.random() * 9000)}`,
    orgId: ev.orgId,
    eventId: ev.id,
    attendeeName: name || 'Student Attendee',
    email: email || 'student@charusat.edu.in',
    seat: `Pass #${ev.sold}`,
    status: 'Valid',
    checkedInAt: null,
    paymentId: paymentDetails?.paymentId || `PAY-${Date.now()}`
  };
  tickets.unshift(newTicket);
  res.status(201).json({ success: true, data: newTicket });
});

// Door QR Check-in Endpoint with anti-passback duplicate guard (Phase 4)
eventsRouter.post('/checkin', authenticate, (req: any, res: any) => {
  let { ticketId, orgId } = req.body;
  let cleanId = (ticketId || '').trim();

  if (cleanId.startsWith('CSQ1.') || cleanId.startsWith('CSM1.')) {
    const parts = cleanId.split('.');
    if (parts.length >= 2 && parts[1]) {
      cleanId = parts[1];
    }
  }

  const upperId = cleanId.toUpperCase();
  const tkt = tickets.find(
    t => t.id.toUpperCase() === upperId ||
         t.email.toLowerCase() === cleanId.toLowerCase() ||
         t.attendeeName.toLowerCase() === cleanId.toLowerCase()
  );
  if (!tkt) {
    return res.status(404).json({ status: 'INVALID', message: 'Ticket not found in gate registry.' });
  }

  if (tkt.orgId !== (orgId || req.orgId || 'club-tech')) {
    return res.status(403).json({ status: 'WRONG_ORGANIZATION', message: 'Cross-tenant violation: ticket belongs to another organization!' });
  }

  if (tkt.status === 'Attended') {
    return res.status(409).json({
      status: 'ALREADY_USED',
      message: `⚠️ Duplicate check-in rejected! Already scanned at ${tkt.checkedInAt}.`,
      ticket: tkt
    });
  }

  tkt.status = 'Attended';
  tkt.checkedInAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';

  res.json({
    status: 'VALID',
    message: `Check-in successful! Welcome ${tkt.attendeeName}`,
    ticket: tkt
  });
});
