// ==========================================================================
// ClubSphere In-Memory + LocalStorage Database
// Multi-Tenant Clean Relational Database Engine with User Registry
// ==========================================================================

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

// Updated storage key to ensure 100% sync with users table
const STORAGE_KEY = 'clubsphere_live_db_v5';

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
    events: [],
    merchandise: [],
    tasks: [],
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
    membershipTypes: [
      { id: '10000000-0000-0000-0000-000000000004', name: 'Sports Athlete Pass', price: 499, duration_months: 12, benefits: 'Tournaments & Team Kit' }
    ],
    finance: { totalIncome: 0, totalExpenses: 0, netBalance: 0, incomeSources: [], expensesList: [] },
    stats: { membersCount: 0 }
  }
};

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
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const clubs = (parsed.clubs && Object.keys(parsed.clubs).length > 0)
          ? parsed.clubs
          : JSON.parse(JSON.stringify(INITIAL_CLUBS_DATA));
        return {
          clubs: parsed.clubs || {},
          users: parsed.users || [],
          platform: parsed.platform || JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)),
          auditLogs: parsed.auditLogs || [],
          notifications: parsed.notifications || []
        };
      }
    } catch (e) {
      console.warn('LocalStorage error, initializing fresh database state', e);
    }
    return {
      clubs: JSON.parse(JSON.stringify(INITIAL_CLUBS_DATA)),
      users: JSON.parse(JSON.stringify(INITIAL_USERS_DATA)),
      platform: JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)),
      auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
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
      clubs: JSON.parse(JSON.stringify(INITIAL_CLUBS_DATA)),
      users: JSON.parse(JSON.stringify(INITIAL_USERS_DATA)),
      platform: JSON.parse(JSON.stringify(INITIAL_PLATFORM_DATA)),
      auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
      notifications: []
    };
    this.save();
  }

  getClub(orgId) {
    if (!orgId) throw new Error('Club ID required');
    if (!this.data.clubs[orgId]) {
      if (INITIAL_CLUBS_DATA[orgId]) {
        this.data.clubs[orgId] = JSON.parse(JSON.stringify(INITIAL_CLUBS_DATA[orgId]));
        this.save();
      } else {
        const first = Object.keys(this.data.clubs)[0];
        if (first) return this.data.clubs[first];
        throw new Error(`Club "${orgId}" not found or unauthorized (Tenant Isolation Rule).`);
      }
    }
    return this.data.clubs[orgId];
  }

  getAllUsers() {
    if (!this.data.users) this.data.users = [];
    return [...this.data.users];
  }

  findUserByClubEmail(email) {
    if (!this.data.users) this.data.users = [];
    const clean = (email || '').trim().toLowerCase();
    return this.data.users.find(u => u.clubEmail.toLowerCase() === clean);
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
