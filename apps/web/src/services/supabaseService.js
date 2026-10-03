// ==============================================================================
// Supabase Live Database Synchronization Service
// Directly writes and synchronizes all ClubSphere entities with Supabase PostgreSQL tables
// ==============================================================================

import { supabase } from './supabaseClient';

export const supabaseSync = {
  // --- 1. CLUBS / TENANTS ---
  syncClub: async (club) => {
    if (!supabase) return;
    try {
      const payload = {
        id: club.id,
        name: club.name,
        short_name: club.short || club.name,
        prefix: club.prefix || 'CLB',
        category: club.category || 'General',
        department: club.department || 'Student Affairs',
        faculty_advisor: club.facultyAdvisor || '',
        email_domain: club.emailDomain || `@${club.id}.campus.edu`,
        contact_email: club.contactEmail || `info@${club.id}.campus.edu`,
        brand_color: club.color || '#FFE853',
        membership_fee: Number(club.membershipFee) || 500,
        initial_grant: Number(club.initialGrant) || 10000,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('clubs')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('[Supabase Sync] Note on clubs table:', error.message);
      } else {
        console.info('[Supabase Sync] Successfully synced club to Supabase:', club.id);
      }
    } catch (err) {
      console.warn('[Supabase Sync] clubs exception:', err.message);
    }
  },

  deleteClub: async (clubId) => {
    if (!supabase) return;
    try {
      await supabase.from('clubs').delete().eq('id', clubId);
      await supabase.from('users').delete().eq('club_id', clubId);
      await supabase.from('events').delete().eq('club_id', clubId);
      await supabase.from('tasks').delete().eq('club_id', clubId);
      await supabase.from('members').delete().eq('club_id', clubId);
    } catch (err) {
      console.warn('[Supabase Sync] deleteClub exception:', err.message);
    }
  },

  // --- 2. USERS & CREDENTIALS ---
  syncUser: async (user) => {
    if (!supabase) return;
    try {
      const payload = {
        id: user.id || `usr-${user.orgId}-${Date.now().toString(36)}`,
        club_id: user.orgId,
        name: user.name,
        personal_email: user.personalEmail,
        assigned_club_email: user.clubEmail,
        password_hash: user.password,
        role: user.role || 'student',
        student_roll_no: user.studentRollNo || '',
        department: user.department || '',
        phone: user.phone || '',
        is_active: true,
        password_changed: Boolean(user.passwordChanged)
      };

      const { error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'assigned_club_email' });

      if (error) {
        console.warn('[Supabase Sync] Note on users table:', error.message);
      } else {
        console.info('[Supabase Sync] Successfully synced user to Supabase:', user.clubEmail);
      }
    } catch (err) {
      console.warn('[Supabase Sync] users exception:', err.message);
    }
  },

  updateUserPassword: async (clubEmail, newPassword) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPassword, password_changed: true })
        .eq('assigned_club_email', clubEmail.toLowerCase());

      if (error) console.warn('[Supabase Sync] password update note:', error.message);
    } catch (err) {
      console.warn('[Supabase Sync] password update exception:', err.message);
    }
  },

  // --- 3. MEMBERS ROSTER ---
  syncMember: async (clubId, member) => {
    if (!supabase) return;
    try {
      const payload = {
        id: member.id,
        club_id: clubId,
        name: member.name,
        email: member.email,
        personal_email: member.personalEmail || '',
        student_id: member.studentId || '',
        department: member.dept || '',
        membership_type: member.type || 'Standard Member',
        start_date: member.startDate || new Date().toISOString().split('T')[0],
        expiry_date: member.exp || new Date().toISOString().split('T')[0],
        is_paid: Boolean(member.paid),
        status: member.status || 'Active'
      };

      await supabase.from('members').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] members exception:', err.message);
    }
  },

  // --- 4. EVENTS ---
  syncEvent: async (clubId, event) => {
    if (!supabase) return;
    try {
      const payload = {
        id: event.id,
        club_id: clubId,
        title: event.title,
        category: event.category || 'Workshop',
        event_date: event.date,
        event_time: event.time || '10:00 AM',
        location: event.location || 'Campus Center',
        capacity: Number(event.capacity) || 100,
        sold_count: Number(event.sold) || 0,
        member_price: Number(event.memberPrice) || 0,
        non_member_price: Number(event.nonMemberPrice) || 150,
        status: event.status || 'Published',
        description: event.description || ''
      };

      await supabase.from('events').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] events exception:', err.message);
    }
  },

  // --- 5. TICKETS & ATTENDANCE ---
  syncTicket: async (clubId, ticket) => {
    if (!supabase) return;
    try {
      const payload = {
        id: ticket.id,
        club_id: clubId,
        event_id: ticket.eventId,
        attendee_name: ticket.attendeeName,
        attendee_email: ticket.email,
        is_member: Boolean(ticket.isMember),
        price_paid: Number(ticket.pricePaid) || 0,
        status: ticket.status || 'Valid',
        seat_identifier: ticket.seat || '',
        qr_token: ticket.qrToken || ticket.id,
        payment_id: ticket.paymentId || ''
      };

      await supabase.from('tickets').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] tickets exception:', err.message);
    }
  },

  // --- 6. TASKS (KANBAN) ---
  syncTask: async (clubId, task) => {
    if (!supabase) return;
    try {
      const payload = {
        id: task.id,
        club_id: clubId,
        title: task.title,
        owner_name: task.owner || 'Unassigned',
        deadline: task.deadline || new Date().toISOString().split('T')[0],
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        progress_pct: Number(task.progress) || 0,
        notes: task.notes || ''
      };

      await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] tasks exception:', err.message);
    }
  },

  // --- 7. FINANCIAL TRANSACTIONS ---
  syncFinancialTxn: async (clubId, txn) => {
    if (!supabase) return;
    try {
      const payload = {
        id: txn.id || `TXN-${Date.now().toString(36)}`,
        club_id: clubId,
        type: txn.type || 'EXPENSE',
        category: txn.category || 'Operations',
        title: txn.title || 'Ledger Entry',
        amount: Number(txn.amount) || 0,
        approved_by: txn.approvedBy || 'Treasurer'
      };

      await supabase.from('financial_ledger').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] financial_ledger exception:', err.message);
    }
  },

  // --- 8. VOLUNTEERS & SERVICE HOURS (Database Sync) ---
  syncVolunteer: async (clubId, volunteer) => {
    if (!supabase) return;
    try {
      const payload = {
        id: volunteer.id,
        club_id: clubId,
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone || '',
        role_title: volunteer.roleTitle || 'Volunteer',
        service_hours: Number(volunteer.hours || volunteer.service_hours) || 0,
        badge_tier: volunteer.badge || 'Bronze Contributor',
        rating: Number(volunteer.rating) || 5.0,
        skills: volunteer.skills || []
      };

      await supabase.from('volunteers').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] volunteer sync note:', err.message);
    }
  },

  // --- 9. EXPENSE REIMBURSEMENTS (Database Sync) ---
  syncReimbursement: async (clubId, reimb) => {
    if (!supabase) return;
    try {
      const payload = {
        id: reimb.id,
        club_id: clubId,
        volunteer_name: reimb.volunteerName,
        volunteer_email: reimb.volunteerEmail,
        category: reimb.category,
        event_title: reimb.event || '',
        amount: Number(reimb.amount) || 0,
        claim_date: reimb.date || new Date().toISOString().split('T')[0],
        description: reimb.description || '',
        receipt_url: reimb.receiptUrl || '',
        status: reimb.status || 'Submitted',
        approved_by: reimb.approver || ''
      };

      await supabase.from('reimbursements').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Sync] reimbursement sync note:', err.message);
    }
  },

  // --- 10. INITIAL CLOUD HYDRATION ---
  fetchCloudDatabase: async () => {
    if (!supabase) return null;
    try {
      const [clubsRes, usersRes, eventsRes, tasksRes, volsRes, reimbsRes] = await Promise.all([
        supabase.from('clubs').select('*'),
        supabase.from('users').select('*'),
        supabase.from('events').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('volunteers').select('*'),
        supabase.from('reimbursements').select('*')
      ]);

      return {
        clubs: clubsRes.data || [],
        users: usersRes.data || [],
        events: eventsRes.data || [],
        tasks: tasksRes.data || [],
        volunteers: volsRes?.data || [],
        reimbursements: reimbsRes?.data || []
      };
    } catch (err) {
      console.warn('[Supabase Sync] Cloud fetch note:', err.message);
      return null;
    }
  }
};
