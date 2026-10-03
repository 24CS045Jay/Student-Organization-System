import React from 'react';
import { Badge, Button } from '../ui/index';
import {
  Bell,
  Sparkles,
  Building2,
  Cpu,
  Palette,
  Trophy,
  Globe,
  LogOut,
  UserCheck
} from 'lucide-react';

export const Navbar = ({
  session,
  activeClub,
  onToggleAICopilot,
  unreadNotifsCount = 0,
  onOpenNotifs,
  onLogout
}) => {
  const roleLabels = {
    student: { label: 'Student / Member', badge: 'blue' },
    volunteer: { label: 'Volunteer', badge: 'purple' },
    event_manager: { label: 'Event Manager', badge: 'pink' },
    treasurer: { label: 'Treasurer', badge: 'green' },
    admin: { label: 'Club Admin', badge: 'yellow' },
    super_admin: { label: 'Platform Super Admin', badge: 'black' }
  };

  const currentRoleInfo = roleLabels[session?.role] || { label: session?.role || 'Member', badge: 'yellow' };

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: '#FFFFFF',
        borderBottom: '3px solid #121212',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 4px 0px #121212'
      }}
    >
      {/* Brand & Club Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#121212',
              color: '#FFE853',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '18px',
              border: '2px solid #121212',
              boxShadow: '2px 2px 0px #121212'
            }}
          >
            CS
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', color: '#121212', fontFamily: 'var(--font-heading)' }}>
              Club<span style={{ color: '#FF6B6B' }}>Sphere</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)' }}>
                Tenant Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Club Indicator (Strictly Isolated) */}
        {session?.role !== 'super_admin' ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              backgroundColor: '#FAF5EE',
              border: '2px solid #121212',
              boxShadow: '2px 2px 0px #121212',
              fontSize: '13px',
              fontWeight: 900,
              color: '#121212'
            }}
          >
            <Building2 size={16} color={activeClub.color || '#121212'} />
            <span>{activeClub.name}</span>
          </div>
        ) : (
          <Badge variant="black" icon={Globe}>
            Platform Super Admin
          </Badge>
        )}
      </div>

      {/* Right Controls: AI Copilot, Notification Bell, User Persona, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* AI Copilot Trigger */}
        <Button
          variant="purple"
          size="sm"
          onClick={onToggleAICopilot}
          icon={Sparkles}
          title="Open Club AI Assistant"
        >
          AI Copilot
        </Button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifs}
          title="Notifications"
          className="neo-btn neo-btn-sm"
          style={{ padding: '6px 12px', position: 'relative' }}
        >
          <Bell size={16} />
          {unreadNotifsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--accent-pink)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 900,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '1.5px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {unreadNotifsCount}
            </span>
          )}
        </button>

        {/* User Persona & Role Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '9999px',
            border: '2px solid #121212',
            backgroundColor: '#FAF5EE',
            boxShadow: '2px 2px 0px #121212'
          }}
        >
          <Badge variant={currentRoleInfo.badge}>
            {currentRoleInfo.label}
          </Badge>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)' }}>
            {session?.name || session?.email}
          </span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          className="neo-btn neo-btn-sm"
          style={{
            backgroundColor: '#FEE2E2',
            borderColor: '#DC2626',
            color: '#991B1B',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Sign Out of ClubSphere"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
