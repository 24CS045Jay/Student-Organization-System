import React, { useState, useEffect } from 'react';
import './styles/neo-brutalism.css';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { TenantForbidden403 } from './components/layout/TenantForbidden403';
import { AICopilotView } from './features/ai/AICopilotView';
import { notificationService } from './services/notificationService';

// Landing, Auth & Super Admin Creation Flows
import { LandingPageView } from './features/landing/LandingPageView';
import { AuthView } from './features/auth/AuthView';
import { SuperAdminClubCreationView } from './features/platform/SuperAdminClubCreationView';
import { PasswordUpdateModal } from './components/layout/PasswordUpdateModal';
import { QuickLoginModal } from './components/layout/QuickLoginModal';
import { supabaseSync } from './services/supabaseService';

// Features
import { MyMembershipView } from './features/membership/MyMembershipView';
import { MembersListView } from './features/membership/MembersListView';
import { MemberVerificationView } from './features/membership/MemberVerificationView';

import { BrowseEventsView } from './features/events/BrowseEventsView';
import { EventsManagerView } from './features/events/EventsManagerView';
import { MyTicketsView } from './features/events/MyTicketsView';
import { QRCheckinView } from './features/events/QRCheckinView';
import { AttendanceView } from './features/events/AttendanceView';

import { MerchShopView } from './features/merchandise/MerchShopView';
import { InventoryView } from './features/merchandise/InventoryView';
import { OrdersView } from './features/merchandise/OrdersView';

import { TasksKanbanView } from './features/volunteers/TasksKanbanView';
import { VolunteerPortalView } from './features/volunteers/VolunteerPortalView';
import { VolunteersListView } from './features/volunteers/VolunteersListView';
import { LeaderboardView } from './features/volunteers/LeaderboardView';
import { FundraisersView } from './features/volunteers/FundraisersView';

import { FinancialDashboardView } from './features/finance/FinancialDashboardView';
import { IncomeView } from './features/finance/IncomeView';
import { ExpensesView } from './features/finance/ExpensesView';
import { ReimbursementsView } from './features/finance/ReimbursementsView';
import { SponsorsView } from './features/finance/SponsorsView';
import { DonationsView } from './features/finance/DonationsView';

import { AnnouncementsView } from './features/communication/AnnouncementsView';
import { ReportsHubView } from './features/reports/ReportsHubView';
import { CertificatesView } from './features/certificates/CertificatesView';
import { FeedbackView } from './features/feedback/FeedbackView';

import { PlatformSuperAdminView } from './features/platform/PlatformSuperAdminView';
import { AuditLogView } from './features/audit/AuditLogView';
import { SettingsView } from './features/settings/SettingsView';
import { ClubDashboardView } from './features/dashboard/ClubDashboardView';

import { clubService } from './services/clubService';
import { dbInstance } from './mock/db';
import { Drawer, Modal, Badge, Button } from './components/ui/index';

export default function App() {
  // Public Pass Verification State (triggered if URL contains ?verify=...)
  const [publicVerifiedPass, setPublicVerifiedPass] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const v = p.get('verify') || p.get('ticket') || p.get('pass');
      if (v) return clubService.lookupPublicPass(v);
    } catch (e) {}
    return null;
  });

  // Session State (Stored in localStorage or null for landing page)
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('clubsphere_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.orgId === 'tech' || parsed?.orgId === 'cult' || parsed?.orgId === 'sport') {
          localStorage.removeItem('clubsphere_session');
          return null;
        }
        return parsed;
      }
    } catch (e) {}
    return null;
  });

  // Current view state: 'landing' | 'auth' | 'super-admin-club-creation' | 'app'
  const [viewState, setViewState] = useState(() => {
    try {
      const saved = localStorage.getItem('clubsphere_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.orgId !== 'tech' && parsed?.orgId !== 'cult' && parsed?.orgId !== 'sport') {
          return 'app';
        }
      }
    } catch (e) {}
    return 'landing';
  });

  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('clubsphere_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        const homeTabMap = {
          student: 'my-membership',
          volunteer: 'tasks-kanban',
          event_manager: 'events-list',
          treasurer: 'financial-dash',
          admin: 'club-dash',
          super_admin: 'saas-orgs'
        };
        return homeTabMap[parsed.role] || 'club-dash';
      }
    } catch (e) {}
    return 'club-dash';
  });
  const [isAICopilotDrawerOpen, setIsAICopilotDrawerOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [notifsList, setNotifsList] = useState([]);

  // Cloud Supabase initial hydration
  useEffect(() => {
    supabaseSync.fetchCloudDatabase().then((cloudData) => {
      if (cloudData && cloudData.clubs && cloudData.clubs.length > 0) {
        console.info('[Supabase Live Database] Active cloud records detected.');
        if (window.dbInstance) {
          const modified = window.dbInstance.hydrateFromCloud(cloudData);
          if (modified) setDataVersion(v => v + 1);
        }
      }
    }).catch(console.warn);
  }, []);

  // Subscribe to notifications when logged in
  useEffect(() => {
    if (!session) return;
    setNotifsList(notificationService.getNotifications(session.orgId));
    const unsubscribe = notificationService.subscribe((updated) => {
      setNotifsList(updated.filter((n) => !n.orgId || n.orgId === session.orgId));
    });
    return () => unsubscribe();
  }, [session?.orgId]);

  // Synchronize active club state to central backend API
  useEffect(() => {
    if (session?.orgId && session.orgId !== 'platform') {
      clubService.syncFullLedgerToBackend(session.orgId);
    }
  }, [session?.orgId, dataVersion]);

  // Active Club Data
  const activeClub = (() => {
    if (session && session.orgId === 'platform') {
      return { id: 'platform', name: 'Platform Super Admin', short: 'Platform', color: '#121212' };
    }
    if (session && session.orgId) {
      try {
        return clubService.getClub(session.orgId);
      } catch (err) {
        return { id: session.orgId, name: 'Club Workspace', short: session.orgId, color: '#FFE853' };
      }
    }
    return { id: 'club', name: 'Student Club', short: 'Club', color: '#FFE853' };
  })();

  // Save session changes
  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem('clubsphere_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('clubsphere_session');
      }
    } catch (e) {}
  }, [session]);

  const handleToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  const handleDataChange = () => {
    setDataVersion((v) => v + 1);
  };

  const handleRoleAndClubSelect = ({ role, orgId, email, name, homeTab }) => {
    const newSession = { role, orgId, email, name };
    setSession(newSession);
    const homeTabMap = {
      student: 'my-membership',
      member: 'my-membership',
      volunteer: 'tasks-kanban',
      event_manager: 'events-list',
      treasurer: 'financial-dash',
      admin: 'club-dash',
      super_admin: 'saas-orgs'
    };
    setActiveTab(homeTab || homeTabMap[role] || 'club-dash');
    setViewState('app');
    handleToast(`⚡ Signed in as ${name} (${role.toUpperCase()})`);
  };

  const handleAuthSuccess = (newSession) => {
    setSession(newSession);
    const homeTabMap = {
      student: 'my-membership',
      member: 'my-membership',
      volunteer: 'tasks-kanban',
      event_manager: 'events-list',
      treasurer: 'financial-dash',
      admin: 'club-dash',
      super_admin: 'saas-orgs'
    };
    setActiveTab(homeTabMap[newSession.role] || 'my-membership');
    setViewState('app');
    handleToast(`✨ Welcome to ${dbInstance.data.clubs[newSession.orgId]?.name || 'ClubSphere'}!`);

    // Check if user has not updated initial password yet -> trigger password update modal
    const userInDb = dbInstance.findUserByClubEmail(newSession.email);
    if (!userInDb || userInDb.passwordChanged === false || userInDb.password === '12345678') {
      setTimeout(() => setIsPasswordModalOpen(true), 600);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setViewState('landing');
    handleToast('👋 Signed out of ClubSphere successfully.');
  };

  const handleResetDb = () => {
    dbInstance.reset();
    setDataVersion((v) => v + 1);
    handleToast('🔄 Mock Database has been restored to clean seed state.');
  };

  // Dedicated Super Admin Club Creation Page
  if (viewState === 'super-admin-club-creation') {
    return (
      <SuperAdminClubCreationView
        onBack={() => setViewState('landing')}
        onClubCreated={(newClub) => {
          setDataVersion(v => v + 1);
          handleToast(`🚀 Organization ${newClub.name} launched with domain ${newClub.emailDomain}!`);
        }}
      />
    );
  }

  // If user is on Landing Page or Auth Page
  if (viewState === 'landing' || !session) {
    if (viewState === 'auth') {
      return (
        <AuthView
          initialMode={authInitialMode}
          onAuthSuccess={handleAuthSuccess}
          onBackToLanding={() => setViewState('landing')}
          onSuperAdminClick={() => setViewState('super-admin-club-creation')}
        />
      );
    }

    return (
      <>
        <LandingPageView
          onLoginClick={() => {
            setAuthInitialMode('login');
            setViewState('auth');
          }}
          onRegisterClick={() => {
            setAuthInitialMode('register');
            setViewState('auth');
          }}
          onSuperAdminClick={() => setViewState('super-admin-club-creation')}
          onQuickRoleClick={() => setIsQuickLoginOpen(true)}
        />
        <QuickLoginModal
          isOpen={isQuickLoginOpen}
          onClose={() => setIsQuickLoginOpen(false)}
          currentSession={session || {}}
          onSelectRoleAndClub={handleRoleAndClubSelect}
        />
      </>
    );
  }

  // Role Permissions Mapping for RoleGuard
  const roleAllowedTabs = {
    student: ['my-membership', 'browse-events', 'my-tickets', 'merch-shop', 'my-orders', 'my-certificates', 'announcements-feed', 'feedback'],
    member: ['my-membership', 'browse-events', 'my-tickets', 'merch-shop', 'my-orders', 'my-certificates', 'announcements-feed', 'feedback'],
    volunteer: ['tasks-kanban', 'volunteer-portal', 'my-reimbursements', 'leaderboard', 'announcements-feed'],
    event_manager: ['events-list', 'tasks-kanban', 'volunteers-list', 'qr-checkin', 'attendance', 'event-profit', 'reports-hub', 'feedback', 'announcements-mgmt'],
    treasurer: ['financial-dash', 'income-ledger', 'expenses-ledger', 'reimbursements-mgmt', 'budget-mgmt', 'sponsors', 'donations', 'reports-hub'],
    admin: [
      'club-dash', 'members-list', 'member-verify', 'events-list', 'inventory', 'fundraisers',
      'volunteers-list', 'financial-dash', 'reports-hub', 'announcements-mgmt', 'sponsors',
      'certificates-mgmt', 'ai-copilot', 'audit-log', 'settings', 'qr-checkin', 'attendance',
      'reimbursements-mgmt'
    ],
    super_admin: ['saas-orgs', 'saas-plans', 'saas-analytics', 'saas-modules', 'audit-log', 'settings']
  };

  const isTabAllowed = (roleAllowedTabs[session.role] || []).includes(activeTab);

  // Render current tab content
  const renderTabContent = () => {
    if (!isTabAllowed) {
      return (
        <TenantForbidden403
          userRole={session.role}
          userOrg={session.orgId}
          requiredRole="Authorized Role"
          onResetToHome={() => {
            const homeMap = {
              student: 'my-membership',
              member: 'my-membership',
              volunteer: 'tasks-kanban',
              event_manager: 'events-list',
              treasurer: 'financial-dash',
              admin: 'club-dash',
              super_admin: 'saas-orgs'
            };
            setActiveTab(homeMap[session.role] || 'club-dash');
          }}
          onOpenQuickLogin={handleLogout}
        />
      );
    }

    switch (activeTab) {
      case 'club-dash':
        return <ClubDashboardView session={session} activeClub={activeClub} onNavigate={setActiveTab} />;
      case 'my-membership':
        return <MyMembershipView key={`membership-${dataVersion}`} session={session} activeClub={activeClub} onRenewSuccess={handleDataChange} onNavigate={setActiveTab} />;
      case 'members-list':
        return <MembersListView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'member-verify':
        return <MemberVerificationView session={session} activeClub={activeClub} onToast={handleToast} />;
      case 'browse-events':
        return <BrowseEventsView key={`browse-events-${dataVersion}`} session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} onNavigate={setActiveTab} />;
      case 'events-list':
      case 'event-profit':
        return <EventsManagerView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} onNavigate={setActiveTab} />;
      case 'my-tickets':
        return <MyTicketsView session={session} activeClub={activeClub} onToast={handleToast} onNavigate={setActiveTab} />;
      case 'qr-checkin':
        return <QRCheckinView session={session} activeClub={activeClub} onToast={handleToast} />;
      case 'attendance':
        return <AttendanceView session={session} activeClub={activeClub} onToast={handleToast} />;
      case 'merch-shop':
        return <MerchShopView session={session} activeClub={activeClub} onToast={handleToast} onNavigate={setActiveTab} />;
      case 'inventory':
        return <InventoryView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'my-orders':
        return <OrdersView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} onNavigate={setActiveTab} />;
      case 'tasks-kanban':
        return <TasksKanbanView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'volunteer-portal':
        return <VolunteerPortalView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'volunteers-list':
        return <VolunteersListView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} onNavigate={setActiveTab} />;
      case 'leaderboard':
        return <LeaderboardView session={session} activeClub={activeClub} />;
      case 'fundraisers':
        return <FundraisersView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'financial-dash':
      case 'budget-mgmt':
        return <FinancialDashboardView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} onNavigate={setActiveTab} />;
      case 'income-ledger':
        return <IncomeView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'expenses-ledger':
        return <ExpensesView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'reimbursements-mgmt':
      case 'my-reimbursements':
        return <ReimbursementsView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'sponsors':
        return <SponsorsView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'donations':
        return <DonationsView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'announcements-feed':
      case 'announcements-mgmt':
        return <AnnouncementsView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'reports-hub':
        return <ReportsHubView session={session} activeClub={activeClub} onToast={handleToast} />;
      case 'certificates-mgmt':
      case 'my-certificates':
        return <CertificatesView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'feedback':
        return <FeedbackView session={session} activeClub={activeClub} onDataChange={handleDataChange} onToast={handleToast} />;
      case 'ai-copilot':
        return <AICopilotView session={session} activeClub={activeClub} />;
      case 'saas-orgs':
      case 'saas-plans':
      case 'saas-modules':
      case 'saas-analytics':
        return <PlatformSuperAdminView session={session} onToast={handleToast} />;
      case 'audit-log':
        return <AuditLogView session={session} activeClub={activeClub} onToast={handleToast} />;
      case 'settings':
        return <SettingsView session={session} activeClub={activeClub} onToast={handleToast} onResetDb={handleResetDb} />;
      default:
        return <ClubDashboardView session={session} activeClub={activeClub} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        session={session}
        activeClub={activeClub}
        onToggleAICopilot={() => setIsAICopilotDrawerOpen(true)}
        unreadNotifsCount={notifsList.filter((n) => n.unread).length}
        onOpenNotifs={() => setIsNotifsOpen(true)}
        onOpenQuickLogin={() => setIsQuickLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          role={session.role}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          clubName={activeClub.name}
        />

        <main style={{ flex: 1, padding: '28px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          {renderTabContent()}
        </main>
      </div>

      {/* Slide-out AI Copilot Drawer */}
      {isAICopilotDrawerOpen && (
        <AICopilotView
          session={session}
          activeClub={activeClub}
          isDrawer={true}
          onClose={() => setIsAICopilotDrawerOpen(false)}
        />
      )}

      {/* Slide-out Notifications Drawer */}
      <Drawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        title="🔔 Live Platform Notifications"
        headerColor="var(--accent-yellow)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifsList.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '14px',
                backgroundColor: n.unread ? '#FEF9C3' : '#FAF5EE',
                border: '2px solid #000',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0 }}>{n.title}</h4>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>{n.time}</span>
              </div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{n.message}</p>
            </div>
          ))}
        </div>
      </Drawer>

      {/* First-time Login Password Update Popup Modal */}
      <PasswordUpdateModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        session={session}
        onToast={handleToast}
      />

      {/* Quick Role & Persona Switcher */}
      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
        currentSession={session || {}}
        onSelectRoleAndClub={handleRoleAndClubSelect}
      />

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#FFD24C',
            color: '#121212',
            border: '3px solid #121212',
            borderRadius: '16px',
            padding: '14px 20px',
            boxShadow: '6px 6px 0px #121212',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-subheading)',
            fontWeight: 900,
            fontSize: '14px',
            animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 900,
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Public Scan Verification Modal (e.g. from Smartphone Camera scan) */}
      {publicVerifiedPass && (
        <Modal
          isOpen={Boolean(publicVerifiedPass)}
          onClose={() => {
            setPublicVerifiedPass(null);
            try {
              window.history.replaceState({}, '', window.location.pathname);
            } catch (e) {}
          }}
          title="⚡ Verified Digital Pass"
          headerColor="var(--accent-green)"
          maxWidth="480px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '42px', marginBottom: '8px' }}>
                {publicVerifiedPass.status === 'NOT_FOUND' ? '❓' : '✅'}
              </div>
              <Badge variant={publicVerifiedPass.status === 'NOT_FOUND' ? 'pink' : 'green'}>
                {publicVerifiedPass.status === 'NOT_FOUND' ? 'Unrecognized Pass' : 'Cryptographically Verified'}
              </Badge>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '10px 0 4px' }}>
                {publicVerifiedPass.title || 'ClubSphere Pass'}
              </h2>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                {publicVerifiedPass.club?.name || 'ClubSphere Campus Network'}
              </div>
            </div>

            {publicVerifiedPass.status !== 'NOT_FOUND' ? (
              <div
                style={{
                  backgroundColor: '#F4F4F5',
                  border: '2.5px solid #121212',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Attendee / Member:</span>
                  <span style={{ fontWeight: 900 }}>{publicVerifiedPass.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Pass Ref ID:</span>
                  <span style={{ fontWeight: 900, fontFamily: 'monospace' }}>{publicVerifiedPass.code}</span>
                </div>
                {publicVerifiedPass.seat && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Access / Seat:</span>
                    <span style={{ fontWeight: 900 }}>{publicVerifiedPass.seat}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Entry Status:</span>
                  <Badge variant={publicVerifiedPass.status === 'Attended' ? 'yellow' : 'green'}>
                    {publicVerifiedPass.status || 'Active'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>
                {publicVerifiedPass.message}
              </p>
            )}

            <Button
              variant="black"
              style={{ width: '100%' }}
              onClick={() => {
                setPublicVerifiedPass(null);
                try {
                  window.history.replaceState({}, '', window.location.pathname);
                } catch (e) {}
              }}
            >
              Continue to ClubSphere
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
