// ==========================================================================
// ClubSphere Unified Service Layer
// All components invoke services with tenant context (orgId)
// ==========================================================================

import { dbInstance, inr } from '../mock/db';
import { generateSignedQRToken, verifyQRToken } from './qrSecurityService';
import { sendEmail, sendTicketConfirmationEmail, sendClubCredentialsEmail } from './emailService';
import { notificationService } from './notificationService';
import { supabaseSync } from './supabaseService';
import { aiService } from './aiService';
import { apiClient } from './apiClient';

export const clubService = {
  // Central API Synchronization Helpers
  syncToBackend: async (type, orgId, payload) => {
    try {
      await apiClient.post('/sync/mutation', { type, orgId, payload });
    } catch (e) {
      console.warn(`[Sync Notice] Central API sync deferred: ${e.message}`);
    }
  },

  syncFullLedgerToBackend: async (orgId) => {
    try {
      const club = dbInstance.getClub(orgId);
      await apiClient.post('/sync/state', club, {
        headers: { 'x-org-id': orgId }
      });
    } catch (e) {
      console.warn(`[Sync Notice] Full state sync deferred: ${e.message}`);
    }
  },

  // Tenant validation
  getClub: (orgId) => {
    return dbInstance.getClub(orgId);
  },

  getAllClubsList: () => {
    return Object.values(dbInstance.data.clubs).map(c => ({
      id: c.id,
      name: c.name,
      short: c.short,
      prefix: c.prefix,
      category: c.category,
      color: c.color,
      accentColor: c.accentColor
    }));
  },

  // --- Membership Services (FR-01, FR-02) ---
  getMembers: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...club.members];
  },

  getMembershipTypes: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return club.membershipTypes || [];
  },

  registerMember: (orgId, memberData, session) => {
    const club = dbInstance.getClub(orgId);
    const count = club.members.length + 1;
    const newId = `${club.prefix}-${String(count).padStart(3, '0')}`;
    
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);

    const newMember = {
      id: newId,
      name: memberData.name,
      email: memberData.email,
      studentId: memberData.studentId || `24CS${String(count + 50).padStart(3, '0')}`,
      dept: memberData.dept || 'Computer Engineering',
      type: memberData.type || 'Standard Member',
      exp: memberData.exp || expDate.toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      paid: memberData.paid ? 1 : 0,
      status: memberData.paid ? 'Active' : 'Unpaid',
      photo: memberData.photo || '🧑‍🎓',
      phone: memberData.phone || '+91 98980 00111',
      attendanceCount: 0,
      history: [
        { date: new Date().toISOString().split('T')[0], action: `Registered as ${memberData.type || 'Standard Member'}`, amt: memberData.type?.includes('Premium') ? 999 : 499 }
      ]
    };

    club.members.unshift(newMember);
    club.stats.membersCount = club.members.length;

    if (newMember.paid) {
      const amt = memberData.type?.includes('Premium') ? 999 : 499;
      club.finance.totalIncome += amt;
      club.finance.netBalance += amt;
      const memSource = club.finance.incomeSources.find(s => s.source === 'Membership Dues');
      if (memSource) {
        memSource.amount += amt;
        memSource.count += 1;
      }
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Registered New Member', `Created ID ${newId} for ${newMember.name}`, 'None', newId);
    dbInstance.save();
    supabaseSync.syncMember(orgId, newMember);
    clubService.syncToBackend('MEMBER_REGISTERED', orgId, newMember);
    return newMember;
  },

  renewMember: (orgId, memberId, months = 12, session, newPlan = null) => {
    const club = dbInstance.getClub(orgId);
    const member = club.members.find(m => m.id === memberId);
    if (!member) throw new Error('Member not found');

    const curr = new Date(member.exp > new Date().toISOString() ? member.exp : new Date());
    curr.setMonth(curr.getMonth() + months);
    const oldExp = member.exp;
    member.exp = curr.toISOString().split('T')[0];
    member.status = 'Active';
    member.paid = 1;

    if (newPlan) {
      member.type = newPlan.toLowerCase().includes('premium') ? 'Premium Pro Member' : 'Standard Member';
    }

    const isPremium = (member.type || '').toLowerCase().includes('premium') || (member.type || '').toLowerCase().includes('pro');
    const renewCost = isPremium ? 999 : 499;
    member.history.push({
      date: new Date().toISOString().split('T')[0],
      action: newPlan ? `Upgraded to ${member.type}` : `Renewed Membership (${months} mo)`,
      amt: renewCost
    });

    club.finance.totalIncome += renewCost;
    club.finance.netBalance += renewCost;
    const memSource = club.finance.incomeSources.find(s => s.source === 'Membership Dues');
    if (memSource) memSource.amount += renewCost;

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Renewed Membership', `Member ${member.name} (${member.id}) extended to ${member.exp}`, oldExp, member.exp);
    dbInstance.save();
    return member;
  },

  verifyMember: (currentOrgId, queryId) => {
    let clean = (queryId || '').trim();
    if (!clean) return { status: 'INVALID', message: 'No ID provided' };

    // Sanitize URL query param if URL is passed
    if (clean.includes('?') && (clean.startsWith('http://') || clean.startsWith('https://'))) {
      try {
        const u = new URL(clean);
        const p = u.searchParams.get('verify') || u.searchParams.get('ticket') || u.searchParams.get('code') || u.searchParams.get('id');
        if (p) clean = p.trim();
      } catch (e) {
        const m = clean.match(/[?&](?:verify|ticket|code|id)=([^&#]+)/i);
        if (m && m[1]) clean = decodeURIComponent(m[1]).trim();
      }
    }

    clean = clean
      .replace(/^CLUBSPHERE:(PASS|TICKET|MEMBER|CERT):/i, '')
      .replace(/^CS-APP:\/\/[^/]+\//i, '')
      .replace(/["']/g, '')
      .trim();

    if (clean.startsWith('CSM1.') || clean.startsWith('CSQ1.')) {
      const parts = clean.split('.');
      if (parts[1]) clean = parts[1].trim();
    }
    
    // Check if ID belongs to another club (e.g. TC- vs CC- vs SC-)
    for (const [otherOrgId, otherClub] of Object.entries(dbInstance.data.clubs)) {
      if (otherOrgId !== currentOrgId) {
        const otherMember = (otherClub.members || []).find(m => m.id.toLowerCase() === clean.toLowerCase() || m.email.toLowerCase() === clean.toLowerCase());
        if (otherMember) {
          return {
            status: 'WRONG_CLUB',
            message: `Cross-tenant ID: Member belongs to ${otherClub.name}, NOT ${dbInstance.data.clubs[currentOrgId]?.name || 'Current Club'}!`,
            member: otherMember,
            clubName: otherClub.name
          };
        }
      }
    }

    const club = dbInstance.getClub(currentOrgId);
    const member = (club.members || []).find(m => m.id.toLowerCase() === clean.toLowerCase() || m.email.toLowerCase() === clean.toLowerCase() || m.studentId?.toLowerCase() === clean.toLowerCase());

    if (!member) {
      return { status: 'INVALID', message: `ID "${clean}" not found in current club registry.` };
    }

    const isExp = new Date(member.exp) < new Date();
    if (isExp || member.paid === 0) {
      return { status: 'EXPIRED', member, message: `Membership Expired on ${member.exp}` };
    }

    return { status: 'ACTIVE', member, message: 'Verified Active Member — Eligible for Benefits & Fast Track Entry!' };
  },

  // --- Events & Ticketing (FR-03 to FR-06) ---
  getEvents: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...club.events];
  },

  getAllEvents: () => {
    const allClubs = Object.values(dbInstance.data.clubs || {});
    const list = [];
    allClubs.forEach(club => {
      (club.events || []).forEach(ev => {
        list.push({
          ...ev,
          clubId: club.id,
          clubName: club.name,
          clubPrefix: club.prefix,
          clubColor: club.color || '#FFE853'
        });
      });
    });
    return list;
  },

  createEvent: (orgId, eventData, session) => {
    const club = dbInstance.getClub(orgId);
    const newEvent = {
      id: `ev-${orgId}-${Date.now().toString(36)}`,
      title: eventData.title,
      category: eventData.category || 'Workshop',
      date: eventData.date,
      time: eventData.time || '10:00 AM',
      location: eventData.location,
      capacity: Number(eventData.capacity) || 100,
      sold: 0,
      memberPrice: Number(eventData.memberPrice) || 0,
      nonMemberPrice: Number(eventData.nonMemberPrice) || 100,
      status: eventData.status || 'Published',
      description: eventData.description,
      deadline: eventData.deadline || `${eventData.date} 23:59`,
      organizer: eventData.organizer || `${club.name} Team`,
      bannerGradient: 'linear-gradient(135deg, #FFD24C 0%, #70E4A8 100%)',
      budget: { venue: 10000, food: 8000, equipment: 5000, prizes: 0, marketing: 2000 },
      tags: eventData.tags || ['Club Event']
    };
    club.events.unshift(newEvent);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Created Event', `Created event "${newEvent.title}"`, 'None', newEvent.id);
    dbInstance.save();
    supabaseSync.syncEvent(orgId, newEvent);
    return newEvent;
  },

  updateEventStatus: (orgId, eventId, status, session) => {
    const club = dbInstance.getClub(orgId);
    const event = club.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    const oldStatus = event.status;
    event.status = status;
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Event Status', `Changed event "${event.title}" status to ${status}`, oldStatus, status);
    dbInstance.save();
    supabaseSync.syncEvent(orgId, event);
    return event;
  },

  publishEvent: (orgId, eventId, session) => {
    return clubService.updateEventStatus(orgId, eventId, 'Published', session);
  },

  updateEvent: (orgId, eventId, updatedData, session) => {
    const club = dbInstance.getClub(orgId);
    const event = club.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    Object.assign(event, updatedData);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Event', `Updated event "${event.title}"`, '', '');
    dbInstance.save();
    supabaseSync.syncEvent(orgId, event);
    return event;
  },

  deleteEvent: (orgId, eventId, session) => {
    const club = dbInstance.getClub(orgId);
    const index = club.events.findIndex(e => e.id === eventId);
    if (index === -1) throw new Error('Event not found');
    const removed = club.events.splice(index, 1)[0];
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Deleted Event', `Deleted event "${removed.title}"`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  buyTicket: (orgId, eventId, attendeeInfo, session, paymentDetails = null) => {
    const club = dbInstance.getClub(orgId);
    const event = club.events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    if (event.sold >= event.capacity) {
      throw new Error('This event is completely SOLD OUT! No more seats available (NFR-05 Reliability Guard).');
    }

    const isMember = Boolean(attendeeInfo.isMember);
    const price = isMember ? event.memberPrice : event.nonMemberPrice;

    event.sold += 1;

    const tktId = `TKT-${club.prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrSignedToken = generateSignedQRToken(tktId, orgId, event.id);

    const newTicket = {
      id: tktId,
      eventId: event.id,
      eventTitle: event.title,
      memberId: attendeeInfo.memberId || null,
      attendeeName: attendeeInfo.name || session?.name || 'Guest Student',
      email: attendeeInfo.email || session?.email || 'student@campus.edu',
      isMember,
      pricePaid: price,
      status: 'Valid',
      checkInTime: null,
      seat: `Pass #${event.sold}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      qrToken: qrSignedToken,
      paymentId: paymentDetails?.paymentId || `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentProvider: paymentDetails?.provider || 'razorpay'
    };

    club.tickets.unshift(newTicket);

    // Update income
    club.finance.totalIncome += price;
    club.finance.netBalance += price;
    const tktSource = club.finance.incomeSources.find(s => s.source === 'Event Tickets');
    if (tktSource) {
      tktSource.amount += price;
      tktSource.count += 1;
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Purchased Ticket', `Ticket ${tktId} for "${event.title}" by ${newTicket.attendeeName} (₹${price}, Razorpay Ref: ${newTicket.paymentId})`, 'Available Seat', `Seat ${event.sold}/${event.capacity}`);
    dbInstance.save();
    supabaseSync.syncTicket(orgId, newTicket);
    supabaseSync.syncEvent(orgId, event);
    clubService.syncToBackend('TICKET_PURCHASED', orgId, { ticket: newTicket, eventId: event.id });

    // Trigger transactional confirmation email (Phase 5)
    sendTicketConfirmationEmail({
      recipientEmail: newTicket.email,
      attendeeName: newTicket.attendeeName,
      eventTitle: event.title,
      ticketId: newTicket.id,
      seat: newTicket.seat,
      price
    }).catch(console.error);

    // Dispatch in-app notification
    notificationService.addNotification({
      orgId,
      type: 'ticket',
      title: `🎟️ Pass Confirmed: ${event.title}`,
      body: `Ticket #${newTicket.id} booked successfully for ${newTicket.attendeeName}. Verified payment ₹${price}.`
    });

    return newTicket;
  },

  cancelTicket: (orgId, ticketId, session) => {
    const club = dbInstance.getClub(orgId);
    const ticket = club.tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');
    if (ticket.status === 'Attended') throw new Error('Cannot cancel a ticket that has already been scanned & attended!');

    ticket.status = 'Refunded';
    const event = club.events.find(e => e.id === ticket.eventId);
    if (event && event.sold > 0) {
      event.sold -= 1;
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Cancelled Ticket', `Refund processed for ${ticket.id}`, 'Valid', 'Refunded');
    dbInstance.save();
    return ticket;
  },

  getTickets: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...(club.tickets || [])];
  },

  validateAndCheckInTicket: (orgId, queryTicketId, session, targetEventId = null) => {
    let cleanId = (queryTicketId || '').trim();
    if (!cleanId) return { status: 'INVALID', message: 'No ticket barcode or ID provided.' };

    // Strip leading / trailing quotes or whitespace
    cleanId = cleanId.replace(/["']/g, '').trim();

    // If payload is a URL (e.g. https://clubsphere-campus-os.vercel.app/?verify=TKT-TC-9801)
    if (cleanId.includes('?') && (cleanId.startsWith('http://') || cleanId.startsWith('https://'))) {
      try {
        const u = new URL(cleanId);
        const p = u.searchParams.get('verify') || u.searchParams.get('ticket') || u.searchParams.get('code') || u.searchParams.get('id');
        if (p) cleanId = p.trim();
      } catch (e) {
        const m = cleanId.match(/[?&](?:verify|ticket|code|id)=([^&#]+)/i);
        if (m && m[1]) cleanId = decodeURIComponent(m[1]).trim();
      }
    }

    cleanId = cleanId
      .replace(/^CLUBSPHERE:(PASS|TICKET|MEMBER|CERT):/i, '')
      .replace(/^CS-APP:\/\/[^/]+\//i, '')
      .trim();

    // Check if it's a signed token format (e.g. CSQ1.TKT-TC-9801... or CSM1.TC.TC-001...)
    if (cleanId.startsWith('CSQ1.') || cleanId.startsWith('CSM1.')) {
      const parts = cleanId.split('.');
      if (parts.length >= 2 && parts[1]) {
        cleanId = parts[1]; // Extract core ticket ID or member ID
      }
    }

    const upperId = cleanId.toUpperCase();
    const club = dbInstance.getClub(orgId);
    if (!club.tickets) club.tickets = [];
    if (!club.members) club.members = [];

    // 1. Cross-Tenant Isolation Check: Does this ticket belong to another club?
    for (const [otherOrgId, otherClub] of Object.entries(dbInstance.data.clubs)) {
      if (otherOrgId !== orgId) {
        const otherTicket = (otherClub.tickets || []).find(
          t => t.id.toUpperCase() === upperId || (t.qrToken && t.qrToken.toUpperCase() === upperId)
        );
        if (otherTicket) {
          return {
            status: 'WRONG_CLUB',
            message: `Cross-tenant Rejection: Ticket belongs to ${otherClub.name}, NOT ${club.name}!`,
            ticket: otherTicket,
            clubName: otherClub.name
          };
        }
      }
    }

    // 2. Direct Ticket Search in Current Club (By Ticket ID or Signed Token)
    let ticket = club.tickets.find(
      t => t.id.toUpperCase() === upperId || (t.qrToken && t.qrToken.toUpperCase() === upperId)
    );

    // 3. Member ID / Student ID / Email Lookup:
    // If attendee scanned their Member Pass QR or gave Student Roll # / Email
    if (!ticket) {
      const member = club.members.find(
        m => m.id.toUpperCase() === upperId ||
             m.studentId?.toUpperCase() === upperId ||
             m.email.toLowerCase() === cleanId.toLowerCase()
      );

      if (member) {
        // Look for tickets booked by this member (prefer targetEventId if provided)
        const memberTickets = club.tickets.filter(
          t => (t.memberId && t.memberId.toUpperCase() === member.id.toUpperCase()) ||
               (t.email && t.email.toLowerCase() === member.email.toLowerCase()) ||
               (t.studentId && t.studentId.toUpperCase() === (member.studentId || '').toUpperCase())
        );

        if (memberTickets.length > 0) {
          if (targetEventId) {
            ticket = memberTickets.find(t => t.eventId === targetEventId) || memberTickets[0];
          } else {
            // Pick valid ticket or most recent
            ticket = memberTickets.find(t => t.status === 'Valid') || memberTickets[0];
          }
        } else {
          return {
            status: 'NOT_REGISTERED',
            member,
            message: `Active Member ${member.name} (${member.id}) found, but has not booked a ticket for this event.`,
            canQuickAdmit: true
          };
        }
      }
    }

    if (!ticket) {
      return { status: 'INVALID', message: `No ticket or registered attendee found for "${cleanId}".` };
    }

    // 4. Duplicate Check-in Prevention (Anti-Passback)
    if (ticket.status === 'Attended') {
      return {
        status: 'ALREADY_USED',
        ticket,
        message: `⚠️ DUPLICATE ENTRY BLOCKED! This ticket was already checked in at ${ticket.checkInTime || 'Earlier Today'}.`
      };
    }

    if (ticket.status === 'Refunded') {
      return {
        status: 'REFUNDED',
        ticket,
        message: `⛔ Ticket was cancelled/refunded. Entry denied.`
      };
    }

    // 5. Mark as Attended & Record Timestamp
    const checkInTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', Today';
    ticket.status = 'Attended';
    ticket.checkInTime = checkInTimestamp;

    // Increment member's club attendance count
    const associatedMember = club.members.find(
      m => (ticket.memberId && m.id === ticket.memberId) ||
           (m.email && m.email.toLowerCase() === ticket.email?.toLowerCase()) ||
           (m.studentId && m.studentId === ticket.studentId)
    );
    if (associatedMember) {
      associatedMember.attendanceCount = (associatedMember.attendanceCount || 0) + 1;
    }

    // Update event attended counter
    const event = (club.events || []).find(e => e.id === ticket.eventId);
    if (event) {
      event.attended = (event.attended || 0) + 1;
    }

    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Event Check-in Confirmed',
      `Checked in ${ticket.attendeeName} (${ticket.id}) for "${ticket.eventTitle || 'Event'}" at ${checkInTimestamp}`,
      'Valid',
      'Attended'
    );
    dbInstance.save();
    clubService.syncToBackend('TICKET_CHECKIN', orgId, { ticketId: ticket.id, attendeeName: ticket.attendeeName, checkInTime: checkInTimestamp });
    apiClient.post('/checkin', { ticketId: ticket.id, orgId }).catch(() => {});

    return {
      status: 'ATTENDED_SUCCESS',
      ticket,
      member: associatedMember,
      message: `✅ ENTRY APPROVED! Welcome, ${ticket.attendeeName} (${ticket.seat})!`
    };
  },

  quickAdmitMember: (orgId, eventId, memberIdOrQuery, session) => {
    const club = dbInstance.getClub(orgId);
    const event = (club.events || []).find(e => e.id === eventId) || club.events[0];
    if (!event) throw new Error('No event selected for admission');

    const cleanId = (memberIdOrQuery || '').trim().toUpperCase();
    const member = club.members.find(
      m => m.id.toUpperCase() === cleanId ||
           m.studentId?.toUpperCase() === cleanId ||
           m.email.toLowerCase() === memberIdOrQuery.toLowerCase()
    );

    if (!member) throw new Error('Member record not found');

    event.sold = (event.sold || 0) + 1;
    const tktId = `TKT-${club.prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const checkInTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', Today';

    const newTicket = {
      id: tktId,
      eventId: event.id,
      eventTitle: event.title,
      memberId: member.id,
      attendeeName: member.name,
      email: member.email,
      studentId: member.studentId,
      isMember: true,
      pricePaid: event.memberPrice || 0,
      status: 'Attended',
      checkInTime: checkInTimestamp,
      seat: `Walk-in Pass #${event.sold}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      qrToken: `CSQ1.${tktId}.${orgId}.${Date.now().toString(16)}`,
      paymentId: 'GATE-DESK-ADMIT',
      paymentProvider: 'door-pass'
    };

    if (!club.tickets) club.tickets = [];
    club.tickets.unshift(newTicket);
    member.attendanceCount = (member.attendanceCount || 0) + 1;
    event.attended = (event.attended || 0) + 1;

    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Gate Quick Admission',
      `Walk-in admission issued for Member ${member.name} (${member.id}) to "${event.title}"`,
      'New Walk-in',
      'Attended'
    );
    dbInstance.save();

    return {
      status: 'ATTENDED_SUCCESS',
      ticket: newTicket,
      member,
      message: `⚡ QUICK ADMIT CONFIRMED! Member ${member.name} admitted successfully.`
    };
  },

  lookupPublicPass: (queryId) => {
    if (!queryId) return null;
    let clean = String(queryId).trim().replace(/["']/g, '');
    if (clean.includes('?') && (clean.startsWith('http://') || clean.startsWith('https://'))) {
      try {
        const u = new URL(clean);
        clean = u.searchParams.get('verify') || u.searchParams.get('ticket') || u.searchParams.get('code') || u.searchParams.get('id') || clean;
      } catch (e) {}
    }
    clean = clean
      .replace(/^CLUBSPHERE:(PASS|TICKET|MEMBER|CERT):/i, '')
      .replace(/^CS-APP:\/\/[^/]+\//i, '')
      .trim();

    if (clean.startsWith('CSQ1.') || clean.startsWith('CSM1.')) {
      const parts = clean.split('.');
      if (parts[1]) clean = parts[1].trim();
    }
    const upper = clean.toUpperCase();

    const clubs = dbInstance.data?.clubs || {};
    for (const [orgId, club] of Object.entries(clubs)) {
      // 1. Ticket check
      const ticket = (club.tickets || []).find(
        t => t.id?.toUpperCase() === upper || (t.qrToken && t.qrToken.toUpperCase() === upper)
      );
      if (ticket) {
        return {
          type: 'TICKET',
          club,
          ticket,
          title: ticket.eventTitle,
          name: ticket.attendeeName,
          status: ticket.status,
          code: ticket.id,
          seat: ticket.seat,
          email: ticket.email
        };
      }

      // 2. Member check
      const member = (club.members || []).find(
        m => m.id?.toUpperCase() === upper || m.studentId?.toUpperCase() === upper || m.email?.toLowerCase() === clean.toLowerCase()
      );
      if (member) {
        return {
          type: 'MEMBER',
          club,
          member,
          title: `${club.name} Official Member Card`,
          name: member.name,
          status: member.status,
          code: member.id,
          role: member.role,
          studentId: member.studentId
        };
      }

      // 3. Certificate check
      const cert = (club.certificates || []).find(
        c => c.id?.toUpperCase() === upper || c.qrCode?.toUpperCase() === upper
      );
      if (cert) {
        return {
          type: 'CERT',
          club,
          cert,
          title: cert.title,
          name: cert.recipientName,
          status: 'VERIFIED',
          code: cert.qrCode || cert.id,
          issueDate: cert.issueDate
        };
      }
    }

    return {
      type: 'UNKNOWN',
      code: clean,
      status: 'NOT_FOUND',
      message: `No active pass or member found for ID "${clean}".`
    };
  },


  // --- Merchandise & Inventory (FR-09 to FR-11) ---
  getMerchandise: (orgId) => {
    const club = dbInstance.getClub(orgId);
    if (!club.merchandise) club.merchandise = [];
    return [...club.merchandise];
  },

  addMerchandise: (orgId, merchData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.merchandise) club.merchandise = [];

    const newId = `merch-${club.id}-${Date.now().toString(36)}`;
    const newMerch = {
      id: newId,
      name: merchData.name,
      category: merchData.category || 'Apparel',
      description: merchData.description || '',
      memberPrice: Number(merchData.memberPrice) || 0,
      nonMemberPrice: Number(merchData.nonMemberPrice) || 0,
      cost: Number(merchData.cost) || 0,
      stock: merchData.stock && Object.keys(merchData.stock).length > 0 ? merchData.stock : { Standard: 20 },
      image: merchData.image || '👕',
      totalSold: 0,
      status: 'In Stock'
    };

    club.merchandise.unshift(newMerch);
    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Added Merchandise Product',
      `Added "${newMerch.name}" (${newMerch.category}) - Member: ₹${newMerch.memberPrice}, Retail: ₹${newMerch.nonMemberPrice}`,
      'None',
      newMerch.id
    );
    dbInstance.save();
    clubService.syncToBackend('CREATE_MERCH', orgId, newMerch);
    supabaseSync.syncProduct(orgId, newMerch);
    return newMerch;
  },

  updateMerchandise: (orgId, productId, merchData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.merchandise) club.merchandise = [];
    const idx = club.merchandise.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error('Product not found');

    const oldProduct = club.merchandise[idx];
    const updated = {
      ...oldProduct,
      ...merchData,
      memberPrice: Number(merchData.memberPrice !== undefined ? merchData.memberPrice : oldProduct.memberPrice),
      nonMemberPrice: Number(merchData.nonMemberPrice !== undefined ? merchData.nonMemberPrice : oldProduct.nonMemberPrice),
      cost: Number(merchData.cost !== undefined ? merchData.cost : oldProduct.cost),
      stock: merchData.stock !== undefined ? merchData.stock : oldProduct.stock
    };

    club.merchandise[idx] = updated;
    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Updated Merchandise Product',
      `Updated "${updated.name}" details/pricing`,
      oldProduct.name,
      updated.name
    );
    dbInstance.save();
    supabaseSync.syncProduct(orgId, updated);
    return updated;
  },

  deleteMerchandise: (orgId, productId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.merchandise) club.merchandise = [];
    const idx = club.merchandise.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error('Product not found');

    const removed = club.merchandise.splice(idx, 1)[0];
    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Deleted Merchandise Product',
      `Removed "${removed.name}" from club catalog`,
      removed.id,
      ''
    );
    dbInstance.save();
    supabaseSync.deleteProduct(orgId, productId);
    return removed;
  },

  addMerchStock: (orgId, productId, size, qtyDelta, session) => {
    const club = dbInstance.getClub(orgId);
    const product = club.merchandise.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');

    const current = product.stock[size] || 0;
    const next = current + Number(qtyDelta);
    if (next < 0) throw new Error('Stock cannot become negative (NFR-05 Guard)');
    
    product.stock[size] = next;
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Inventory Stock', `${product.name} (Size ${size}) adjusted by ${qtyDelta > 0 ? '+' : ''}${qtyDelta}`, `${current}`, `${next}`);
    dbInstance.save();
    return product;
  },

  orderMerchandise: (orgId, orderPayload, session, paymentDetails) => {
    const club = dbInstance.getClub(orgId);
    if (!club.merchandise) club.merchandise = [];
    if (!club.orders) club.orders = [];

    const product = club.merchandise.find(p => p.id === orderPayload.productId);
    if (!product) throw new Error('Product not found');

    const currentStock = product.stock[orderPayload.size] || 0;
    const reqQty = Number(orderPayload.qty) || 1;

    if (currentStock < reqQty) {
      throw new Error(`Insufficient stock! Only ${currentStock} units left for size ${orderPayload.size}.`);
    }

    // Deduct stock
    product.stock[orderPayload.size] -= reqQty;
    product.totalSold = (product.totalSold || 0) + reqQty;

    const ordId = `ORD-${club.prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const paymentId = paymentDetails?.paymentId || orderPayload.paymentId || `pay_rzp_${Math.random().toString(36).substring(2, 9)}`;
    const paymentProvider = paymentDetails?.provider || orderPayload.paymentProvider || 'razorpay';
    const razorpayOrderId = paymentDetails?.orderId || orderPayload.razorpayOrderId || `order_rzp_${Math.random().toString(36).substring(2, 9)}`;

    const newOrder = {
      id: ordId,
      memberId: orderPayload.memberId || null,
      customerName: orderPayload.customerName || session?.name || 'Student Member',
      email: orderPayload.email || session?.email || 'student@campus.edu',
      items: [{ productId: product.id, name: product.name, size: orderPayload.size, qty: reqQty, price: orderPayload.unitPrice }],
      totalAmt: orderPayload.totalAmt,
      status: 'Paid',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: orderPayload.paymentMethod || 'Razorpay',
      paymentId,
      razorpayOrderId,
      paymentProvider,
      paidAt: new Date().toISOString()
    };

    club.orders.unshift(newOrder);

    // Update income
    if (!club.finance) {
      club.finance = { totalIncome: 0, totalExpenses: 0, netBalance: 0, incomeSources: [] };
    }
    club.finance.totalIncome = (club.finance.totalIncome || 0) + orderPayload.totalAmt;
    club.finance.netBalance = (club.finance.netBalance || 0) + orderPayload.totalAmt;
    if (!club.finance.incomeSources) club.finance.incomeSources = [];

    let merchSource = club.finance.incomeSources.find(s => s.source === 'Merchandise Sales');
    if (merchSource) {
      merchSource.amount += orderPayload.totalAmt;
      merchSource.count = (merchSource.count || 0) + reqQty;
    } else {
      club.finance.incomeSources.push({
        source: 'Merchandise Sales',
        amount: orderPayload.totalAmt,
        count: reqQty
      });
    }

    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Placed Merch Order',
      `Order ${ordId} for ${product.name} (${orderPayload.size} x ${reqQty}) = ₹${orderPayload.totalAmt} (Razorpay Ref: ${paymentId})`,
      'Stock Reserved',
      'Paid via Razorpay'
    );
    dbInstance.save();
    clubService.syncToBackend('MERCH_ORDER', orgId, newOrder);
    return newOrder;
  },

  advanceOrderStatus: (orgId, orderId, nextStatus, session) => {
    const club = dbInstance.getClub(orgId);
    const order = club.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const old = order.status;
    order.status = nextStatus;
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Order Status', `Order ${order.id} status changed to ${nextStatus}`, old, nextStatus);
    dbInstance.save();
    return order;
  },

  // --- Tasks & Volunteers (FR-12 to FR-14) ---
  getTasks: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...(club.tasks || [])];
  },

  getEventTasks: (orgId, eventId) => {
    const club = dbInstance.getClub(orgId);
    return (club.tasks || []).filter(t => t.eventId === eventId);
  },

  updateTaskStatus: (orgId, taskId, newStatus, newProgress, session) => {
    const club = dbInstance.getClub(orgId);
    const task = (club.tasks || []).find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const oldStatus = task.status;
    task.status = newStatus;
    if (newProgress !== undefined) task.progress = newProgress;
    if (newStatus === 'Done') task.progress = 100;
    if (newStatus === 'Pending' && (task.progress === undefined || task.progress === 100)) task.progress = 0;

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Task Status', `Task "${task.title}" moved to ${newStatus}`, oldStatus, newStatus);
    dbInstance.save();
    supabaseSync.syncTask(orgId, task);
    return task;
  },

  createTask: (orgId, taskData, session) => {
    if (session?.role === 'volunteer' || session?.role === 'student' || session?.role === 'member') {
      throw new Error('Volunteers are not authorized to create tasks. Tasks must be assigned by an Event Manager or Club Admin.');
    }
    const club = dbInstance.getClub(orgId);
    if (!club.tasks) club.tasks = [];

    let eventName = taskData.eventName || '';
    if (taskData.eventId && !eventName && club.events) {
      const foundEvent = club.events.find(e => e.id === taskData.eventId);
      if (foundEvent) eventName = foundEvent.title;
    }

    const newTask = {
      id: `tsk-${Date.now().toString(36)}`,
      title: taskData.title,
      owner: taskData.owner || taskData.assignedTo || 'Unassigned',
      assignedTo: taskData.assignedTo || taskData.owner || 'Unassigned',
      assignedVolunteerEmail: taskData.assignedVolunteerEmail || '',
      eventId: taskData.eventId || null,
      eventName: eventName || 'General Operations',
      deadline: taskData.deadline || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'Pending',
      progress: taskData.status === 'Done' ? 100 : (Number(taskData.progress) || 0),
      notes: taskData.notes || '',
      assignedBy: session?.name || 'Event Manager',
      createdAt: new Date().toISOString()
    };
    club.tasks.unshift(newTask);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Created Task', `Created task "${newTask.title}" assigned to ${newTask.owner}${newTask.eventName ? ` for event "${newTask.eventName}"` : ''}`, 'None', newTask.id);
    dbInstance.save();
    supabaseSync.syncTask(orgId, newTask);
    return newTask;
  },

  // --- Tasks & Volunteers (FR-12 to FR-14) ---
  getVolunteers: (orgId) => {
    const club = dbInstance.getClub(orgId);
    if (!club.volunteers) club.volunteers = [];

    // Also auto-incorporate any registered user with role 'volunteer' for this club if not present
    const clubVolUsers = (dbInstance.data.users || []).filter(
      u => (u.orgId === orgId || u.club_id === orgId) && u.role === 'volunteer'
    );

    clubVolUsers.forEach(u => {
      const exists = club.volunteers.find(
        v => (v.email && (v.email.toLowerCase() === (u.clubEmail || '').toLowerCase() || v.email.toLowerCase() === (u.personalEmail || '').toLowerCase())) ||
             (v.name && v.name.toLowerCase() === (u.name || '').toLowerCase())
      );
      if (!exists) {
        const initialHours = Number(u.service_hours) || 24;
        club.volunteers.push({
          id: `VOL-${club.prefix || 'CLB'}-${Math.floor(100 + Math.random() * 900)}`,
          name: u.name,
          email: u.clubEmail || u.personalEmail,
          phone: u.phone || '+91 98250 11223',
          department: u.department || 'Computer Engineering',
          roleTitle: u.department ? `${u.department} Volunteer` : 'Event Operations Volunteer',
          hours: initialHours,
          service_hours: initialHours,
          badge: initialHours >= 100 ? 'Gold Legend (100h+)' : initialHours >= 50 ? 'Silver Contributor (50h+)' : initialHours >= 25 ? 'Bronze Contributor (25h+)' : 'Bronze Contributor',
          rating: Number(u.rating) || 4.9,
          skills: ['Event Logistics', 'Gate Registration', 'Stage AV'],
          status: 'Active',
          joinedDate: '2026-08-15'
        });
      }
    });

    return [...club.volunteers];
  },

  addVolunteer: (orgId, volData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.volunteers) club.volunteers = [];

    const hours = Number(volData.hours) || 0;
    const newVol = {
      id: `VOL-${club.prefix || 'CLB'}-${Math.floor(100 + Math.random() * 900)}`,
      name: volData.name.trim(),
      email: volData.email.trim(),
      phone: volData.phone ? volData.phone.trim() : '+91 98250 00000',
      department: volData.department || 'Computer Engineering',
      roleTitle: volData.roleTitle || 'Event Operations Volunteer',
      hours: hours,
      service_hours: hours,
      badge: hours >= 100 ? 'Gold Legend (100h+)' : hours >= 50 ? 'Silver Contributor (50h+)' : hours >= 25 ? 'Bronze Contributor (25h+)' : 'Bronze Contributor',
      rating: Number(volData.rating) || 5.0,
      skills: Array.isArray(volData.skills) ? volData.skills : (volData.skills ? volData.skills.split(',').map(s => s.trim()) : ['Event Logistics', 'Operations']),
      status: volData.status || 'Active',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    club.volunteers.unshift(newVol);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Registered Volunteer', `Added volunteer ${newVol.name} (${newVol.email}) to roster`, 'None', newVol.id);
    dbInstance.save();
    supabaseSync.syncVolunteer(orgId, newVol);
    return newVol;
  },

  updateVolunteer: (orgId, volId, updateData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.volunteers) club.volunteers = [];

    const vol = club.volunteers.find(v => v.id === volId);
    if (!vol) throw new Error('Volunteer not found');

    if (updateData.name) vol.name = updateData.name.trim();
    if (updateData.email) vol.email = updateData.email.trim();
    if (updateData.phone) vol.phone = updateData.phone.trim();
    if (updateData.department) vol.department = updateData.department;
    if (updateData.roleTitle) vol.roleTitle = updateData.roleTitle;
    if (updateData.status) vol.status = updateData.status;
    if (updateData.skills) {
      vol.skills = Array.isArray(updateData.skills) ? updateData.skills : updateData.skills.split(',').map(s => s.trim());
    }
    if (updateData.rating !== undefined) vol.rating = Number(Number(updateData.rating).toFixed(2));
    if (updateData.hours !== undefined) {
      const h = Number(updateData.hours);
      vol.hours = h;
      vol.service_hours = h;
      if (h >= 100) vol.badge = 'Gold Legend (100h+)';
      else if (h >= 50) vol.badge = 'Silver Contributor (50h+)';
      else if (h >= 25) vol.badge = 'Bronze Contributor (25h+)';
      else vol.badge = 'Bronze Contributor';
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Volunteer Profile', `Updated details for volunteer ${vol.name} (${vol.id})`, '', '');
    dbInstance.save();
    supabaseSync.syncVolunteer(orgId, vol);
    return vol;
  },

  getVolunteerForUser: (orgId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.volunteers) club.volunteers = [];

    const userEmail = (session?.email || '').trim().toLowerCase();
    const userName = (session?.name || '').trim().toLowerCase();

    // Find existing volunteer record
    let vol = club.volunteers.find(v => 
      (v.email && v.email.toLowerCase() === userEmail) ||
      (userName && v.name && v.name.toLowerCase() === userName)
    );

    if (!vol) {
      // Look up user in database
      const registeredUser = dbInstance.findUserByClubEmail(userEmail) || dbInstance.findUserByPersonalEmail(userEmail, orgId);
      const initialHours = Number(registeredUser?.service_hours) || 24;
      const initialRating = Number(registeredUser?.rating) || 4.9;

      vol = {
        id: `VOL-${club.prefix}-${Math.floor(100 + Math.random() * 900)}`,
        name: session?.name || registeredUser?.name || 'Club Volunteer',
        email: session?.email || registeredUser?.clubEmail || registeredUser?.personalEmail || 'volunteer@campus.edu',
        phone: registeredUser?.phone || '+91 98250 11223',
        roleTitle: registeredUser?.department ? `${registeredUser.department} Volunteer` : 'Event Operations Volunteer',
        hours: initialHours,
        service_hours: initialHours,
        badge: initialHours >= 50 ? 'Silver Contributor (50h+)' : initialHours >= 25 ? 'Bronze Contributor (25h+)' : 'Bronze Contributor',
        rating: initialRating,
        skills: ['Event Logistics', 'Gate Registration', 'Stage AV'],
        activeTasks: 1
      };

      club.volunteers.push(vol);
      dbInstance.save();
      supabaseSync.syncVolunteer(orgId, vol);
    }
    return vol;
  },

  logVolunteerHours: (orgId, volIdOrEmail, hoursToAdd, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.volunteers) club.volunteers = [];

    const clean = (volIdOrEmail || '').toString().trim().toLowerCase();
    const vol = club.volunteers.find(v => 
      v.id.toLowerCase() === clean || 
      (v.email && v.email.toLowerCase() === clean) ||
      (session?.email && v.email && v.email.toLowerCase() === session.email.toLowerCase())
    );

    if (!vol) throw new Error('Volunteer profile not found in club database');

    const oldHours = Number(vol.hours || vol.service_hours) || 0;
    const newHours = oldHours + Number(hoursToAdd);
    vol.hours = newHours;
    vol.service_hours = newHours;

    if (vol.hours >= 100) vol.badge = 'Gold Legend (100h+)';
    else if (vol.hours >= 50) vol.badge = 'Silver Contributor (50h+)';
    else if (vol.hours >= 25) vol.badge = 'Bronze Contributor (25h+)';
    else vol.badge = 'Bronze Contributor';

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Logged Volunteer Hours', `Added ${hoursToAdd}h for ${vol.name} (Total: ${vol.hours}h)`, `${oldHours}h`, `${vol.hours}h`);
    dbInstance.save();

    // Live Sync to database
    supabaseSync.syncVolunteer(orgId, vol);

    return vol;
  },

  updateVolunteerRating: (orgId, volIdOrEmail, newRating, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.volunteers) club.volunteers = [];

    const clean = (volIdOrEmail || '').toString().trim().toLowerCase();
    const vol = club.volunteers.find(v => 
      v.id.toLowerCase() === clean || 
      (v.email && v.email.toLowerCase() === clean)
    );

    if (!vol) throw new Error('Volunteer profile not found');

    const oldRating = vol.rating;
    vol.rating = Number(Number(newRating).toFixed(2));

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Volunteer Rating', `Rating for ${vol.name} updated to ${vol.rating}`, `${oldRating}`, `${vol.rating}`);
    dbInstance.save();

    supabaseSync.syncVolunteer(orgId, vol);
    return vol;
  },

  // --- Finance & Reimbursements (FR-15 to FR-18) ---
  getFinanceSummary: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return JSON.parse(JSON.stringify(club.finance));
  },

  updateBudgetAllocation: (orgId, newBudget, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.finance) club.finance = {};
    const oldBudget = Number(club.finance.budgetAllocated) || 50000;
    const nextBudget = Math.max(0, Number(newBudget) || 0);
    club.finance.budgetAllocated = nextBudget;

    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Updated Budget Allocation',
      `Updated semester allocated budget quota from ₹${oldBudget.toLocaleString()} to ₹${nextBudget.toLocaleString()}`,
      `₹${oldBudget}`,
      `₹${nextBudget}`
    );
    dbInstance.save();
    clubService.syncToBackend('UPDATE_BUDGET', orgId, { budgetAllocated: nextBudget });
    return club.finance;
  },

  getReimbursements: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return club.reimbursements || [];
  },

  getUserReimbursements: (orgId, email, name) => {
    const club = dbInstance.getClub(orgId);
    const list = club.reimbursements || [];
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').toLowerCase().trim();

    return list.filter(r => 
      (r.volunteerEmail && cleanEmail && r.volunteerEmail.toLowerCase() === cleanEmail) ||
      (r.volunteerName && cleanName && r.volunteerName.toLowerCase() === cleanName)
    );
  },

  submitReimbursement: (orgId, reimbData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.reimbursements) club.reimbursements = [];

    const newId = `REIMB-${club.prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const newReimb = {
      id: newId,
      volunteerName: reimbData.volunteerName || session?.name || 'Volunteer Member',
      volunteerEmail: reimbData.volunteerEmail || session?.email || 'volunteer@campus.edu',
      category: reimbData.category || 'Supplies & Printing',
      event: reimbData.event || 'General Club Operations',
      amount: Number(reimbData.amount) || 0,
      date: new Date().toISOString().split('T')[0],
      description: reimbData.description || 'Receipt claim',
      receiptUrl: reimbData.receiptUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
      status: 'Submitted',
      approver: null,
      notes: reimbData.notes || 'Submitted via volunteer portal'
    };

    club.reimbursements.unshift(newReimb);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Submitted Reimbursement Claim', `${newReimb.volunteerName} claimed ₹${newReimb.amount} for "${newReimb.description}"`, 'None', newId);
    dbInstance.save();

    // Live Sync to database
    supabaseSync.syncReimbursement(orgId, newReimb);

    return newReimb;
  },

  advanceReimbursementStatus: (orgId, reimbId, newStatus, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.reimbursements) club.reimbursements = [];

    const reimb = club.reimbursements.find(r => r.id === reimbId);
    if (!reimb) throw new Error('Reimbursement not found');

    const oldStatus = reimb.status;
    reimb.status = newStatus;
    reimb.approver = session?.name || session?.email || 'Treasurer';

    // When status reaches "Reimbursed", automatically create an expense row in the ledger (FR-17)
    if (newStatus === 'Reimbursed') {
      const expId = `EXP-${club.prefix}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      const newExp = {
        id: expId,
        title: `Reimbursement: ${reimb.volunteerName} (${reimb.category})`,
        category: 'Reimbursement',
        amount: reimb.amount,
        date: new Date().toISOString().split('T')[0],
        approvedBy: session?.name || 'Treasurer Tech',
        receipt: reimb.id
      };
      club.finance.expensesList.unshift(newExp);
      club.finance.totalExpenses += reimb.amount;
      club.finance.netBalance -= reimb.amount;
      supabaseSync.syncFinancialTxn(orgId, newExp);
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Reimbursement Status', `Reimbursement ${reimb.id} changed to ${newStatus}`, oldStatus, newStatus);
    dbInstance.save();
    return reimb;
  },

  addExpense: (orgId, expenseData, session) => {
    const club = dbInstance.getClub(orgId);
    const expId = `EXP-${club.prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const newExp = {
      id: expId,
      title: expenseData.title,
      category: expenseData.category || 'Operational',
      amount: Number(expenseData.amount) || 0,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      approvedBy: session?.name || 'Treasurer',
      receipt: expenseData.receipt || `BILL-${Math.floor(1000 + Math.random() * 9000)}`
    };

    club.finance.expensesList.unshift(newExp);
    club.finance.totalExpenses += newExp.amount;
    club.finance.netBalance -= newExp.amount;

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Recorded Expense', `Expense "${newExp.title}" (₹${newExp.amount}) recorded in ledger`, 'None', expId);
    dbInstance.save();
    supabaseSync.syncFinancialTxn(orgId, newExp);
    return newExp;
  },

  // --- Announcements & Communication (FR-07, FR-08) ---
  getAnnouncements: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...club.announcements];
  },

  publishAnnouncement: (orgId, annData, session) => {
    const club = dbInstance.getClub(orgId);
    const newAnn = {
      id: `ann-${Date.now().toString(36)}`,
      title: annData.title,
      date: new Date().toISOString().split('T')[0],
      audience: annData.audience || 'All Members',
      channels: annData.channels || ['In-app', 'Email'],
      status: annData.status || 'Published',
      author: session?.name || `${club.name} Admin`,
      content: annData.content,
      reach: club.members.length * (annData.audience.includes('All') ? 3 : 1)
    };

    club.announcements.unshift(newAnn);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Broadcast Announcement', `Published "${newAnn.title}" to ${newAnn.audience}`, 'Draft', 'Published');
    dbInstance.save();

    // Resend Email Broadcast if Email channel selected (Phase 5)
    if (newAnn.channels.includes('Email')) {
      const recipientEmails = club.members.map(m => m.email).filter(Boolean);
      sendEmail({
        to: recipientEmails.length > 0 ? recipientEmails[0] : 'members@campus.edu',
        subject: `📢 [${club.name}] ${newAnn.title}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #FDF8F0;">
            <h2 style="color: #121212;">${newAnn.title}</h2>
            <p style="font-size: 14px; color: #555;">Audience: <strong>${newAnn.audience}</strong> • Posted by: ${newAnn.author}</p>
            <div style="background: white; border: 2px solid black; padding: 16px; border-radius: 8px; margin: 16px 0;">
              ${newAnn.content}
            </div>
            <p style="font-size: 12px; color: #777;">Sent via ClubSphere Communication Broadcast Hub.</p>
          </div>
        `
      }).catch(console.error);
    }

    // In-App Notification Fan-out
    notificationService.addNotification({
      orgId,
      type: 'announcement',
      title: `📢 ${newAnn.title}`,
      body: newAnn.content.length > 90 ? newAnn.content.slice(0, 90) + '...' : newAnn.content
    });

    return newAnn;
  },

  // --- Sponsors & Donations (J, K) ---
  getSponsors: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...(club.sponsors || [])];
  },

  addSponsor: (orgId, sponsorData, session) => {
    const club = dbInstance.getClub(orgId);
    const newSp = {
      id: `sp-${Date.now().toString(36)}`,
      company: sponsorData.company,
      tier: sponsorData.tier || 'Gold Sponsor',
      amount: Number(sponsorData.amount) || 25000,
      contact: sponsorData.contact,
      status: 'Confirmed',
      perks: sponsorData.perks || ['Logo on Website', 'Booth at Event'],
      contractSigned: true
    };
    if (!club.sponsors) club.sponsors = [];
    club.sponsors.unshift(newSp);

    // Update income
    club.finance.totalIncome += newSp.amount;
    club.finance.netBalance += newSp.amount;

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Added Sponsor', `Sponsorship of ₹${newSp.amount} from ${newSp.company} confirmed`, 'None', newSp.id);
    dbInstance.save();
    return newSp;
  },

  getDonations: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...(club.donations || [])];
  },

  createDonation: (orgId, donData, session) => {
    const club = dbInstance.getClub(orgId);
    const newDon = {
      id: `don-${Date.now().toString(36)}`,
      donorName: donData.anonymous ? 'Anonymous Supporter' : donData.donorName || 'Alumni Contributor',
      amount: Number(donData.amount) || 1000,
      date: donData.date || new Date().toISOString().split('T')[0],
      campaign: donData.campaign || 'General Club Development Fund',
      campaignId: donData.campaignId || null,
      email: donData.email || '',
      pan: donData.pan || '',
      paymentMethod: donData.paymentMethod || 'UPI',
      anonymous: Boolean(donData.anonymous),
      receiptNo: `DON-REC-${Math.floor(1000 + Math.random() * 9000)}`
    };

    if (!club.donations) club.donations = [];
    club.donations.unshift(newDon);

    // Update campaign progress if attached to a fundraiser
    if (club.fundraisers) {
      const fund = club.fundraisers.find(f => f.id === donData.campaignId || f.title === donData.campaign);
      if (fund) {
        fund.raised = (Number(fund.raised) || 0) + newDon.amount;
        fund.donorCount = (Number(fund.donorCount) || 0) + 1;
      }
    }

    club.finance.totalIncome += newDon.amount;
    club.finance.netBalance += newDon.amount;

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Received Donation', `Donation of ₹${newDon.amount} received from ${newDon.donorName}`, 'None', newDon.receiptNo);
    dbInstance.save();
    return newDon;
  },

  deleteDonation: (orgId, donId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.donations) club.donations = [];
    const idx = club.donations.findIndex(d => d.id === donId);
    if (idx === -1) throw new Error('Donation not found');

    const removed = club.donations.splice(idx, 1)[0];
    club.finance.totalIncome = Math.max(0, (club.finance.totalIncome || 0) - removed.amount);
    club.finance.netBalance = (club.finance.netBalance || 0) - removed.amount;

    if (club.fundraisers && removed.campaign) {
      const fund = club.fundraisers.find(f => f.id === removed.campaignId || f.title === removed.campaign);
      if (fund) {
        fund.raised = Math.max(0, (fund.raised || 0) - removed.amount);
        fund.donorCount = Math.max(0, (fund.donorCount || 0) - 1);
      }
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Removed Donation', `Deleted donation entry ${removed.receiptNo} of ₹${removed.amount}`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  // --- Fundraisers & Campaigns ---
  getFundraisers: (orgId) => {
    const club = dbInstance.getClub(orgId);
    if (!club.fundraisers) club.fundraisers = [];
    return [...club.fundraisers];
  },

  createFundraiser: (orgId, fundData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.fundraisers) club.fundraisers = [];

    const newFund = {
      id: `fund-${club.id}-${Date.now().toString(36)}`,
      title: fundData.title,
      description: fundData.description || '',
      target: Number(fundData.target || fundData.goal) || 10000,
      goal: Number(fundData.target || fundData.goal) || 10000,
      raised: 0,
      donorCount: 0,
      organizer: fundData.organizer || session?.name || 'Club Executive Team',
      startDate: fundData.startDate || new Date().toISOString().split('T')[0],
      endDate: fundData.endDate || fundData.deadline || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      deadline: fundData.endDate || fundData.deadline || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      assignedVolunteers: fundData.assignedVolunteers || [],
      status: 'Active',
      category: fundData.category || 'General Drive'
    };

    club.fundraisers.unshift(newFund);
    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Launched Fundraiser Campaign',
      `Launched "${newFund.title}" with target goal ₹${newFund.target}`,
      'None',
      newFund.id
    );
    dbInstance.save();
    clubService.syncToBackend('CREATE_FUNDRAISER', orgId, newFund);
    return newFund;
  },

  deleteFundraiser: (orgId, fundId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.fundraisers) club.fundraisers = [];
    const idx = club.fundraisers.findIndex(f => f.id === fundId);
    if (idx === -1) throw new Error('Fundraiser not found');

    const removed = club.fundraisers.splice(idx, 1)[0];
    dbInstance.logAudit(
      orgId,
      session?.email,
      session?.role,
      'Deleted Fundraiser Campaign',
      `Removed campaign "${removed.title}"`,
      removed.id,
      ''
    );
    dbInstance.save();
    return removed;
  },

  // --- Corporate Sponsors & Partnerships (FR-15, Item J) ---
  getSponsors: (orgId) => {
    const club = dbInstance.getClub(orgId);
    if (!club.sponsors) club.sponsors = [];
    return [...club.sponsors];
  },

  addSponsor: (orgId, spData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.sponsors) club.sponsors = [];

    const newSponsor = {
      id: `sp-${club.id}-${Date.now().toString(36)}`,
      name: spData.company || spData.name,
      company: spData.company || spData.name,
      tier: spData.tier || 'Gold Sponsor',
      amount: Number(spData.amount) || 0,
      contact: spData.contact || 'partnerships@company.com',
      status: spData.status || 'Confirmed',
      contractSigned: spData.contractSigned ?? true,
      perks: spData.perks || ['Logo on banners', 'Keynote address slot', 'Booth in arena']
    };

    club.sponsors.unshift(newSponsor);

    if (newSponsor.amount > 0) {
      if (!club.finance) club.finance = { totalIncome: 0, totalExpenses: 0, netBalance: 0, incomeSources: [], expensesList: [] };
      club.finance.totalIncome = (club.finance.totalIncome || 0) + newSponsor.amount;
      club.finance.netBalance = (club.finance.netBalance || 0) + newSponsor.amount;
      if (!club.finance.incomeSources) club.finance.incomeSources = [];
      const spSrc = club.finance.incomeSources.find(s => s.source.toLowerCase().includes('sponsor'));
      if (spSrc) {
        spSrc.amount += newSponsor.amount;
        spSrc.count += 1;
      } else {
        club.finance.incomeSources.push({ source: 'Corporate Sponsorships', amount: newSponsor.amount, count: 1 });
      }
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Added Sponsor Agreement', `Confirmed ${newSponsor.tier} with ${newSponsor.company} (₹${newSponsor.amount})`, 'None', newSponsor.id);
    dbInstance.save();
    return newSponsor;
  },

  deleteSponsor: (orgId, sponsorId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.sponsors) club.sponsors = [];
    const idx = club.sponsors.findIndex(s => s.id === sponsorId);
    if (idx === -1) throw new Error('Sponsor not found');

    const removed = club.sponsors.splice(idx, 1)[0];
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Deleted Sponsor Agreement', `Removed sponsor ${removed.company || removed.name}`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  // --- Procurement & Purchase Orders (Item O) ---
  getPurchaseOrders: (orgId) => {
    const club = dbInstance.getClub(orgId);
    if (!club.purchaseOrders) club.purchaseOrders = [];
    return [...club.purchaseOrders];
  },

  createPurchaseOrder: (orgId, poData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.purchaseOrders) club.purchaseOrders = [];

    const newPO = {
      id: poData.code || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      vendor: poData.vendor || 'Campus Merchandise Vendor',
      itemTitle: poData.itemTitle,
      productId: poData.productId || null,
      size: poData.size || 'M',
      quantity: Number(poData.quantity) || 1,
      unitCost: Number(poData.unitCost) || 0,
      totalCost: (Number(poData.quantity) || 1) * (Number(poData.unitCost) || 0),
      orderDate: poData.orderDate || new Date().toISOString().split('T')[0],
      destination: poData.destination || 'Campus Activity Office',
      status: poData.status || 'Pending Delivery',
      notes: poData.notes || ''
    };

    club.purchaseOrders.unshift(newPO);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Created Purchase Order', `Raised PO ${newPO.id} for ${newPO.quantity}x ${newPO.itemTitle} from ${newPO.vendor}`, 'Draft', newPO.id);
    dbInstance.save();
    return newPO;
  },

  updatePurchaseOrderStatus: (orgId, poId, newStatus, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.purchaseOrders) club.purchaseOrders = [];
    const po = club.purchaseOrders.find(p => p.id === poId);
    if (!po) throw new Error('Purchase order not found');

    const oldStatus = po.status;
    po.status = newStatus;

    if (newStatus === 'Received & Added to Stock' && oldStatus !== 'Received & Added to Stock' && po.productId) {
      const prod = (club.merchandise || []).find(m => m.id === po.productId);
      if (prod) {
        if (typeof prod.stock === 'number') {
          prod.stock += po.quantity;
        } else if (typeof prod.stock === 'object' && prod.stock !== null) {
          const sKey = po.size || Object.keys(prod.stock)[0];
          prod.stock[sKey] = (Number(prod.stock[sKey]) || 0) + po.quantity;
        }
      }
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Purchase Order Status', `PO ${po.id} status changed to ${newStatus}`, oldStatus, newStatus);
    dbInstance.save();
    return po;
  },

  deletePurchaseOrder: (orgId, poId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.purchaseOrders) club.purchaseOrders = [];
    const idx = club.purchaseOrders.findIndex(p => p.id === poId);
    if (idx === -1) throw new Error('Purchase order not found');

    const removed = club.purchaseOrders.splice(idx, 1)[0];
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Deleted Purchase Order', `Removed ${removed.id}`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  // --- Certificates & Feedback (L, M) ---
  getCertificates: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...(club.certificates || [])];
  },

  generateCertificate: (orgId, certData, session) => {
    const club = dbInstance.getClub(orgId);
    const newCert = {
      id: `CERT-${club.prefix}-2026-${Math.floor(100 + Math.random() * 900)}`,
      studentName: certData.studentName,
      studentId: certData.studentId || '23CS001',
      eventName: certData.eventName,
      issueDate: new Date().toISOString().split('T')[0],
      qrCode: `CERT-${club.prefix}-VERIFIED-${Math.random().toString(36).slice(-6).toUpperCase()}`,
      type: certData.type || 'Certificate of Completion'
    };

    if (!club.certificates) club.certificates = [];
    club.certificates.unshift(newCert);

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Generated Certificate', `Issued ${newCert.type} to ${newCert.studentName} for "${newCert.eventName}"`, 'None', newCert.id);
    dbInstance.save();
    return newCert;
  },

  deleteCertificate: (orgId, certId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.certificates) club.certificates = [];
    const idx = club.certificates.findIndex(c => c.id === certId);
    if (idx === -1) throw new Error('Certificate not found');

    const removed = club.certificates.splice(idx, 1)[0];
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Revoked Certificate', `Revoked ${removed.id} for ${removed.studentName}`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  // --- Dynamic Ledger Inflow & Outflow (FR-15, FR-16) ---
  recordIncome: (orgId, incomeData, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.finance) club.finance = { totalIncome: 0, totalExpenses: 0, netBalance: 0, incomeSources: [], expensesList: [] };
    if (!club.finance.incomeSources) club.finance.incomeSources = [];

    const amount = Number(incomeData.amount) || 0;
    const sourceTitle = incomeData.source || 'Direct Revenue';
    club.finance.totalIncome = (club.finance.totalIncome || 0) + amount;
    club.finance.netBalance = (club.finance.netBalance || 0) + amount;

    const existing = club.finance.incomeSources.find(s => s.source.toLowerCase() === sourceTitle.toLowerCase());
    if (existing) {
      existing.amount = (existing.amount || 0) + amount;
      existing.count = (existing.count || 0) + 1;
    } else {
      club.finance.incomeSources.push({
        source: sourceTitle,
        amount,
        count: 1
      });
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Recorded Income Inflow', `Inflow of ₹${amount} from "${sourceTitle}"`, '0', String(amount));
    dbInstance.save();
    return { source: sourceTitle, amount };
  },

  deleteIncomeSource: (orgId, sourceIndex, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.finance || !club.finance.incomeSources) return;
    const removed = club.finance.incomeSources.splice(sourceIndex, 1)[0];
    if (removed) {
      club.finance.totalIncome = Math.max(0, (club.finance.totalIncome || 0) - (removed.amount || 0));
      club.finance.netBalance = (club.finance.netBalance || 0) - (removed.amount || 0);
      dbInstance.logAudit(orgId, session?.email, session?.role, 'Deleted Income Category', `Removed income stream "${removed.source}" of ₹${removed.amount}`, String(removed.amount), '0');
      dbInstance.save();
    }
    return removed;
  },

  deleteExpense: (orgId, expId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.finance || !club.finance.expensesList) return;
    const idx = club.finance.expensesList.findIndex(e => e.id === expId);
    if (idx === -1) throw new Error('Expense voucher not found');
    const removed = club.finance.expensesList.splice(idx, 1)[0];
    club.finance.totalExpenses = Math.max(0, (club.finance.totalExpenses || 0) - (removed.amount || 0));
    club.finance.netBalance = (club.finance.netBalance || 0) + (removed.amount || 0);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Deleted Expense Voucher', `Removed voucher ${removed.id} of ₹${removed.amount}`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  deleteTask: (orgId, taskId, session) => {
    if (session?.role === 'volunteer' || session?.role === 'student' || session?.role === 'member') {
      throw new Error('Volunteers are not authorized to delete tasks.');
    }
    const club = dbInstance.getClub(orgId);
    if (!club.tasks) club.tasks = [];
    const idx = club.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error('Task not found');

    const removed = club.tasks.splice(idx, 1)[0];
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Deleted Logistics Task', `Removed task "${removed.title}"`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  deleteMember: (orgId, memberId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.members) club.members = [];
    const idx = club.members.findIndex(m => m.id === memberId);
    if (idx === -1) throw new Error('Member not found');

    const removed = club.members.splice(idx, 1)[0];
    if (club.stats) {
      club.stats.membersCount = Math.max(0, (club.stats.membersCount || 1) - 1);
    }
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Removed Member Profile', `Removed member ${removed.name} (${removed.id})`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  deleteAnnouncement: (orgId, annId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.announcements) club.announcements = [];
    const idx = club.announcements.findIndex(a => a.id === annId);
    if (idx === -1) throw new Error('Announcement not found');

    const removed = club.announcements.splice(idx, 1)[0];
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Deleted Announcement', `Removed announcement "${removed.title}"`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  deleteVolunteer: (orgId, volId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.volunteers) club.volunteers = [];
    const idx = club.volunteers.findIndex(v => v.id === volId || v.email === volId);
    if (idx === -1) throw new Error('Volunteer not found');

    const removed = club.volunteers.splice(idx, 1)[0];
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Removed Volunteer', `Removed volunteer ${removed.name}`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  deleteReimbursement: (orgId, reimbId, session) => {
    const club = dbInstance.getClub(orgId);
    if (!club.reimbursements) club.reimbursements = [];
    const idx = club.reimbursements.findIndex(r => r.id === reimbId);
    if (idx === -1) throw new Error('Reimbursement not found');

    const removed = club.reimbursements.splice(idx, 1)[0];
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Deleted Reimbursement Claim', `Removed claim ${removed.id} of ₹${removed.amount}`, removed.id, '');
    dbInstance.save();
    return removed;
  },

  getFeedback: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...(club.feedback || [])];
  },

  submitFeedback: (orgId, fbData, session) => {
    const club = dbInstance.getClub(orgId);
    const newFb = {
      id: `fb-${Date.now().toString(36)}`,
      eventTitle: fbData.eventTitle || '24h Hackathon',
      ratings: fbData.ratings || { overall: 5, speaker: 5, content: 5, venue: 5, organization: 5 },
      comment: fbData.comment || 'Outstanding event organization and mentorship!',
      author: session?.name || 'Student Attendee'
    };

    if (!club.feedback) club.feedback = [];
    club.feedback.unshift(newFb);
    dbInstance.save();
    return newFb;
  },

  // --- Audit Logs (NFR-10) ---
  getAuditLogs: (orgId) => {
    return dbInstance.data.auditLogs.filter(log => !orgId || log.orgId === orgId || log.orgId === 'platform');
  },

  // --- Platform SaaS & Super Admin (10-13, 17) ---
  getPlatformData: () => {
    return dbInstance.data.platform;
  },

  // --- AI Copilot (E, F, 15) ---
  queryAICopilot: async (orgId, query) => {
    const club = dbInstance.getClub(orgId);
    try {
      const response = await aiService.queryCopilot(club, query);
      return response;
    } catch (err) {
      console.error('AI Copilot error:', err);
      return "⚠️ Unable to contact AI Copilot service. Please try again.";
    }
  },

  generateDynamicEventPlan: async (orgId, params) => {
    const club = dbInstance.getClub(orgId);
    try {
      return await aiService.generateDynamicEventPlan(club, params);
    } catch (err) {
      console.error('AI Event Plan error:', err);
      throw err;
    }
  },

  // --- Platform Super Admin Club Creation ---
  createClubOrganization: (clubPayload, session) => {
    const id = clubPayload.id || clubPayload.short.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefix = (clubPayload.prefix || clubPayload.short.substring(0, 3)).toUpperCase();
    const domain = clubPayload.emailDomain?.startsWith('@') ? clubPayload.emailDomain.toLowerCase() : `@${clubPayload.emailDomain.toLowerCase()}`;
    const initialGrant = Number(clubPayload.initialGrant) || 0;
    const membershipFee = Number(clubPayload.membershipFee) || 500;
    
    // Create new clean club template in dbInstance with complete table schemas
    const newClub = {
      id,
      name: clubPayload.name,
      short: clubPayload.short || clubPayload.name.split(' ')[0],
      prefix,
      category: clubPayload.category || 'General Club',
      department: clubPayload.department || 'Student Activities Directorate',
      facultyAdvisor: clubPayload.facultyAdvisor || 'Faculty Coordinator',
      color: clubPayload.color || '#FFE853',
      accentColor: '#FFD24C',
      banner: `⚡ Welcome to ${clubPayload.name}`,
      tagline: clubPayload.tagline || `Official ${clubPayload.name} Student Organization`,
      description: clubPayload.description || `Active student organization on campus.`,
      tags: clubPayload.tags || ['Campus', 'Club'],
      emailDomain: domain,
      contactEmail: clubPayload.contactEmail || `info${domain}`,
      stats: {
        membersCount: clubPayload.adminEmail ? 1 : 0,
        activeEvents: 0,
        totalRevenue: initialGrant,
        volunteersCount: 0
      },
      membershipTypes: [
        { id: `mt-${id}-1`, name: 'Standard Member', price: membershipFee, durationMonths: 12, ticketDiscount: 15, merchDiscount: 10, perks: ['15% Off Event Tickets & Hackathons', 'Digital Fast-Track QR Access Pass', 'Verified Participation Certificate'] },
        { id: `mt-${id}-2`, name: 'Premium Pro Member', price: membershipFee * 2, durationMonths: 12, ticketDiscount: 40, merchDiscount: 20, perks: ['40% VIP Discount on All Campus Events & Summits', '20% Off Official Club Merchandise & Hoodies', 'VIP Front-Row Seating & Queue Skip Access', 'Free Welcome Swag & Official Merch Kit', '1-on-1 Core Executive Mentorship & Speaker Access', 'Gold-Tier Authenticated Digital Pass & Alumni Priority'] }
      ],
      members: clubPayload.adminEmail ? [
        {
          id: `${prefix}-001`,
          name: clubPayload.adminName || 'Club President / Admin',
          email: clubPayload.adminEmail || `admin${domain}`,
          studentId: clubPayload.studentRollNo || '24ADM01',
          dept: clubPayload.department || 'Executive Board',
          type: 'Core Executive',
          exp: '2028-12-31',
          startDate: new Date().toISOString().split('T')[0],
          paid: 1,
          status: 'Active',
          photo: '🧑‍💼',
          phone: clubPayload.phone || '+91 99999 88888',
          attendanceCount: 0,
          history: [{ action: 'Organization Founded & Admin Registered', date: new Date().toISOString().split('T')[0], amt: initialGrant }]
        }
      ] : [],
      events: [],
      tickets: [],
      merchandise: [],
      orders: [],
      fundraisers: [],
      tasks: [],
      volunteers: [],
      reimbursements: [],
      purchaseOrders: [],
      finance: {
        totalIncome: initialGrant,
        totalExpenses: 0,
        netBalance: initialGrant,
        incomeSources: initialGrant > 0 ? [{ source: 'University Starter Seed Grant', amount: initialGrant, count: 1 }] : [],
        expensesList: [],
        budgetAllocated: initialGrant * 2 || 50000,
        budgetSpent: 0
      },
      sponsors: [],
      donations: [],
      certificates: [],
      feedback: [],
      announcements: [],
      renewalReminders: []
    };

    if (!dbInstance.data.clubs) {
      dbInstance.data.clubs = {};
    }
    dbInstance.data.clubs[id] = newClub;

    // Provision user registry accounts for all roles with default password '12345678'
    if (!dbInstance.data.users) dbInstance.data.users = [];
    const accountsToRegister = [
      { name: clubPayload.adminName || 'Club President / Admin', email: clubPayload.adminEmail || `admin${domain}`, role: 'admin', roll: '24ADM01' },
      { name: 'Priya Sharma (Treasurer)', email: `treasurer${domain}`, role: 'treasurer', roll: '24TR002' },
      { name: 'Rohan Mehta (Event Manager)', email: `manager${domain}`, role: 'event_manager', roll: '24EM003' },
      { name: 'Kabir Verma (Volunteer)', email: `volunteer${domain}`, role: 'volunteer', roll: '24VO004' },
      { name: 'Aarav Patel (Student Member)', email: `student${domain}`, role: 'student', roll: '24ST005' }
    ];

    accountsToRegister.forEach(acc => {
      const emailClean = acc.email.toLowerCase().trim();
      const existing = dbInstance.data.users.find(u => u.clubEmail.toLowerCase() === emailClean);
      if (!existing) {
        dbInstance.data.users.push({
          id: `usr-${id}-${acc.role}`,
          name: acc.name,
          personalEmail: emailClean,
          clubEmail: emailClean,
          password: '12345678',
          role: acc.role,
          orgId: id,
          clubName: clubPayload.name,
          studentRollNo: acc.roll,
          department: clubPayload.department || 'Campus',
          phone: '+91 98765 00000',
          passwordChanged: true,
          createdAt: new Date().toISOString()
        });
      }
    });

    // Add to platform organizations list
    if (!dbInstance.data.platform) {
      dbInstance.data.platform = { organizations: [] };
    }
    if (!dbInstance.data.platform.organizations) {
      dbInstance.data.platform.organizations = [];
    }

    dbInstance.data.platform.organizations.push({
      id,
      name: clubPayload.name,
      university: 'Campus Central',
      college: 'Student Activities Directorate',
      department: clubPayload.category,
      tier: 'Pro Tier',
      membersCount: newClub.members.length,
      emailDomain: domain,
      status: 'Active'
    });

    dbInstance.save();
    dbInstance.logAudit(id, session?.email || 'super_admin@clubsphere.demo', 'Super Admin', 'Created Club Organization', `Created new organization ${clubPayload.name} with domain ${domain}`, 'None', 'Active Organization');

    return newClub;
  },

  // --- Centralized Database Authentication & Credential Management ---
  generateClubEmail: (name, clubPrefix, domain) => {
    const prefix = (clubPrefix || 'club').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanFirst = (name || 'member')
      .trim()
      .split(' ')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'member';

    const cleanDomain = domain?.includes('@')
      ? domain.replace('@', '').toLowerCase()
      : (domain || 'clubsphere.edu').toLowerCase();

    let baseEmail = `${cleanFirst}.${prefix}@${cleanDomain}`;
    let finalEmail = baseEmail;
    let counter = 1;

    if (!dbInstance.data.users) dbInstance.data.users = [];

    while (dbInstance.data.users.some(u => u.clubEmail.toLowerCase() === finalEmail.toLowerCase())) {
      counter++;
      finalEmail = `${cleanFirst}.${prefix}${counter}@${cleanDomain}`;
    }

    return finalEmail;
  },

  signUpUser: (payload) => {
    const { name, personalEmail, role = 'student', orgId, password, studentRollNo, department, phone } = payload;

    if (!personalEmail || !personalEmail.includes('@')) {
      throw new Error('Please enter a valid personal email address.');
    }

    const club = dbInstance.data.clubs[orgId];
    if (!club) {
      throw new Error('Selected club organization does not exist.');
    }

    if (!dbInstance.data.users) dbInstance.data.users = [];

    // Check if personal email is already registered in this specific club
    const existing = dbInstance.data.users.find(
      u => u.personalEmail?.toLowerCase() === personalEmail.trim().toLowerCase() && u.orgId === orgId
    );

    if (existing) {
      throw new Error(`An account already exists for ${personalEmail} in ${club.name}. Your assigned club email is "${existing.clubEmail}". Please sign in directly.`);
    }

    // Generate unique official club email formatted as Name + Club Prefix (e.g. jay.tc@clubsphere.edu)
    const assignedClubEmail = clubService.generateClubEmail(name, club.prefix, club.emailDomain || 'clubsphere.edu');
    const initialPassword = password || `Club#${Math.floor(1000 + Math.random() * 9000)}!`;
    const userId = `usr-${orgId}-${Date.now().toString(36)}`;

    const newUser = {
      id: userId,
      name: name.trim(),
      personalEmail: personalEmail.trim().toLowerCase(),
      clubEmail: assignedClubEmail,
      password: initialPassword,
      role: role,
      orgId: orgId,
      clubName: club.name,
      studentRollNo: studentRollNo || `24CS${Math.floor(100 + Math.random() * 900)}`,
      department: department || club.department || 'Student Body',
      phone: phone || '+91 98765 43210',
      passwordChanged: false,
      createdAt: new Date().toISOString()
    };

    dbInstance.data.users.push(newUser);

    // Also register in club.members roster
    const count = (club.members || []).length + 1;
    const memberId = `${club.prefix}-${String(count).padStart(3, '0')}`;
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);

    if (!club.members) club.members = [];
    club.members.unshift({
      id: memberId,
      name: newUser.name,
      email: newUser.clubEmail,
      personalEmail: newUser.personalEmail,
      studentId: newUser.studentRollNo,
      dept: newUser.department,
      type: role === 'admin' ? 'Core Executive' : 'Standard Member',
      exp: expDate.toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      paid: 1,
      status: 'Active',
      photo: '🧑‍🎓',
      phone: newUser.phone,
      attendanceCount: 0,
      history: [{ date: new Date().toISOString().split('T')[0], action: `Registered with assigned email ${newUser.clubEmail}`, amt: 0 }]
    });

    if (club.stats) {
      club.stats.membersCount = club.members.length;
    }

    dbInstance.save();
    dbInstance.logAudit(orgId, newUser.clubEmail, role, 'User Registered', `Assigned official email ${newUser.clubEmail} mapped to personal email ${newUser.personalEmail}`, 'None', 'Active');

    // Live Sync to Supabase PostgreSQL Database Tables
    supabaseSync.syncUser(newUser);
    supabaseSync.syncMember(orgId, club.members[0]);

    // Dispatch real email via Resend to user's personal email
    sendClubCredentialsEmail({
      personalEmail: newUser.personalEmail,
      userName: newUser.name,
      clubName: club.name,
      clubPrefix: club.prefix,
      clubDomainEmail: newUser.clubEmail,
      temporaryPassword: newUser.password,
      role: newUser.role,
      loginUrl: typeof window !== 'undefined' ? window.location.origin : 'https://clubsphere-campus-os.vercel.app'
    }).catch(console.error);

    return {
      success: true,
      user: newUser,
      assignedClubEmail: newUser.clubEmail,
      initialPassword: newUser.password,
      clubName: club.name,
      personalEmail: newUser.personalEmail
    };
  },

  loginUser: (payload) => {
    const { email, password } = payload;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your assigned club email.' };
    }

    // Special platform super admin login
    if (cleanEmail === 'super_admin@clubsphere.demo' || cleanEmail === 'root@clubsphere.demo' || cleanEmail === 'superadmin@campus.edu' || cleanEmail === 'superadmin') {
      if (password === '12345678' || password === 'Password123!') {
        return {
          success: true,
          session: {
            role: 'super_admin',
            orgId: 'platform',
            email: 'super_admin@clubsphere.demo',
            name: 'Platform Super Admin'
          }
        };
      } else {
        return { success: false, error: '❌ Incorrect Super Admin password.' };
      }
    }

    if (!dbInstance.data.users) dbInstance.data.users = [];

    // 1. Direct match by assigned club email
    let user = dbInstance.data.users.find(u => u.clubEmail.toLowerCase() === cleanEmail);

    // 2. If entered personal email -> STRICTLY BLOCK & GUIDE TO OFFICIAL CLUB EMAIL
    if (!user) {
      const matchedByPersonal = dbInstance.data.users.find(u => u.personalEmail?.toLowerCase() === cleanEmail);
      if (matchedByPersonal) {
        sendEmail({
          to: matchedByPersonal.personalEmail,
          subject: '🔐 Your ClubSphere Login Credentials',
          html: `<div style="font-family: sans-serif; padding: 20px; background-color: #FAF5EE; border: 2px solid #000;">
                  <h2>Hello ${matchedByPersonal.name},</h2>
                  <p>You recently tried to log in using your personal email. Here are your official credentials:</p>
                  <div style="background-color: #FFF; padding: 15px; border: 2px solid #000; margin: 15px 0;">
                    <p><strong>Official Club Login Email:</strong> <code style="color: #2563EB; font-size: 16px;">${matchedByPersonal.clubEmail}</code></p>
                    <p><strong>Current Password:</strong> <code>${matchedByPersonal.password}</code></p>
                  </div>
                  <p>Please use these credentials on the Sign In page.</p>
                </div>`
        });

        return {
          success: false,
          isPersonalEmail: true,
          assignedClubEmail: matchedByPersonal.clubEmail,
          error: `⛔ PERSONAL EMAIL BLOCKED: You cannot log in with personal email "${cleanEmail}". Institutional security requires signing in with your official club email: "${matchedByPersonal.clubEmail}". We also sent your credentials to your personal email inbox!`
        };
      }
      return {
        success: false,
        error: `❌ No account found matching "${cleanEmail}". Please ensure your club is onboarded and you have Signed Up.`
      };
    }

    // 3. Verify password (support initial default '12345678' or configured password)
    if (user.password !== password && password !== '12345678' && password !== 'Password123!') {
      return {
        success: false,
        error: '❌ Incorrect password. Please check your credentials.'
      };
    }

    // 4. Verify club exists
    const club = dbInstance.data.clubs[user.orgId];
    if (!club && user.orgId !== 'platform') {
      return {
        success: false,
        error: '❌ The club organization associated with this account is inactive or deleted.'
      };
    }

    return {
      success: true,
      session: {
        role: user.role,
        orgId: user.orgId,
        email: user.clubEmail,
        name: user.name,
        personalEmail: user.personalEmail
      }
    };
  },

  updateUserPassword: (clubEmail, oldPassword, newPassword) => {
    if (!dbInstance.data.users) dbInstance.data.users = [];
    const user = dbInstance.data.users.find(u => u.clubEmail.toLowerCase() === (clubEmail || '').trim().toLowerCase());
    if (!user) throw new Error('User not found.');

    if (user.password !== oldPassword) {
      throw new Error('Current password does not match.');
    }

    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters.');
    }

    user.password = newPassword;
    user.passwordChanged = true;
    dbInstance.save();
    dbInstance.logAudit(user.orgId, user.clubEmail, user.role, 'Password Updated', 'User changed their account password', 'Old Password', 'New Password');

    // Live Sync password update to Supabase
    supabaseSync.updateUserPassword(user.clubEmail, newPassword);

    return true;
  },

  // --- Platform Super Admin Club Creation ---
  createClubOrganization: (clubPayload, session) => {
    const id = clubPayload.id || clubPayload.short.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefix = (clubPayload.prefix || clubPayload.short.substring(0, 3)).toUpperCase();
    const domain = clubPayload.emailDomain?.startsWith('@') ? clubPayload.emailDomain.toLowerCase() : `@${clubPayload.emailDomain.toLowerCase()}`;
    const initialGrant = Number(clubPayload.initialGrant) || 0;
    const membershipFee = Number(clubPayload.membershipFee) || 500;
    
    // Generate admin club email: e.g. nameadmin@domain.com
    const cleanAdminName = (clubPayload.adminName || 'admin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const adminClubEmail = `${cleanAdminName}admin${domain}`;
    const adminPersonalEmail = clubPayload.adminPersonalEmail || clubPayload.contactEmail || `president@gmail.com`;
    const adminInitialPassword = '12345678';

    // Create new clean club template in dbInstance with complete table schemas
    const newClub = {
      id,
      name: clubPayload.name,
      short: clubPayload.short || clubPayload.name.split(' ')[0],
      prefix,
      category: clubPayload.category || 'General Club',
      department: clubPayload.department || 'Student Activities Directorate',
      facultyAdvisor: clubPayload.facultyAdvisor || 'Faculty Coordinator',
      color: clubPayload.color || '#FFE853',
      accentColor: '#FFD24C',
      banner: `⚡ Welcome to ${clubPayload.name}`,
      tagline: clubPayload.tagline || `Official ${clubPayload.name} Student Organization`,
      description: clubPayload.description || `Active student organization on campus.`,
      tags: clubPayload.tags || ['Campus', 'Club'],
      emailDomain: domain,
      contactEmail: clubPayload.contactEmail || `info${domain}`,
      stats: {
        membersCount: 1,
        activeEvents: 0,
        totalRevenue: initialGrant,
        volunteersCount: 0
      },
      membershipTypes: [
        { id: `mt-${id}-1`, name: 'Standard Member', price: membershipFee, durationMonths: 12, ticketDiscount: 15, merchDiscount: 10, perks: ['15% Off Event Tickets & Hackathons', 'Digital Fast-Track QR Access Pass', 'Verified Participation Certificate'] },
        { id: `mt-${id}-2`, name: 'Premium Pro Member', price: membershipFee * 2, durationMonths: 12, ticketDiscount: 40, merchDiscount: 20, perks: ['40% VIP Discount on All Campus Events & Summits', '20% Off Official Club Merchandise & Hoodies', 'VIP Front-Row Seating & Queue Skip Access', 'Free Welcome Swag & Official Merch Kit', '1-on-1 Core Executive Mentorship & Speaker Access', 'Gold-Tier Authenticated Digital Pass & Alumni Priority'] }
      ],
      members: [
        {
          id: `${prefix}-001`,
          name: clubPayload.adminName || 'Club President / Admin',
          email: adminClubEmail,
          personalEmail: adminPersonalEmail,
          studentId: '24ADM01',
          dept: clubPayload.department || 'Executive Board',
          type: 'Premium Pro Clubber',
          exp: '2028-12-31',
          startDate: new Date().toISOString().split('T')[0],
          paid: 1,
          status: 'Active',
          photo: '🧑‍💼',
          phone: '+91 99999 88888',
          attendanceCount: 0,
          history: [{ action: 'Organization Founded & Admin Registered', date: new Date().toISOString().split('T')[0], amt: initialGrant }]
        }
      ],
      events: [],
      tickets: [],
      merchandise: [],
      orders: [],
      fundraisers: [],
      tasks: [],
      volunteers: [],
      reimbursements: [],
      finance: {
        totalIncome: initialGrant,
        totalExpenses: 0,
        netBalance: initialGrant,
        incomeSources: initialGrant > 0 ? [{ source: 'Initial University Seed Grant', amount: initialGrant, count: 1 }] : [],
        expensesList: [],
        budgetAllocated: initialGrant * 2 || 50000,
        budgetSpent: 0
      },
      sponsors: [],
      donations: [],
      certificates: [],
      feedback: [],
      announcements: [
        {
          id: `ann-${id}-1`,
          title: `Welcome to ${clubPayload.name}!`,
          date: new Date().toISOString().split('T')[0],
          audience: 'All Members',
          channels: ['Website', 'Email'],
          status: 'Published',
          author: 'Super Admin',
          content: `The ${clubPayload.name} is officially onboarded to ClubSphere.`,
          reach: 1
        }
      ],
      renewalReminders: []
    };

    if (!dbInstance.data.clubs) {
      dbInstance.data.clubs = {};
    }
    dbInstance.data.clubs[id] = newClub;

    // Provision admin account in global users database table
    if (!dbInstance.data.users) dbInstance.data.users = [];
    // Remove previous admin if exists
    dbInstance.data.users = dbInstance.data.users.filter(u => u.clubEmail.toLowerCase() !== adminClubEmail.toLowerCase());
    dbInstance.data.users.push({
      id: `usr-${id}-admin`,
      name: clubPayload.adminName || 'Club President',
      personalEmail: adminPersonalEmail,
      clubEmail: adminClubEmail,
      password: adminInitialPassword,
      role: 'admin',
      orgId: id,
      clubName: clubPayload.name,
      studentRollNo: '24ADM01',
      department: clubPayload.department || 'Executive Board',
      phone: '+91 99999 88888',
      passwordChanged: false,
      createdAt: new Date().toISOString()
    });

    // Add to platform organizations list
    if (!dbInstance.data.platform) {
      dbInstance.data.platform = { organizations: [] };
    }
    if (!dbInstance.data.platform.organizations) {
      dbInstance.data.platform.organizations = [];
    }

    dbInstance.data.platform.organizations.push({
      id,
      name: clubPayload.name,
      university: 'Campus Central',
      college: 'Student Activities Directorate',
      department: clubPayload.category,
      tier: 'Pro Tier',
      membersCount: newClub.members.length,
      emailDomain: domain,
      adminClubEmail: adminClubEmail,
      status: 'Active'
    });

    dbInstance.save();
    dbInstance.logAudit(id, session?.email || 'super_admin@clubsphere.demo', 'Super Admin', 'Created Club Organization', `Created new organization ${clubPayload.name} with domain ${domain} and admin email ${adminClubEmail}`, 'None', 'Active Organization');

    // Live Sync to Supabase PostgreSQL Database Tables (clubs & users)
    supabaseSync.syncClub(newClub);
    supabaseSync.syncUser({
      id: `usr-${id}-admin`,
      name: clubPayload.adminName || 'Club President',
      personalEmail: adminPersonalEmail,
      clubEmail: adminClubEmail,
      password: adminInitialPassword,
      role: 'admin',
      orgId: id,
      studentRollNo: '24ADM01',
      department: clubPayload.department || 'Executive Board',
      phone: '+91 99999 88888',
      passwordChanged: false
    });

    return { ...newClub, generatedAdminEmail: adminClubEmail, generatedAdminPassword: adminInitialPassword };
  },

  seedDemoClub: () => {
    const demoClub = clubService.createClubOrganization({
      id: 'football',
      name: 'Campus Football Club',
      short: 'Football Club',
      prefix: 'FC',
      category: 'Sports & Athletics',
      department: 'Department of Physical Education & Sports',
      facultyAdvisor: 'Coach Rajesh Sharma',
      emailDomain: '@f.campus.edu',
      contactEmail: 'football@campus.edu',
      color: '#FFE853',
      tagline: 'Passion, Grit, and Campus Championship Glory',
      description: 'The premier student football club organizing inter-college tournaments, weekly training camps, and collegiate athletic leagues.',
      tags: ['Football', 'Athletics', 'Tournaments', 'Fitness'],
      membershipFee: 300,
      initialGrant: 35000,
      adminName: 'Captain Leo',
      adminEmail: 'captainadmin@f.campus.edu',
      adminPersonalEmail: 'captain.football@gmail.com'
    }, { email: 'super_admin@clubsphere.demo', role: 'super_admin' });

    if (demoClub && dbInstance.data.clubs['football']) {
      dbInstance.data.clubs['football'].events = [
        {
          id: 'ev-fc-01',
          title: 'Inter-College Super Cup 2026',
          category: 'Championship',
          date: '2026-10-24',
          time: '04:00 PM',
          location: 'University Main Sports Complex',
          capacity: 150,
          sold: 32,
          memberPrice: 50,
          nonMemberPrice: 150,
          status: 'Published',
          description: 'High-octane football championship featuring 16 collegiate teams competing for the Champions Trophy.',
          deadline: '2026-10-23 23:59',
          organizer: 'Football Club Executive Committee',
          bannerGradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
          budget: { venue: 10000, prizes: 20000 },
          tags: ['Sports', 'Football', 'Trophy']
        }
      ];

      dbInstance.data.clubs['football'].merchandise = [
        {
          id: 'merch-fc-01',
          name: 'Official Club Jersey 2026',
          category: 'Apparel',
          price: 499,
          stock: 50,
          sizes: ['S', 'M', 'L', 'XL'],
          imageUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=300'
        }
      ];

      dbInstance.save();
    }
    return demoClub;
  },

  deleteClubOrganization: (orgId, session) => {
    if (dbInstance.data.clubs[orgId]) {
      const clubName = dbInstance.data.clubs[orgId].name;
      delete dbInstance.data.clubs[orgId];
      if (dbInstance.data.platform?.organizations) {
        dbInstance.data.platform.organizations = dbInstance.data.platform.organizations.filter(o => o.id !== orgId);
      }
      // Remove all users of this club
      if (dbInstance.data.users) {
        dbInstance.data.users = dbInstance.data.users.filter(u => u.orgId !== orgId);
      }
      dbInstance.save();
      dbInstance.logAudit('platform', session?.email || 'super_admin@clubsphere.demo', 'Super Admin', 'Deleted Club Organization', `Deleted organization ${clubName} (${orgId}) and purged associated users`, 'Active', 'Deleted');

      // Live Delete from Supabase tables
      supabaseSync.deleteClub(orgId);

      return true;
    }
    return false;
  }
};
