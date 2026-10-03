import {
  Member,
  Membership,
  MembershipType,
  MemberVerificationResult,
  DigitalCardData,
  RegisterMembershipInput,
  RenewMembershipInput,
  CreateMembershipTypeInput
} from 'shared';

// In-memory tenant store initialized with demo data for Tech Club, Cultural Club, and Sports Club
interface ClubMembershipData {
  orgId: string;
  slug: string;
  name: string;
  prefix: string;
  sequence: number;
  types: MembershipType[];
  members: (Member & {
    activeMembership?: Membership;
    history?: Array<{ date: string; action: string; amt: number }>;
  })[];
  memberships: Membership[];
  reminders: Array<{
    id: string;
    membership_id: string;
    days_before: number;
    sent_at: string;
    channel: string;
  }>;
}

const mockDb: Record<string, ClubMembershipData> = {
  'tech-club': {
    orgId: 'org-tech-001',
    slug: 'tech-club',
    name: 'Tech Club',
    prefix: 'TC',
    sequence: 3,
    types: [
      {
        id: 'type-tc-001',
        org_id: 'org-tech-001',
        name: 'Standard Member',
        price: 49900, // ₹499
        duration_months: 12,
        benefits: 'Access to general workshops, hackathons, discord channels',
        ticket_discount_pct: 15,
        merch_discount_pct: 10,
        active: true,
        created_at: new Date('2026-01-01').toISOString()
      },
      {
        id: 'type-tc-002',
        org_id: 'org-tech-001',
        name: 'Premium Member',
        price: 99900, // ₹999
        duration_months: 12,
        benefits: 'All standard perks + priority workshop seats + 1 free club t-shirt',
        ticket_discount_pct: 25,
        merch_discount_pct: 20,
        active: true,
        created_at: new Date('2026-01-01').toISOString()
      }
    ],
    members: [
      {
        id: 'mem-tc-001',
        org_id: 'org-tech-001',
        user_id: 'user-001',
        full_name: 'Aarav Patel',
        email: 'aarav@techclub.edu',
        phone: '+91 98765 43210',
        student_id: '24CS001',
        department_id: null,
        skills: ['React', 'Python', 'Cybersecurity'],
        availability: { weekends: true, evenings: true },
        mailing_subscribed: true,
        created_at: '2026-01-10T10:00:00Z',
        activeMembership: {
          id: 'ms-tc-001',
          org_id: 'org-tech-001',
          member_id: 'mem-tc-001',
          type_id: 'type-tc-002',
          membership_no: 'TC-001',
          status: 'active',
          dues: 'paid',
          starts_on: '2026-01-10',
          expires_on: '2027-01-10',
          qr_secret: 'sec_tc_001_aarav',
          created_at: '2026-01-10T10:00:00Z'
        },
        history: [
          { date: '2026-01-10', action: 'Registered as Premium Member', amt: 999 }
        ]
      },
      {
        id: 'mem-tc-002',
        org_id: 'org-tech-001',
        user_id: null,
        full_name: 'Priya Sharma',
        email: 'priya@techclub.edu',
        phone: '+91 98765 43211',
        student_id: '24CS015',
        department_id: null,
        skills: ['Graphic Design', 'Figma'],
        availability: { weekends: true },
        mailing_subscribed: true,
        created_at: '2026-01-15T11:00:00Z',
        activeMembership: {
          id: 'ms-tc-002',
          org_id: 'org-tech-001',
          member_id: 'mem-tc-002',
          type_id: 'type-tc-001',
          membership_no: 'TC-002',
          status: 'active',
          dues: 'paid',
          starts_on: '2026-01-15',
          expires_on: '2027-01-15',
          qr_secret: 'sec_tc_002_priya',
          created_at: '2026-01-15T11:00:00Z'
        },
        history: [
          { date: '2026-01-15', action: 'Registered as Standard Member', amt: 499 }
        ]
      },
      {
        id: 'mem-tc-003',
        org_id: 'org-tech-001',
        user_id: null,
        full_name: 'Rohan Verma',
        email: 'rohan@techclub.edu',
        phone: '+91 98765 43212',
        student_id: '23CS090',
        department_id: null,
        skills: ['Java', 'C++'],
        availability: {},
        mailing_subscribed: false,
        created_at: '2025-01-05T09:00:00Z',
        activeMembership: {
          id: 'ms-tc-003',
          org_id: 'org-tech-001',
          member_id: 'mem-tc-003',
          type_id: 'type-tc-001',
          membership_no: 'TC-003',
          status: 'expired',
          dues: 'unpaid',
          starts_on: '2025-01-05',
          expires_on: '2026-01-05',
          qr_secret: 'sec_tc_003_rohan',
          created_at: '2025-01-05T09:00:00Z'
        },
        history: [
          { date: '2025-01-05', action: 'Registered as Standard Member', amt: 499 }
        ]
      }
    ],
    memberships: [],
    reminders: []
  },
  'cultural-club': {
    orgId: 'org-cult-002',
    slug: 'cultural-club',
    name: 'Cultural Club',
    prefix: 'CC',
    sequence: 1,
    types: [
      {
        id: 'type-cc-001',
        org_id: 'org-cult-002',
        name: 'Standard Artist',
        price: 39900,
        duration_months: 12,
        benefits: 'Access to theater workshops, music rooms',
        ticket_discount_pct: 20,
        merch_discount_pct: 10,
        active: true,
        created_at: new Date('2026-01-01').toISOString()
      }
    ],
    members: [
      {
        id: 'mem-cc-001',
        org_id: 'org-cult-002',
        user_id: 'user-002',
        full_name: 'Ananya Iyer',
        email: 'ananya@cultclub.edu',
        phone: '+91 91234 56789',
        student_id: '24IT005',
        department_id: null,
        skills: ['Vocals', 'Classical Dance'],
        availability: { evenings: true },
        mailing_subscribed: true,
        created_at: '2026-02-01T10:00:00Z',
        activeMembership: {
          id: 'ms-cc-001',
          org_id: 'org-cult-002',
          member_id: 'mem-cc-001',
          type_id: 'type-cc-001',
          membership_no: 'CC-001',
          status: 'active',
          dues: 'paid',
          starts_on: '2026-02-01',
          expires_on: '2027-02-01',
          qr_secret: 'sec_cc_001_ananya',
          created_at: '2026-02-01T10:00:00Z'
        },
        history: [
          { date: '2026-02-01', action: 'Enrolled as Standard Artist', amt: 399 }
        ]
      }
    ],
    memberships: [],
    reminders: []
  }
};

// Sync internal memberships collection
Object.values(mockDb).forEach((club) => {
  club.members.forEach((m) => {
    if (m.activeMembership) {
      club.memberships.push(m.activeMembership);
    }
  });
});

function getClubStore(orgKey: string): ClubMembershipData {
  const store = mockDb[orgKey] || Object.values(mockDb).find(c => c.orgId === orgKey || c.slug === orgKey);
  if (!store) {
    // dynamically initialize for new orgs
    mockDb[orgKey] = {
      orgId: orgKey,
      slug: orgKey,
      name: orgKey.replace('-', ' ').toUpperCase(),
      prefix: orgKey.substring(0, 3).toUpperCase(),
      sequence: 0,
      types: [
        {
          id: `type-${orgKey}-001`,
          org_id: orgKey,
          name: 'General Member',
          price: 49900,
          duration_months: 12,
          benefits: 'Club membership perks',
          ticket_discount_pct: 10,
          merch_discount_pct: 10,
          active: true
        }
      ],
      members: [],
      memberships: [],
      reminders: []
    };
    return mockDb[orgKey];
  }
  return store;
}

export const membershipService = {
  // 1. Membership Types
  listMembershipTypes(orgKey: string): MembershipType[] {
    const club = getClubStore(orgKey);
    return club.types.filter(t => t.active);
  },

  createMembershipType(orgKey: string, input: CreateMembershipTypeInput): MembershipType {
    const club = getClubStore(orgKey);
    const newType: MembershipType = {
      id: `type-${club.slug}-${Date.now()}`,
      org_id: club.orgId,
      ...input,
      active: true,
      created_at: new Date().toISOString()
    };
    club.types.push(newType);
    return newType;
  },

  // 2. Members List & CRUD
  listMembers(
    orgKey: string,
    query: {
      search?: string;
      status?: string;
      typeId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const club = getClubStore(orgKey);
    let list = club.members;

    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        m =>
          m.full_name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.student_id?.toLowerCase().includes(q) ||
          m.activeMembership?.membership_no.toLowerCase().includes(q)
      );
    }

    if (query.status && query.status !== 'ALL') {
      const s = query.status.toLowerCase();
      list = list.filter(m => m.activeMembership?.status === s);
    }

    if (query.typeId) {
      list = list.filter(m => m.activeMembership?.type_id === query.typeId);
    }

    const total = list.length;
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 50);
    const offset = (page - 1) * limit;
    const paginated = list.slice(offset, offset + limit);

    return {
      members: paginated.map(m => {
        const type = club.types.find(t => t.id === m.activeMembership?.type_id);
        return {
          ...m,
          membership_no: m.activeMembership?.membership_no || 'N/A',
          status: m.activeMembership?.status || 'inactive',
          dues: m.activeMembership?.dues || 'unpaid',
          type_name: type?.name || 'General Member',
          expires_on: m.activeMembership?.expires_on || null
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  getMemberById(orgKey: string, memberId: string) {
    const club = getClubStore(orgKey);
    const member = club.members.find(m => m.id === memberId || m.user_id === memberId);
    if (!member) return null;

    const type = club.types.find(t => t.id === member.activeMembership?.type_id);
    return {
      ...member,
      type_name: type?.name || 'General Member',
      type_details: type,
      history: member.history || []
    };
  },

  // 3. Register New Member (FR-01)
  registerMembership(orgKey: string, input: RegisterMembershipInput) {
    const club = getClubStore(orgKey);

    // Verify uniqueness of email in this org
    const existing = club.members.find(m => m.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      throw new Error(`Member with email ${input.email} already exists in ${club.name}`);
    }

    // Resolve membership type
    let type = club.types.find(t => t.id === input.type_id);
    if (!type && input.type_name) {
      type = club.types.find(t => t.name.toLowerCase().includes(input.type_name!.toLowerCase()));
    }
    if (!type) {
      type = club.types[0];
    }

    // Generate atomic sequence membership number
    club.sequence += 1;
    const membershipNo = `${club.prefix}-${String(club.sequence).padStart(3, '0')}`;

    const now = new Date();
    const startDate = input.starts_on ? new Date(input.starts_on) : now;
    const expDate = new Date(startDate);
    expDate.setMonth(expDate.getMonth() + (type.duration_months || 12));

    const memberId = `mem-${club.slug}-${Date.now()}`;
    const membershipId = `ms-${club.slug}-${Date.now()}`;
    const qrSecret = `sec_${club.slug}_${membershipNo}_${Math.random().toString(36).substring(2, 8)}`;

    const newMembership: Membership = {
      id: membershipId,
      org_id: club.orgId,
      member_id: memberId,
      type_id: type.id,
      membership_no: membershipNo,
      status: input.is_paid ? 'active' : 'pending',
      dues: input.is_paid ? 'paid' : 'unpaid',
      starts_on: startDate.toISOString().split('T')[0],
      expires_on: expDate.toISOString().split('T')[0],
      renewal_of: null,
      qr_secret: qrSecret,
      created_at: now.toISOString()
    };

    const newMember: Member & {
      activeMembership: Membership;
      history: Array<{ date: string; action: string; amt: number }>;
    } = {
      id: memberId,
      org_id: club.orgId,
      user_id: null,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
      student_id: input.student_id || null,
      department_id: input.department_id || null,
      skills: input.skills || [],
      availability: {},
      mailing_subscribed: true,
      created_at: now.toISOString(),
      activeMembership: newMembership,
      history: [
        {
          date: startDate.toISOString().split('T')[0],
          action: `Registered as ${type.name}`,
          amt: Math.round(type.price / 100)
        }
      ]
    };

    club.members.unshift(newMember);
    club.memberships.push(newMembership);

    return {
      member: newMember,
      membership: newMembership,
      type
    };
  },

  // 4. Renew Membership (FR-01, FR-20)
  renewMembership(orgKey: string, membershipIdOrMemberId: string, input: RenewMembershipInput) {
    const club = getClubStore(orgKey);

    const member = club.members.find(
      m => m.id === membershipIdOrMemberId || m.activeMembership?.id === membershipIdOrMemberId
    );
    if (!member || !member.activeMembership) {
      throw new Error('Membership record not found');
    }

    const currentMs = member.activeMembership;
    const durationMonths = input.duration_months || 12;
    const type = input.type_id
      ? club.types.find(t => t.id === input.type_id) || club.types[0]
      : club.types.find(t => t.id === currentMs.type_id) || club.types[0];

    const today = new Date();
    const currentExpiry = new Date(currentMs.expires_on);
    const baseDate = currentExpiry > today ? currentExpiry : today;
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

    // Update active membership
    const prevMsId = currentMs.id;
    currentMs.status = 'active';
    currentMs.dues = input.is_paid ? 'paid' : 'unpaid';
    currentMs.expires_on = newExpiry.toISOString().split('T')[0];
    currentMs.type_id = type.id;
    currentMs.renewal_of = prevMsId;

    if (!member.history) member.history = [];
    member.history.push({
      date: today.toISOString().split('T')[0],
      action: `Renewed Membership (${durationMonths} mo) - ${type.name}`,
      amt: Math.round(type.price / 100)
    });

    return {
      member,
      membership: currentMs,
      type
    };
  },

  // 5. Membership History
  getMembershipHistory(orgKey: string, memberId: string) {
    const club = getClubStore(orgKey);
    const member = club.members.find(m => m.id === memberId || m.user_id === memberId);
    if (!member) throw new Error('Member not found');

    return {
      member_id: member.id,
      full_name: member.full_name,
      membership_no: member.activeMembership?.membership_no,
      history: member.history || []
    };
  },

  // 6. Verify Member (FR-02, NFR-03 Strict Tenant Isolation)
  verifyMember(currentOrgKey: string, query: string): MemberVerificationResult {
    const cleanQuery = query.trim().toUpperCase();
    const currentClub = getClubStore(currentOrgKey);

    // 1. Search in current club
    const foundInCurrent = currentClub.members.find(m => {
      const ms = m.activeMembership;
      return (
        ms?.membership_no.toUpperCase() === cleanQuery ||
        ms?.qr_secret.toUpperCase() === cleanQuery ||
        m.student_id?.toUpperCase() === cleanQuery ||
        m.email.toUpperCase() === cleanQuery
      );
    });

    if (foundInCurrent && foundInCurrent.activeMembership) {
      const ms = foundInCurrent.activeMembership;
      const type = currentClub.types.find(t => t.id === ms.type_id) || currentClub.types[0];
      const isExpired = new Date(ms.expires_on) < new Date();

      if (ms.dues === 'unpaid') {
        return {
          valid: false,
          status: 'UNPAID',
          message: `Membership dues pending for ${foundInCurrent.full_name}`,
          membership: {
            membership_no: ms.membership_no,
            status: 'pending',
            dues: ms.dues,
            starts_on: ms.starts_on,
            expires_on: ms.expires_on,
            type_name: type.name,
            ticket_discount_pct: type.ticket_discount_pct,
            merch_discount_pct: type.merch_discount_pct
          },
          member: {
            full_name: foundInCurrent.full_name,
            email: foundInCurrent.email,
            student_id: foundInCurrent.student_id,
            org_id: currentClub.orgId,
            club_name: currentClub.name
          }
        };
      }

      if (isExpired || ms.status === 'expired') {
        return {
          valid: false,
          status: 'EXPIRED',
          message: `Membership expired on ${ms.expires_on}`,
          membership: {
            membership_no: ms.membership_no,
            status: 'expired',
            dues: ms.dues,
            starts_on: ms.starts_on,
            expires_on: ms.expires_on,
            type_name: type.name,
            ticket_discount_pct: type.ticket_discount_pct,
            merch_discount_pct: type.merch_discount_pct
          },
          member: {
            full_name: foundInCurrent.full_name,
            email: foundInCurrent.email,
            student_id: foundInCurrent.student_id,
            org_id: currentClub.orgId,
            club_name: currentClub.name
          }
        };
      }

      return {
        valid: true,
        status: 'ACTIVE',
        message: `Verified Active Member of ${currentClub.name}`,
        membership: {
          membership_no: ms.membership_no,
          status: 'active',
          dues: ms.dues,
          starts_on: ms.starts_on,
          expires_on: ms.expires_on,
          type_name: type.name,
          ticket_discount_pct: type.ticket_discount_pct,
          merch_discount_pct: type.merch_discount_pct
        },
        member: {
          full_name: foundInCurrent.full_name,
          email: foundInCurrent.email,
          student_id: foundInCurrent.student_id,
          phone: foundInCurrent.phone,
          org_id: currentClub.orgId,
          club_name: currentClub.name
        }
      };
    }

    // 2. Check if this member belongs to another club (Strict Tenant Leak Defense)
    for (const [key, otherClub] of Object.entries(mockDb)) {
      if (key !== currentOrgKey && otherClub.orgId !== currentClub.orgId) {
        const foundInOther = otherClub.members.find(m => {
          const ms = m.activeMembership;
          return (
            ms?.membership_no.toUpperCase() === cleanQuery ||
            ms?.qr_secret.toUpperCase() === cleanQuery ||
            m.student_id?.toUpperCase() === cleanQuery
          );
        });

        if (foundInOther) {
          return {
            valid: false,
            status: 'WRONG_CLUB',
            message: `Cross-Tenant Access Denied: Member belongs to ${otherClub.name}, not ${currentClub.name}!`,
            member: {
              full_name: foundInOther.full_name,
              email: '***@***', // Obfuscated to prevent data harvesting
              student_id: foundInOther.student_id,
              org_id: otherClub.orgId,
              club_name: otherClub.name
            }
          };
        }
      }
    }

    // 3. Not found anywhere
    return {
      valid: false,
      status: 'INVALID',
      message: 'Invalid Credential: No membership found matching query'
    };
  },

  // 7. Student Digital Pass / Card (FR-02)
  getDigitalCard(orgKey: string, userEmailOrId?: string): DigitalCardData {
    const club = getClubStore(orgKey);
    let member = club.members.find(
      m =>
        m.email.toLowerCase() === userEmailOrId?.toLowerCase() ||
        m.user_id === userEmailOrId ||
        m.id === userEmailOrId
    );

    if (!member) {
      member = club.members[0]; // fallback to demo primary member
    }

    const ms = member.activeMembership || {
      id: 'ms-none',
      org_id: club.orgId,
      member_id: member.id,
      type_id: club.types[0].id,
      membership_no: `${club.prefix}-999`,
      status: 'active' as const,
      dues: 'paid' as const,
      starts_on: '2026-01-01',
      expires_on: '2027-01-01',
      qr_secret: `sec_${member.id}`,
      created_at: new Date().toISOString()
    };

    const type = club.types.find(t => t.id === ms.type_id) || club.types[0];
    const isActive = ms.status === 'active' && new Date(ms.expires_on) >= new Date();

    return {
      membership_no: ms.membership_no,
      full_name: member.full_name,
      email: member.email,
      student_id: member.student_id,
      phone: member.phone,
      club_name: club.name,
      club_slug: club.slug,
      type_name: type.name,
      starts_on: ms.starts_on,
      expires_on: ms.expires_on,
      status: ms.status,
      dues: ms.dues,
      qr_token: ms.qr_secret,
      ticket_discount_pct: type.ticket_discount_pct,
      merch_discount_pct: type.merch_discount_pct,
      benefits: type.benefits,
      is_active: isActive
    };
  },

  // 8. Daily Expiry & Reminders Processor (Section 6.6 & 7)
  processDailyReminders(orgKey: string) {
    const club = getClubStore(orgKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expiredCount = 0;
    let remindersCreated = 0;
    const newReminders: any[] = [];

    club.members.forEach((m) => {
      const ms = m.activeMembership;
      if (!ms) return;

      const expDate = new Date(ms.expires_on);
      expDate.setHours(0, 0, 0, 0);

      // 1. Expire if past date
      if (ms.status === 'active' && expDate < today) {
        ms.status = 'expired';
        expiredCount += 1;
      }

      // 2. Reminder checks at 30, 15, and 3 days before expiry
      const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (ms.status === 'active' && [30, 15, 3].includes(diffDays)) {
        const alreadySent = club.reminders.some(
          r => r.membership_id === ms.id && r.days_before === diffDays
        );
        if (!alreadySent) {
          const reminderEntry = {
            id: `rem-${Date.now()}-${diffDays}`,
            membership_id: ms.id,
            days_before: diffDays,
            sent_at: new Date().toISOString(),
            channel: 'email'
          };
          club.reminders.push(reminderEntry);
          newReminders.push({
            ...reminderEntry,
            member_name: m.full_name,
            email: m.email,
            membership_no: ms.membership_no
          });
          remindersCreated += 1;
        }
      }
    });

    return {
      expired_count: expiredCount,
      reminders_created: remindersCreated,
      reminders: newReminders
    };
  }
};
