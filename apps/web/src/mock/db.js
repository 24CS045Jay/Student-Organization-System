// ==========================================================================
// ClubSphere In-Memory + LocalStorage Database
// Multi-Tenant Clean Relational Database Engine with User Registry
// ==========================================================================

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

// Fresh storage key ensuring zero default mock clubs or demo credentials
const STORAGE_KEY = 'clubsphere_live_db_v7';

// Fresh initial database state with baseline campus organizations
export const INITIAL_CLUBS_DATA = {
  tech: {
    id: 'tech',
    name: 'CHARUSAT Tech Club',
    short: 'Tech Club',
    prefix: 'TC',
    category: 'Technical',
    color: '#FFE853',
    accentColor: '#FFE853',
    emailDomain: '@tech.campus.edu',
    members: [],
    events: [
      {
        id: 'ev-tc-01',
        title: 'CHARUSAT 24h Hackathon 2026',
        category: 'Hackathon',
        date: '2026-10-18',
        time: '09:00 AM',
        location: 'Central Computing Lab & Auditorium B',
        capacity: 200,
        sold: 64,
        memberPrice: 150,
        nonMemberPrice: 350,
        status: 'Published',
        description: '24 hours of non-stop innovation, building AI agents and full-stack solutions with top mentors & prize pool of ₹1,00,000.',
        deadline: '2026-10-17 23:59',
        organizer: 'Tech Club Executive Team',
        bannerGradient: 'linear-gradient(135deg, #FFE853 0%, #FF70A6 100%)',
        budget: { venue: 20000, food: 25000, prizes: 30000 },
        tags: ['Hackathon', 'AI', 'Coding']
      },
      {
        id: 'ev-tc-02',
        title: 'Generative AI & LLM Systems Workshop',
        category: 'Workshop',
        date: '2026-10-25',
        time: '02:00 PM',
        location: 'Lab 402, CSPIT IT Building',
        capacity: 80,
        sold: 45,
        memberPrice: 0,
        nonMemberPrice: 150,
        status: 'Published',
        description: 'Hands-on bootcamp on fine-tuning open-source LLMs, building RAG pipelines, and deploying containerized models.',
        deadline: '2026-10-24 23:59',
        organizer: 'AI & Data Science SIG',
        bannerGradient: 'linear-gradient(135deg, #70D6FF 0%, #C8B6FF 100%)',
        budget: { venue: 5000, snacks: 4000 },
        tags: ['Workshop', 'GenAI', 'LLM']
      }
    ],
    merchandise: [],
    tasks: [],
    orders: [],
    tickets: [],
    fundraisers: [],
    sponsors: [],
    donations: [],
    certificates: [],
    feedback: [
      {
        id: 'fb-tc-01',
        eventTitle: 'CHARUSAT 24h Hackathon 2026',
        ratings: { overall: 5, speaker: 5, content: 5, venue: 5, organization: 5 },
        comment: 'The mentor guidance and cloud infrastructure were top notch! Seamless QR gate entry too.',
        author: 'Jay Barot (24CS045)',
        date: '2026-10-02'
      },
      {
        id: 'fb-tc-02',
        eventTitle: 'Generative AI & LLM Systems Workshop',
        ratings: { overall: 5, speaker: 5, content: 5, venue: 4, organization: 5 },
        comment: 'Hands-on coding exercises with transformer models were super practical.',
        author: 'Diya Patel (24IT012)',
        date: '2026-09-28'
      }
    ],
    volunteers: [
      {
        id: 'VOL-TC-01',
        name: 'Jay Barot',
        email: 'jay.volunteer@tech.campus.edu',
        phone: '+91 98250 11223',
        roleTitle: 'Technical Operations Volunteer',
        hours: 56,
        service_hours: 56,
        badge: 'Silver Contributor (50h+)',
        rating: 4.9,
        skills: ['Event Logistics', 'Gate Registration', 'Stage AV'],
        activeTasks: 3
      },
      {
        id: 'VOL-TC-02',
        name: 'Param Joshi',
        email: 'param.v@tech.campus.edu',
        phone: '+91 98765 43210',
        roleTitle: 'Event Logistics Volunteer',
        hours: 32,
        service_hours: 32,
        badge: 'Bronze Contributor (25h+)',
        rating: 4.8,
        skills: ['Audio/Visual', 'Equipment Setup'],
        activeTasks: 1
      }
    ],
    reimbursements: [
      {
        id: 'REIMB-TC-101',
        volunteerName: 'Jay Barot',
        volunteerEmail: 'jay.volunteer@tech.campus.edu',
        category: 'Supplies & Printing',
        event: 'CHARUSAT 24h Hackathon 2026',
        amount: 1800,
        date: '2026-10-02',
        description: 'Lanyards, badge printing, and extension cords',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        status: 'Manager Approved',
        approver: 'Event Manager',
        notes: 'Official GST invoice verified'
      }
    ],
    announcements: [
      {
        id: 'ANN-TC-01',
        title: 'Volunteer Briefing for CHARUSAT Hackathon 2026',
        audience: 'All Members & Students',
        channels: ['In-app', 'Email'],
        content: 'All volunteers please assemble at Central Computing Lab at 8:30 AM this Saturday.',
        date: '2026-10-02',
        author: 'Club Admin',
        reach: 120
      }
    ],
    membershipTypes: [
      { id: '10000000-0000-0000-0000-000000000001', name: 'Standard Member', price: 499, duration_months: 12, benefits: 'Workshops & Hackathons' },
      { id: '10000000-0000-0000-0000-000000000002', name: 'Premium Member', price: 999, duration_months: 12, benefits: 'VIP pass, swag & mentor 1-on-1' }
    ],
    finance: { totalIncome: 0, totalExpenses: 0, netBalance: 0, incomeSources: [], expensesList: [] },
    stats: { membersCount: 0 }
  },
  cult: {
    id: 'cult',
    name: 'CHARUSAT Cultural Society',
    short: 'Cultural Society',
    prefix: 'CC',
    category: 'Cultural',
    color: '#FF70A6',
    accentColor: '#FF70A6',
    emailDomain: '@cultural.campus.edu',
    members: [],
    events: [],
    merchandise: [],
    tasks: [],
    orders: [],
    tickets: [],
    fundraisers: [],
    sponsors: [],
    donations: [],
    certificates: [],
    feedback: [],
    volunteers: [
      {
        id: 'VOL-CC-01',
        name: 'Diya Patel',
        email: 'diya.v@cultural.campus.edu',
        phone: '+91 99123 45678',
        roleTitle: 'Hospitality Volunteer',
        hours: 42,
        service_hours: 42,
        badge: 'Bronze Contributor (25h+)',
        rating: 4.95,
        skills: ['Hospitality', 'Stage Management'],
        activeTasks: 2
      }
    ],
    reimbursements: [],
    announcements: [],
    membershipTypes: [
      { id: '10000000-0000-0000-0000-000000000003', name: 'Standard Arts Member', price: 499, duration_months: 12, benefits: 'Concerts & Art Exhibitions' }
    ],
    finance: { totalIncome: 0, totalExpenses: 0, netBalance: 0, incomeSources: [], expensesList: [] },
    stats: { membersCount: 0 }
  },
  sport: {
    id: 'sport',
    name: 'CHARUSAT Sports Council',
    short: 'Sports Council',
    prefix: 'SC',
    category: 'Sports',
    color: '#70D6FF',
    accentColor: '#70D6FF',
    emailDomain: '@sports.campus.edu',
    members: [],
    events: [],
    merchandise: [],
    tasks: [],
    orders: [],
    tickets: [],
    fundraisers: [],
    sponsors: [],
    donations: [],
    certificates: [],
    feedback: [],
    volunteers: [],
    reimbursements: [],
    announcements: [],
    membershipTypes: [
      { id: '10000000-0000-0000-0000-000000000004', name: 'Sports Athlete Pass', price: 499, duration_months: 12, benefits: 'Tournaments & Team Kit' }
    ],
    finance: { totalIncome: 0, totalExpenses: 0, netBalance: 0, incomeSources: [], expensesList: [] },
    stats: { membersCount: 0 }
  }
};
// Zero default clubs by default - only clubs created by user/super admin exist
export const INITIAL_CLUBS_DATA = {};

// Fresh initial users table
export const INITIAL_USERS_DATA = [];

export const INITIAL_PLATFORM_DATA = {
  organizations: [],
  plans: [
    { id: 'plan-free', name: 'Community Free', price: 0, memberLimit: 50, eventLimit: 2, commissionPercent: 5, features: ['Basic Member Roster', '1 Event per month', 'Manual Tickets', 'Standard Support'], activeOrgs: 0 },
    { id: 'plan-pro', name: 'Professional Club', price: 1999, billing: '/month', memberLimit: 500, eventLimit: 10, commissionPercent: 2, features: ['Unlimited Members', 'QR Fast Check-in', 'Merchandise Shop', 'Kanban Task Board', 'Certificates & QR', 'Priority Email Support'], activeOrgs: 0 },
    { id: 'plan-ent', name: 'Enterprise SaaS', price: 4999, billing: '/month', memberLimit: 5000, eventLimit: 50, commissionPercent: 0.5, features: ['All Pro Features', 'Multi-College Hierarchy', 'AI Copilot & Event Planner', 'Financial Audit Ledger', 'Dedicated Tenant DB', 'Custom Domain & SSO'], activeOrgs: 0 }
  ],
  modules: [
    { id: 'mod-qr', name: 'Fast QR Check-in & Hardware Sync', category: 'Ticketing', enabled: true, tier: 'Professional' },
    { id: 'mod-merch', name: 'Variant Merchandise & Inventory POS', category: 'Commerce', enabled: true, tier: 'Professional' },
    { id: 'mod-ai', name: 'AI Financial Assistant & Event Planner', category: 'Intelligence', enabled: true, tier: 'Enterprise' },
    { id: 'mod-gamify', name: 'Volunteer Gamification & Badges', category: 'Engagement', enabled: true, tier: 'Professional' },
    { id: 'mod-sponsors', name: 'Sponsorship & Contract Management', category: 'Finance', enabled: true, tier: 'Enterprise' },
    { id: 'mod-audit', name: 'Immutable Financial Audit Trail', category: 'Compliance', enabled: true, tier: 'Enterprise' }
  ],
  analytics: {
    totalTenants: 0,
    activeStudents: 0,
    grossPlatformTicketRevenue: 0,
    systemUptime: '99.99%',
    avgResponseTime: '120ms',
    serverLoad: '5%'
  }
};

export const INITIAL_AUDIT_LOGS = [];

// In-memory Database Instance with Reactive LocalStorage Synchronization
class MockDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      // Check current or previous storage versions to migrate only real user-created clubs
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('clubsphere_live_db_v6') || localStorage.getItem('clubsphere_live_db_v5');
      if (raw) {
        const parsed = JSON.parse(raw);
        const clubs = { ...(parsed.clubs || {}) };

        // Explicitly purge legacy default CHARUSAT clubs
        delete clubs.tech;
        delete clubs.cult;
        delete clubs.sport;

        // Purge any users associated with legacy default clubs
        const users = (parsed.users || []).filter(u => u.orgId !== 'tech' && u.orgId !== 'cult' && u.orgId !== 'sport');

        return {
          clubs,
          users,
          platform: parsed.platform || JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)),
          auditLogs: parsed.auditLogs || [],
          notifications: parsed.notifications || []
        };
      }
    } catch (e) {
      console.warn('LocalStorage error, initializing fresh database state', e);
    }
    return {
      clubs: {},
      users: [],
      platform: JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)),
      auditLogs: [],
      notifications: []
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  reset() {
    this.data = {
      clubs: {},
      users: [],
      platform: JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)),
      auditLogs: [],
      notifications: []
    };
    this.save();
  }

  hydrateFromCloud(cloudData) {
    if (!cloudData) return false;
    let modified = false;

    // 1. Hydrate Clubs
    if (cloudData.clubs && cloudData.clubs.length > 0) {
      cloudData.clubs.forEach(cloudClub => {
        if (!this.data.clubs[cloudClub.id]) {
          // Initialize empty skeleton if it doesn't exist
          this.data.clubs[cloudClub.id] = {
            id: cloudClub.id,
            name: cloudClub.name,
            short: cloudClub.short_name,
            prefix: cloudClub.prefix,
            category: cloudClub.category,
            department: cloudClub.department,
            color: cloudClub.brand_color,
            emailDomain: cloudClub.email_domain,
            members: [], events: [], merchandise: [], tasks: [], 
            finance: { totalIncome: cloudClub.initial_grant || 0, totalExpenses: 0, netBalance: cloudClub.initial_grant || 0, incomeSources: [], expensesList: [] },
            stats: { membersCount: 0 },
            membershipTypes: []
          };
        } else {
          // Update basic info
          this.data.clubs[cloudClub.id].name = cloudClub.name;
          this.data.clubs[cloudClub.id].short = cloudClub.short_name;
        }
      });
      modified = true;
    }

    // 2. Hydrate Users
    if (cloudData.users && cloudData.users.length > 0) {
      this.data.users = cloudData.users.map(u => ({
        id: u.id,
        orgId: u.club_id,
        name: u.name,
        personalEmail: u.personal_email,
        clubEmail: u.assigned_club_email,
        password: u.password_hash,
        role: u.role,
        studentRollNo: u.student_roll_no,
        department: u.department,
        passwordChanged: u.password_changed
      }));
      modified = true;
    }

    // 3. Hydrate Events
    if (cloudData.events && cloudData.events.length > 0) {
      cloudData.events.forEach(cloudEv => {
        const club = this.data.clubs[cloudEv.club_id];
        if (club) {
          const existingIdx = club.events.findIndex(e => e.id === cloudEv.id);
          const mappedEv = {
            id: cloudEv.id,
            title: cloudEv.title,
            category: cloudEv.category,
            date: cloudEv.date,
            time: cloudEv.time,
            location: cloudEv.location,
            capacity: cloudEv.capacity,
            memberPrice: cloudEv.member_price,
            nonMemberPrice: cloudEv.non_member_price,
            status: cloudEv.status,
            description: cloudEv.description
          };
          if (existingIdx >= 0) {
            club.events[existingIdx] = { ...club.events[existingIdx], ...mappedEv };
          } else {
            // New event from cloud
            mappedEv.sold = 0;
            club.events.unshift(mappedEv);
          }
        }
      });
      modified = true;
    }

    // 4. Hydrate Tasks
    if (cloudData.tasks && cloudData.tasks.length > 0) {
      cloudData.tasks.forEach(cloudTask => {
        const club = this.data.clubs[cloudTask.club_id];
        if (club) {
          const existingIdx = club.tasks.findIndex(t => t.id === cloudTask.id);
          const mappedTask = {
            id: cloudTask.id,
            title: cloudTask.title,
            owner: cloudTask.owner_name,
            deadline: cloudTask.deadline,
            priority: cloudTask.priority,
            status: cloudTask.status,
            progress: cloudTask.progress_pct,
            notes: cloudTask.notes
          };
          if (existingIdx >= 0) {
            club.tasks[existingIdx] = { ...club.tasks[existingIdx], ...mappedTask };
          } else {
            club.tasks.unshift(mappedTask);
          }
        }
      });
      modified = true;
    }

    if (modified) this.save();
    return modified;
  }

  getClub(orgId) {
    if (!orgId) throw new Error('Club ID required');
    if (!this.data.clubs[orgId]) {
      const first = Object.keys(this.data.clubs)[0];
      if (first) return this.data.clubs[first];
      throw new Error(`Club "${orgId}" not found. Please create this club first in the Super Admin portal.`);
    }
    const club = this.data.clubs[orgId];
    // Safeguard all relational collections against undefined
    if (!club.volunteers) club.volunteers = [];
    if (!club.reimbursements) club.reimbursements = [];
    if (!club.announcements) club.announcements = [];
    if (!club.tasks) club.tasks = [];
    if (!club.members) club.members = [];
    if (!club.events) club.events = [];
    if (!club.merchandise) club.merchandise = [];
    if (!club.orders) club.orders = [];
    if (!club.tickets) club.tickets = [];
    if (!club.fundraisers) club.fundraisers = [];
    if (!club.sponsors) club.sponsors = [];
    if (!club.donations) club.donations = [];
    if (!club.certificates) club.certificates = [];
    if (!club.feedback) club.feedback = [];
    if (!club.finance) {
      club.finance = { totalIncome: 0, totalExpenses: 0, netBalance: 0, incomeSources: [], expensesList: [] };
    }
    return club;
  }

  getAllUsers() {
    if (!this.data.users) this.data.users = [];
    return [...this.data.users];
  }

  findUserByClubEmail(email) {
    if (!this.data.users) this.data.users = [];
    const clean = (email || '').trim().toLowerCase();
    return this.data.users.find(u => u.clubEmail?.toLowerCase() === clean);
  }

  findUserByPersonalEmail(email, orgId = null) {
    if (!this.data.users) this.data.users = [];
    const clean = (email || '').trim().toLowerCase();
    return this.data.users.find(u => 
      u.personalEmail?.toLowerCase() === clean && (!orgId || u.orgId === orgId)
    );
  }

  logAudit(orgId, user, role, action, details, oldValue = '', newValue = '') {
    const entry = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      orgId,
      user: user || 'Anonymous',
      role: role || 'User',
      action,
      details,
      oldValue: String(oldValue),
      newValue: String(newValue),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ', Today'
    };
    if (!this.data.auditLogs) this.data.auditLogs = [];
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 100) this.data.auditLogs.pop();
    this.save();
    return entry;
  }
}

export const dbInstance = new MockDatabase();
if (typeof window !== 'undefined') {
  window.dbInstance = dbInstance;
}
