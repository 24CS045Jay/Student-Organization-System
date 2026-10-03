// ==========================================================================
// ClubSphere Unified Service Layer
// All components invoke services with tenant context (orgId)
// ==========================================================================

import { dbInstance, inr } from '../mock/db';
import { generateSignedQRToken, verifyQRToken } from './qrSecurityService';
import { sendEmail, sendTicketConfirmationEmail } from './emailService';
import { notificationService } from './notificationService';
import { supabaseSync } from './supabaseService';

export const clubService = {
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
      member.type = newPlan;
    }

    const renewCost = member.type.includes('Premium') ? 999 : 499;
    member.history.push({
      date: new Date().toISOString().split('T')[0],
      action: newPlan ? `Upgraded to ${newPlan}` : `Renewed Membership (${months} mo)`,
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
    if (!queryId) return { status: 'INVALID', message: 'No ID provided' };
    
    // Check if ID belongs to another club (e.g. TC- vs CC- vs SC-)
    for (const [otherOrgId, otherClub] of Object.entries(dbInstance.data.clubs)) {
      if (otherOrgId !== currentOrgId) {
        const otherMember = otherClub.members.find(m => m.id.toLowerCase() === queryId.toLowerCase() || m.email.toLowerCase() === queryId.toLowerCase());
        if (otherMember) {
          return {
            status: 'WRONG_CLUB',
            message: `Cross-tenant ID: Member belongs to ${otherClub.name}, NOT ${dbInstance.data.clubs[currentOrgId].name}!`,
            member: otherMember,
            clubName: otherClub.name
          };
        }
      }
    }

    const club = dbInstance.getClub(currentOrgId);
    const member = club.members.find(m => m.id.toLowerCase() === queryId.toLowerCase() || m.email.toLowerCase() === queryId.toLowerCase() || m.studentId?.toLowerCase() === queryId.toLowerCase());

    if (!member) {
      return { status: 'INVALID', message: `ID "${queryId}" not found in current club registry.` };
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
      status: eventData.status || 'Draft',
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

  validateAndCheckInTicket: (orgId, queryTicketId, session) => {
    const cleanId = (queryTicketId || '').trim().toUpperCase();
    if (!cleanId) return { status: 'INVALID', message: 'No ticket barcode or ID provided.' };

    // Tenant Isolation Check across other clubs
    for (const [otherOrgId, otherClub] of Object.entries(dbInstance.data.clubs)) {
      if (otherOrgId !== orgId) {
        const otherTicket = otherClub.tickets.find(t => t.id.toUpperCase() === cleanId);
        if (otherTicket) {
          return {
            status: 'WRONG_CLUB',
            message: `Cross-tenant Ticket: This ticket belongs to ${otherClub.name}!`,
            ticket: otherTicket
          };
        }
      }
    }

    const club = dbInstance.getClub(orgId);
    const ticket = club.tickets.find(t => t.id.toUpperCase() === cleanId);

    if (!ticket) {
      return { status: 'INVALID', message: `Ticket ID "${cleanId}" not found in current club database.` };
    }

    if (ticket.status === 'Attended') {
      return {
        status: 'ALREADY_USED',
        ticket,
        message: `⚠️ DUPLICATE ENTRY ATTEMPT! Already scanned at ${ticket.checkInTime || 'Earlier Today'}.`
      };
    }

    if (ticket.status === 'Refunded') {
      return {
        status: 'REFUNDED',
        ticket,
        message: `⛔ Ticket was cancelled/refunded. Entry denied.`
      };
    }

    // Mark as attended
    const checkInTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today';
    ticket.status = 'Attended';
    ticket.checkInTime = checkInTimestamp;

    dbInstance.logAudit(orgId, session?.email, session?.role, 'QR Check-in Scanned', `Marked ${ticket.id} (${ticket.attendeeName}) as Attended`, 'Valid', 'Attended');
    dbInstance.save();

    return {
      status: 'ATTENDED_SUCCESS',
      ticket,
      message: `✅ VALID TICKET! Welcome, ${ticket.attendeeName} (${ticket.seat})!`
    };
  },

  // --- Merchandise & Inventory (FR-09 to FR-11) ---
  getMerchandise: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...club.merchandise];
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

  orderMerchandise: (orgId, orderPayload, session) => {
    const club = dbInstance.getClub(orgId);
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
    const newOrder = {
      id: ordId,
      memberId: orderPayload.memberId || null,
      customerName: orderPayload.customerName || session?.name || 'Student Member',
      email: orderPayload.email || session?.email || 'student@campus.edu',
      items: [{ productId: product.id, name: product.name, size: orderPayload.size, qty: reqQty, price: orderPayload.unitPrice }],
      totalAmt: orderPayload.totalAmt,
      status: 'Paid',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: orderPayload.paymentMethod || 'UPI'
    };

    club.orders.unshift(newOrder);

    // Update income
    club.finance.totalIncome += orderPayload.totalAmt;
    club.finance.netBalance += orderPayload.totalAmt;
    const merchSource = club.finance.incomeSources.find(s => s.source === 'Merchandise Sales');
    if (merchSource) {
      merchSource.amount += orderPayload.totalAmt;
      merchSource.count += reqQty;
    }

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Placed Merch Order', `Order ${ordId} for ${product.name} (${orderPayload.size} x ${reqQty}) = ₹${orderPayload.totalAmt}`, 'Stock Reserved', 'Paid & Ready');
    dbInstance.save();
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
    return [...club.tasks];
  },

  updateTaskStatus: (orgId, taskId, newStatus, newProgress, session) => {
    const club = dbInstance.getClub(orgId);
    const task = club.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const oldStatus = task.status;
    task.status = newStatus;
    if (newProgress !== undefined) task.progress = newProgress;
    if (newStatus === 'Done') task.progress = 100;

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Updated Task Kanban', `Task "${task.title}" moved to ${newStatus}`, oldStatus, newStatus);
    dbInstance.save();
    supabaseSync.syncTask(orgId, task);
    return task;
  },

  createTask: (orgId, taskData, session) => {
    const club = dbInstance.getClub(orgId);
    const newTask = {
      id: `tsk-${Date.now().toString(36)}`,
      title: taskData.title,
      owner: taskData.owner || 'Unassigned',
      deadline: taskData.deadline || '2026-10-25',
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'Pending',
      progress: taskData.status === 'Done' ? 100 : 0,
      notes: taskData.notes || ''
    };
    club.tasks.unshift(newTask);
    dbInstance.logAudit(orgId, session?.email, session?.role, 'Created Task', `Created task "${newTask.title}" for ${newTask.owner}`, 'None', newTask.id);
    dbInstance.save();
    supabaseSync.syncTask(orgId, newTask);
    return newTask;
  },

  logVolunteerHours: (orgId, volId, hoursToAdd, session) => {
    const club = dbInstance.getClub(orgId);
    const vol = club.volunteers.find(v => v.id === volId);
    if (!vol) throw new Error('Volunteer not found');

    const oldHours = vol.hours;
    vol.hours += Number(hoursToAdd);
    if (vol.hours >= 100) vol.badge = 'Gold Legend (100h+)';
    else if (vol.hours >= 50) vol.badge = 'Silver Contributor (50h+)';
    else if (vol.hours >= 25) vol.badge = 'Bronze Contributor (25h+)';

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Logged Volunteer Hours', `Added ${hoursToAdd}h for ${vol.name} (Total: ${vol.hours}h)`, `${oldHours}h`, `${vol.hours}h`);
    dbInstance.save();
    return vol;
  },

  // --- Finance & Reimbursements (FR-15 to FR-18) ---
  getFinanceSummary: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return JSON.parse(JSON.stringify(club.finance));
  },

  getReimbursements: (orgId) => {
    const club = dbInstance.getClub(orgId);
    return [...club.reimbursements];
  },

  submitReimbursement: (orgId, reimbData, session) => {
    const club = dbInstance.getClub(orgId);
    const newId = `REIMB-${club.prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const newReimb = {
      id: newId,
      volunteerName: reimbData.volunteerName || session?.name || 'Volunteer Member',
      volunteerEmail: reimbData.volunteerEmail || session?.email || 'volunteer@tech.demo',
      category: reimbData.category || 'Supplies',
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
    return newReimb;
  },

  advanceReimbursementStatus: (orgId, reimbId, newStatus, session) => {
    const club = dbInstance.getClub(orgId);
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
      date: new Date().toISOString().split('T')[0],
      campaign: donData.campaign || 'Club Development Fund',
      anonymous: Boolean(donData.anonymous),
      receiptNo: `DON-REC-${Math.floor(1000 + Math.random() * 9000)}`
    };

    if (!club.donations) club.donations = [];
    club.donations.unshift(newDon);

    club.finance.totalIncome += newDon.amount;
    club.finance.netBalance += newDon.amount;

    dbInstance.logAudit(orgId, session?.email, session?.role, 'Received Donation', `Donation of ₹${newDon.amount} received from ${newDon.donorName}`, 'None', newDon.receiptNo);
    dbInstance.save();
    return newDon;
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
  queryAICopilot: (orgId, query) => {
    const q = query.toLowerCase();
    const club = dbInstance.getClub(orgId);

    // Tenant Check: Check if user asks about another club
    if (q.includes('cultural') && orgId !== 'cult') {
      return `⚠️ **Tenant Isolation Guard (NFR-03)**: I am only authorized to access data for **${club.name}**. I cannot disclose financial records or member information for other campus organizations.`;
    }
    if (q.includes('sports') && orgId !== 'sport') {
      return `⚠️ **Tenant Isolation Guard**: I do not have access to other clubs' private ledgers. Currently loaded session is for **${club.name}**.`;
    }
    if (q.includes('tech') && orgId !== 'tech') {
      return `⚠️ **Tenant Isolation Guard (NFR-03)**: Access restricted. You are querying from **${club.name}**.`;
    }

    if (q.includes('spent') || q.includes('expense') || q.includes('expenses')) {
      const topExp = club.finance.expensesList[0];
      return `📊 **Financial Audit Report for ${club.short}:**\n• Total Expenses: **${inr(club.finance.totalExpenses)}** across ${club.finance.expensesList.length} ledger transactions.\n• Largest single expenditure: **${topExp?.title}** (${inr(topExp?.amount)}).\n• Budget utilization is currently at **${Math.round((club.finance.totalExpenses / club.finance.budgetAllocated) * 100)}%** of allocated quota.`;
    }

    if (q.includes('earned') || q.includes('most') || q.includes('revenue')) {
      const topEvent = [...club.events].sort((a, b) => (b.sold * b.memberPrice) - (a.sold * a.memberPrice))[0];
      return `🏆 **Top Revenue Driver for ${club.short}:**\n• **${topEvent.title}** generated approx **${inr(topEvent.sold * ((topEvent.memberPrice + topEvent.nonMemberPrice) / 2))}** with ${topEvent.sold}/${topEvent.capacity} tickets sold (${Math.round((topEvent.sold / topEvent.capacity) * 100)}% occupancy rate).`;
    }

    if (q.includes('money is left') || q.includes('balance') || q.includes('cash')) {
      return `💰 **Current Cash Balance for ${club.short}:**\n• Net Available Balance: **${inr(club.finance.netBalance)}**\n• Total Income: **${inr(club.finance.totalIncome)}**\n• Total Expenses: **${inr(club.finance.totalExpenses)}**\n• Financial health score: **94/100 (Strong Liquidity)**`;
    }

    if (q.includes('reimbursement') || q.includes('unpaid')) {
      const pending = club.reimbursements.filter(r => r.status !== 'Reimbursed');
      return `📋 **Pending Claims for ${club.short}:**\n• Found **${pending.length} pending claims** totaling **${inr(pending.reduce((acc, r) => acc + r.amount, 0))}**.\n${pending.map(p => `• ${p.volunteerName}: ${inr(p.amount)} (${p.status}) - ${p.description}`).join('\n')}`;
    }

    if (q.includes('plan') || q.includes('hackathon') || q.includes('event planner')) {
      return `✨ **AI Event Execution Plan Generated for ${club.short}:**\n• **Suggested Venue:** Central Computing Lab & Auditorium C\n• **Recommended Budget Split:** Venue (30%), Catering & Hydration (35%), Prizes/Trophies (25%), Marketing (10%)\n• **Optimal Pricing Strategy:** Member Pass ₹150 | Non-Member Pass ₹300 (Projected Gross Revenue: ₹48,000)\n• **Volunteers Required:** 8 members (3 Technical A/V, 2 Hospitality, 3 Registration)`;
    }

    if (q.includes('member') || q.includes('renew')) {
      const expiredCount = club.members.filter(m => new Date(m.exp) < new Date() || !m.paid).length;
      return `👥 **Membership Intelligence:**\n• Total Roster: **${club.members.length} members**\n• Active: **${club.members.length - expiredCount}** | Expired/Unpaid: **${expiredCount}**\n• Renewal conversion rate: **88.4%** this semester.`;
    }

    return `💡 **ClubSphere AI Insights for ${club.name}:**\n• Operating status is healthy with **${inr(club.finance.netBalance)}** cash reserves.\n• ${club.events.length} active events on schedule with ${club.members.length} registered club members.\n• Try asking: "How much did we spend?", "Which event earned the most?", or "Show unpaid reimbursements".`;
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
        { id: `mt-${id}-1`, name: 'Standard Member', price: membershipFee, durationMonths: 12, ticketDiscount: 15, merchDiscount: 10, perks: ['Discounted entry to workshops', 'Access to club hub', 'Digital Certificate'] },
        { id: `mt-${id}-2`, name: 'Premium Pro Clubber', price: membershipFee * 2, durationMonths: 12, ticketDiscount: 35, merchDiscount: 20, perks: ['Priority workshop seating', 'Exclusive Merchandise pass', 'Mentorship access'] }
      ],
      members: clubPayload.adminEmail ? [
        {
          id: `${prefix}-001`,
          name: clubPayload.adminName || 'Club President / Admin',
          email: clubPayload.adminEmail || `admin${domain}`,
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
      ] : [],
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
  generateClubEmail: (name, role, domain) => {
    const cleanDomain = domain?.startsWith('@') ? domain.toLowerCase() : `@${(domain || 'campus.edu').toLowerCase()}`;
    const cleanName = (name || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const cleanRole = (role || 'member')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace('student', 'member')
      .replace('event_manager', 'manager');

    let baseEmail = `${cleanName}${cleanRole}${cleanDomain}`;
    let finalEmail = baseEmail;
    let counter = 1;

    if (!dbInstance.data.users) dbInstance.data.users = [];

    while (dbInstance.data.users.some(u => u.clubEmail.toLowerCase() === finalEmail.toLowerCase())) {
      counter++;
      finalEmail = `${cleanName}${cleanRole}${counter}${cleanDomain}`;
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

    // Generate unique official club email
    const assignedClubEmail = clubService.generateClubEmail(name, role, club.emailDomain);
    const initialPassword = password || '12345678';
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

    // Simulate sending transactional welcome email
    sendEmail({
      to: newUser.personalEmail,
      subject: `🎉 Your Official ${club.name} Login Credentials`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #FAF5EE; border: 2px solid #000;">
          <h2>Welcome to ${club.name}!</h2>
          <p>Your institutional club account has been provisioned on ClubSphere.</p>
          <div style="background-color: #FFF; padding: 15px; border: 2px solid #000; margin: 15px 0;">
            <p><strong>Official Club Login Email:</strong> <code style="color: #2563EB; font-size: 16px;">${newUser.clubEmail}</code></p>
            <p><strong>Initial Password:</strong> <code>${newUser.password}</code></p>
            <p><strong>Assigned Role:</strong> ${newUser.role.toUpperCase()}</p>
          </div>
          <p>You can now log in to the portal using this official club email.</p>
        </div>
      `
    }).catch(console.error);

    return {
      success: true,
      user: newUser,
      assignedClubEmail: newUser.clubEmail,
      initialPassword: newUser.password,
      clubName: club.name
    };
  },

  loginUser: (payload) => {
    const { email, password } = payload;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your assigned club email.' };
    }

    if (!dbInstance.data.users) dbInstance.data.users = [];

    // 1. Direct match by assigned club email
    let user = dbInstance.data.users.find(u => u.clubEmail.toLowerCase() === cleanEmail);

    // 2. If not matched, check if they entered their personal email
    if (!user) {
      const matchedByPersonal = dbInstance.data.users.find(u => u.personalEmail?.toLowerCase() === cleanEmail);
      if (matchedByPersonal) {
        return {
          success: false,
          isPersonalEmail: true,
          assignedClubEmail: matchedByPersonal.clubEmail,
          error: `⚠️ You entered your personal email. Please sign in using your official platform email: "${matchedByPersonal.clubEmail}".`
        };
      }
      return {
        success: false,
        error: `❌ No account found matching "${cleanEmail}". Please ensure your club is onboarded and you have Signed Up.`
      };
    }

    // 3. Verify password
    if (user.password !== password) {
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
        { id: `mt-${id}-1`, name: 'Standard Member', price: membershipFee, durationMonths: 12, ticketDiscount: 15, merchDiscount: 10, perks: ['Discounted entry to workshops', 'Access to club hub', 'Digital Certificate'] },
        { id: `mt-${id}-2`, name: 'Premium Pro Clubber', price: membershipFee * 2, durationMonths: 12, ticketDiscount: 35, merchDiscount: 20, perks: ['Priority workshop seating', 'Exclusive Merchandise pass', 'Mentorship access'] }
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
