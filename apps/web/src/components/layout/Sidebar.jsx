import React from 'react';
import {
  CreditCard,
  Calendar,
  Ticket,
  ShoppingBag,
  Package,
  Award,
  Megaphone,
  MessageSquare,
  CheckSquare,
  Clock,
  Receipt,
  Trophy,
  QrCode,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Sparkles,
  Shield,
  FileText,
  HeartHandshake,
  Settings,
  Building,
  Layers,
  Palette,
  Activity,
  UserCheck,
  Zap,
  Gift
} from 'lucide-react';

export const Sidebar = ({
  role = 'admin',
  activeTab,
  onSelectTab,
  clubName = 'Tech Club'
}) => {
  // Navigation config per role strictly according to Section 2 of prototype plan
  const navConfigs = {
    student: [
      { id: 'my-membership', label: 'My Membership Card', icon: CreditCard, badge: 'QR ID' },
      { id: 'browse-events', label: 'Browse Events', icon: Calendar },
      { id: 'my-tickets', label: 'My Tickets', icon: Ticket },
      { id: 'merch-shop', label: 'Merch Shop', icon: ShoppingBag, badge: 'New' },
      { id: 'my-orders', label: 'My Orders', icon: Package },
      { id: 'my-certificates', label: 'My Certificates', icon: Award },
      { id: 'announcements-feed', label: 'Announcements', icon: Megaphone },
      { id: 'feedback', label: 'Event Feedback', icon: MessageSquare }
    ],

    volunteer: [
      { id: 'tasks-kanban', label: 'My Tasks & Kanban', icon: CheckSquare, badge: 'Active' },
      { id: 'volunteer-portal', label: 'Log Hours & Profile', icon: Clock },
      { id: 'my-reimbursements', label: 'My Reimbursements', icon: Receipt },
      { id: 'leaderboard', label: 'Leaderboard & Badges', icon: Trophy, badge: 'Top 3' },
      { id: 'announcements-feed', label: 'Announcements', icon: Megaphone }
    ],

    event_manager: [
      { id: 'events-list', label: 'Events & Creation', icon: Calendar },
      { id: 'qr-checkin', label: 'QR Scanner Check-in', icon: QrCode, badge: 'Live' },
      { id: 'attendance', label: 'Attendance & Stats', icon: UserCheck },
      { id: 'event-profit', label: 'Event Profitability', icon: TrendingUp },
      { id: 'reports-hub', label: 'Event Reports', icon: BarChart3 },
      { id: 'feedback', label: 'Feedback Analytics', icon: MessageSquare },
      { id: 'announcements-mgmt', label: 'Announcements', icon: Megaphone }
    ],

    treasurer: [
      { id: 'financial-dash', label: 'Financial Dashboard', icon: DollarSign, badge: 'Ledger' },
      { id: 'income-ledger', label: 'Income Sources', icon: TrendingUp },
      { id: 'expenses-ledger', label: 'Expenses Tracker', icon: Receipt },
      { id: 'reimbursements-mgmt', label: 'Reimbursement Approval', icon: CheckSquare, badge: 'Pending' },
      { id: 'budget-mgmt', label: 'Budget Allocation', icon: BarChart3 },
      { id: 'sponsors', label: 'Sponsors & Contracts', icon: Building },
      { id: 'donations', label: 'Donations & Receipts', icon: Gift },
      { id: 'reports-hub', label: 'Financial Statements', icon: FileText }
    ],

    admin: [
      { id: 'club-dash', label: 'Club Dashboard', icon: Activity },
      { id: 'members-list', label: 'Members & Roster', icon: Users, badge: 'Active' },
      { id: 'member-verify', label: 'Member Verification', icon: QrCode },
      { id: 'events-list', label: 'Events Management', icon: Calendar },
      { id: 'inventory', label: 'Merch & Inventory POS', icon: ShoppingBag },
      { id: 'fundraisers', label: 'Fundraisers & Tasks', icon: HeartHandshake },
      { id: 'volunteers-list', label: 'Volunteers Roster', icon: Clock },
      { id: 'financial-dash', label: 'Finance & Ledger', icon: DollarSign },
      { id: 'reports-hub', label: 'Reports & Analytics', icon: BarChart3 },
      { id: 'announcements-mgmt', label: 'Announcements & Mailing', icon: Megaphone },
      { id: 'sponsors', label: 'Sponsors & Donations', icon: Building },
      { id: 'certificates-mgmt', label: 'Certificates Generator', icon: Award },
      { id: 'ai-copilot', label: 'AI Copilot & Planner', icon: Sparkles, badge: 'AI' },
      { id: 'audit-log', label: 'Audit Log Trail', icon: Shield },
      { id: 'settings', label: 'Club Settings & Plans', icon: Settings }
    ],

    super_admin: [
      { id: 'saas-orgs', label: 'Organizations & Hierarchy', icon: Building, badge: 'Multi-Tenant' },
      { id: 'saas-plans', label: 'Subscription Plans', icon: Layers },
      { id: 'saas-analytics', label: 'Platform Analytics', icon: BarChart3 },
      { id: 'saas-modules', label: 'Modules & Feature Toggles', icon: Zap },
      { id: 'audit-log', label: 'Global Audit Trail', icon: Shield },
      { id: 'settings', label: 'Integrations & System Health', icon: Settings }
    ]
  };

  const navItems = navConfigs[role] || navConfigs.admin;

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#FFFFFF',
        borderRight: '3px solid #121212',
        minHeight: 'calc(100vh - 74px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 12px'
      }}
    >
      <div>
        {/* Role Scope Header */}
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '12px',
            backgroundColor: '#FAF5EE',
            border: '2px solid #121212',
            borderRadius: '12px',
            boxShadow: '2px 2px 0px #121212'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>
            Role Viewport
          </div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--ink)' }}>
            {role === 'super_admin' ? 'Platform SaaS Root' : clubName}
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: isActive ? '2px solid #121212' : '2px solid transparent',
                  backgroundColor: isActive ? 'var(--accent-yellow)' : 'transparent',
                  boxShadow: isActive ? '3px 3px 0px #121212' : 'none',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-subheading)',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                  transform: isActive ? 'translate(-1px, -1px)' : 'none'
                }}
              >
                <Icon size={16} strokeWidth={2.5} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 900,
                      backgroundColor: isActive ? '#FFFFFF' : '#FAF5EE',
                      border: '1.5px solid #000',
                      borderRadius: '6px',
                      padding: '1px 5px'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
