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
if (typeof window !== 'undefined') {
  window.dbInstance = dbInstance;
}
