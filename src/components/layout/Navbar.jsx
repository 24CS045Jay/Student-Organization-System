import React, { useState } from 'react';
import { Badge, Button } from '../ui/index';
import {
  Bell,
  Sparkles,
  ShieldAlert,
  Layers,
  UserCheck,
  ChevronDown,
  Building2,
  Cpu,
  Palette,
  Trophy,
  Globe,
  Sliders
} from 'lucide-react';

export const Navbar = ({
  session,
  activeClub,
  onClubChange,
  onOpenRoleSwitcher,
  onOpenQuickLogin,
  onToggleAICopilot,
  unreadNotifsCount = 2,
  onOpenNotifs
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const clubs = [
    { id: 'tech', name: 'CHARUSAT Tech Club', short: 'Tech', icon: Cpu, color: '#4CC9F0' },
    { id: 'cult', name: 'CHARUSAT Cultural Club', short: 'Cultural', icon: Palette, color: '#FF70A6' },
    { id: 'sport', name: 'CHARUSAT Sports Club', short: 'Sports', icon: Trophy, color: '#70E4A8' }
  ];

  const roleLabels = {
    student: { label: 'Student / Member', badge: 'blue' },
    volunteer: { label: 'Volunteer', badge: 'purple' },
    event_manager: { label: 'Event Manager', badge: 'pink' },
    treasurer: { label: 'Treasurer', badge: 'green' },
    admin: { label: 'Club Admin', badge: 'yellow' },
    super_admin: { label: 'Platform Super Admin', badge: 'black' }
  };

  const currentRoleInfo = roleLabels[session.role] || { label: session.role, badge: 'yellow' };

  return (
    <header
      style={{
        height: '74px',
        backgroundColor: '#FFFFFF',
        borderBottom: '3px solid #121212',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 4px 0px rgba(18,18,18,0.06)'
      }}
    >
      {/* Brand & Club Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-yellow)',
              border: '2.5px solid #121212',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '22px',
              boxShadow: '3px 3px 0px #121212'
            }}
          >
            ⚡
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em' }}>
              Club<span style={{ color: '#FF70A6' }}>Sphere</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717A' }}>
                Multi-Tenant SaaS
              </span>
            </div>
          </div>
        </div>

        {/* Club Picker Dropdown (Only for roles 1-5, role 6 is multi-tenant platform) */}
        {session.role !== 'super_admin' ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="neo-btn neo-btn-sm"
              style={{
                backgroundColor: activeClub.color || 'var(--accent-yellow)',
                fontSize: '13px',
                padding: '6px 14px'
              }}
            >
              <Building2 size={15} />
              <span>{activeClub.name}</span>
              <ChevronDown size={14} />
            </button>

            {dropdownOpen && (
              <div
                className="neo-box"
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  width: '260px',
                  zIndex: 100,
                  padding: '8px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--ink-muted)', padding: '6px 8px' }}>
                  Switch Active Club
                </div>
                {clubs.map((c) => {
                  const Icon = c.icon;
                  const isSelected = c.id === activeClub.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onClubChange(c.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #121212' : '2px solid transparent',
                        backgroundColor: isSelected ? '#FFF8E7' : 'transparent',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        marginBottom: '4px'
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: c.color,
                          border: '1.5px solid #000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <span style={{ flex: 1 }}>{c.name}</span>
                      {isSelected && <span style={{ fontWeight: 900 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <Badge variant="black" icon={Globe}>
            Platform Super Admin (All Tenants)
          </Badge>
        )}
      </div>

      {/* Right Controls: AI Copilot, Notification Bell, Role Switcher, Quick Login */}
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

        {/* Role Quick Switcher Badge & Button */}
        <div
          onClick={onOpenRoleSwitcher}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '9999px',
            border: '2.5px solid #121212',
            backgroundColor: '#FAF5EE',
            boxShadow: '2px 2px 0px #121212',
            cursor: 'pointer'
          }}
          title="Click to Switch Demo Role"
        >
          <Badge variant={currentRoleInfo.badge}>
            {currentRoleInfo.label}
          </Badge>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)' }}>
            {session.name || session.email}
          </span>
          <Sliders size={14} color="#71717A" />
        </div>

        {/* Quick Demo Login Launcher */}
        <Button variant="yellow" size="sm" onClick={onOpenQuickLogin}>
          ⚡ Demo Roles
        </Button>
      </div>
    </header>
  );
};
