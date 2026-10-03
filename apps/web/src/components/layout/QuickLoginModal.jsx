import React, { useState } from 'react';
import { Modal, Button, Badge } from '../ui/index';
import { UserCheck, Shield, Key, Sparkles, Building, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

import { dbInstance } from '../../mock/db';

export const QuickLoginModal = ({
  isOpen,
  onClose,
  currentSession,
  onSelectRoleAndClub
}) => {
  const allClubs = Object.values(dbInstance.data.clubs || {});
  const clubs = allClubs.length > 0 ? allClubs : [
    { id: 'tech', name: 'CHARUSAT Tech Club', prefix: 'TC', color: '#4CC9F0', emailDomain: '@tech.campus.edu' }
  ];

  const [selectedClub, setSelectedClub] = useState(() => currentSession?.orgId && currentSession.orgId !== 'platform' ? currentSession.orgId : (clubs[0]?.id || 'tech'));
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');

  const getDomain = (cId) => {
    const cl = dbInstance.data.clubs[cId] || clubs[0];
    const d = cl?.emailDomain || `@${cId}.campus.edu`;
    return d.startsWith('@') ? d : `@${d}`;
  };

  const demoRoles = [
    {
      role: 'student',
      title: 'Student / Member',
      scope: 'My Membership, Events, Merch Shop & Tickets',
      email: (c) => `student${getDomain(c)}`,
      homeTab: 'my-membership',
      badge: 'blue',
      name: (c) => `Student Member (${dbInstance.data.clubs[c]?.short || c.toUpperCase()})`
    },
    {
      role: 'volunteer',
      title: 'Volunteer',
      scope: 'Tasks Kanban, Hours, Expenses & Leaderboard',
      email: (c) => `volunteer${getDomain(c)}`,
      homeTab: 'tasks-kanban',
      badge: 'purple',
      name: (c) => `Volunteer (${dbInstance.data.clubs[c]?.short || c.toUpperCase()})`
    },
    {
      role: 'event_manager',
      title: 'Event Manager',
      scope: 'Events CRUD, QR Check-in & Attendance Stats',
      email: (c) => `manager${getDomain(c)}`,
      homeTab: 'events-list',
      badge: 'pink',
      name: (c) => `Event Manager (${dbInstance.data.clubs[c]?.short || c.toUpperCase()})`
    },
    {
      role: 'treasurer',
      title: 'Treasurer',
      scope: 'Financial Ledger, Reimbursements & Budget',
      email: (c) => `treasurer${getDomain(c)}`,
      homeTab: 'financial-dash',
      badge: 'green',
      name: (c) => `Treasurer (${dbInstance.data.clubs[c]?.short || c.toUpperCase()})`
    },
    {
      role: 'admin',
      title: 'Club Admin',
      scope: 'Complete Club Management & AI Copilot',
      email: (c) => `admin${getDomain(c)}`,
      homeTab: 'club-dash',
      badge: 'yellow',
      name: (c) => `Club President (${dbInstance.data.clubs[c]?.short || c.toUpperCase()})`
    },
    {
      role: 'super_admin',
      title: 'Platform Super Admin',
      scope: 'Multi-Tenant SaaS, Organizations & Plans',
      email: () => 'super_admin@clubsphere.demo',
      homeTab: 'saas-orgs',
      badge: 'black',
      name: () => 'Global Platform Admin'
    }
  ];

  const handleRoleSelect = (roleDef) => {
    const isSuper = roleDef.role === 'super_admin';
    const org = isSuper ? 'platform' : selectedClub;
    const email = roleDef.email(selectedClub);
    const name = roleDef.name(selectedClub);

    authService.login({
      email,
      password: 'Password123!',
      role: roleDef.role,
      orgId: org,
      name
    }).catch(console.warn);

    onSelectRoleAndClub({
      role: roleDef.role,
      orgId: org,
      email,
      name,
      homeTab: roleDef.homeTab
    });
    onClose();
  };

  const handleCustomLogin = (e) => {
    e.preventDefault();
    if (!customEmail) return;

    authService.login({
      email: customEmail,
      password: customPassword || 'Password123!',
      role: 'student',
      orgId: selectedClub,
      name: customEmail.split('@')[0]
    }).catch(console.warn);

    onSelectRoleAndClub({
      role: 'student',
      orgId: selectedClub,
      email: customEmail,
      name: customEmail.split('@')[0],
      homeTab: 'my-membership'
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Quick Demo Login & Role Switcher"
      maxWidth="720px"
      headerColor="var(--accent-yellow)"
    >
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
          Select any of the 6 roles from the prototype specification to instantly test features with pre-configured permissions and mock isolation.
        </p>

        {/* Club Selection Pills */}
        <div style={{ marginBottom: '20px' }}>
          <label className="neo-label">Select Club Organization:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            {clubs.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClub(c.id)}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: selectedClub === c.id ? '2.5px solid #121212' : '2px solid #E4E4E7',
                  backgroundColor: selectedClub === c.id ? c.color : '#FFFFFF',
                  boxShadow: selectedClub === c.id ? '3px 3px 0px #121212' : 'none',
                  fontFamily: 'var(--font-subheading)',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Role Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {demoRoles.map((r, idx) => {
            const isCurrent = currentSession.role === r.role && (r.role === 'super_admin' || currentSession.orgId === selectedClub);
            return (
              <div
                key={idx}
                onClick={() => handleRoleSelect(r)}
                className="neo-box neo-box-interactive"
                style={{
                  padding: '14px',
                  backgroundColor: isCurrent ? '#FEF9C3' : '#FFFFFF',
                  borderColor: isCurrent ? '#000000' : '#121212'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <Badge variant={r.badge}>{r.title}</Badge>
                  {isCurrent && <Badge variant="green">Active</Badge>}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)', marginBottom: '6px' }}>
                  {r.scope}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 900, color: '#121212' }}>
                  🔑 {r.email(selectedClub)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Login Form */}
        <div style={{ borderTop: '2px dashed #121212', paddingTop: '18px' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            Or Sign in with Custom Credentials:
          </span>
          <form onSubmit={handleCustomLogin} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input
              type="email"
              placeholder="e.g. member@charusat.edu.in"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="neo-input"
              style={{ flex: 1 }}
            />
            <input
              type="password"
              placeholder="Password (any)"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              className="neo-input"
              style={{ width: '150px' }}
            />
            <Button variant="black" type="submit">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
