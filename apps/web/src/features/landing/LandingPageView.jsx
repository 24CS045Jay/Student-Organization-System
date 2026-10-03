import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  QrCode,
  Ticket,
  Users,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Zap,
  Building2,
  Cpu,
  Palette,
  Trophy,
  Shield,
  Plus
} from 'lucide-react';
import { dbInstance } from '../../mock/db';

export const LandingPageView = ({ onLoginClick, onRegisterClick, onDemoSelect, onSuperAdminClick }) => {
  // Dynamically load all registered clubs from dbInstance
  const registeredClubs = Object.values(dbInstance.data.clubs || {});

  const getClubIcon = (category = '', short = '') => {
    const cat = category.toLowerCase() + ' ' + short.toLowerCase();
    if (cat.includes('cult') || cat.includes('art') || cat.includes('music')) return Palette;
    if (cat.includes('sport') || cat.includes('athletic')) return Trophy;
    return Cpu;
  };

  const features = [
    {
      icon: <Ticket size={24} />,
      title: 'Digital Tickets & QR Passes',
      desc: 'Dynamic QR tickets with member discounts, real-time seat limits, and instant wallet access.'
    },
    {
      icon: <QrCode size={24} />,
      title: 'Sub-Second Gate Check-In',
      desc: 'High-speed camera scanner with duplicate scan rejection and live attendance tracking.'
    },
    {
      icon: <CreditCard size={24} />,
      title: 'Transparent Financial Ledgers',
      desc: 'Audited income/expense ledgers, multi-stage reimbursement approvals, and budget burn tracking.'
    },
    {
      icon: <ShoppingBag size={24} />,
      title: 'Merchandise Shop & Stock',
      desc: 'Variant management, size allocations, stock reserves during checkout, and order fulfillment.'
    },
    {
      icon: <Users size={24} />,
      title: 'Volunteer Tasks & Gamification',
      desc: 'Visual Kanban boards, verified service hour logging, leaderboard points, and digital badges.'
    },
    {
      icon: <Sparkles size={24} />,
      title: 'Club-Scoped AI Copilot',
      desc: 'Intelligent event planning, financial summaries, and task automation strictly bounded to your club.'
    }
  ];

  const roles = [
    { role: 'Student Member', color: '#70D6FF', desc: 'Browse club events, access digital membership pass, buy discounted tickets, and order merch.' },
    { role: 'Volunteer', color: '#6BCB77', desc: 'Pick up assigned event tasks, log verified volunteer hours, earn badges, and submit expense receipts.' },
    { role: 'Event Manager', color: '#FFD93D', desc: 'Create and publish events, monitor seat capacities, conduct live QR check-ins, and inspect attendance.' },
    { role: 'Treasurer', color: '#D946EF', desc: 'Oversee income streams, review reimbursement claims, balance club budgets, and audit financial records.' },
    { role: 'Club Admin', color: '#FF6B6B', desc: 'Full club authority: manage member roster, configure membership tiers, audit logs, and club settings.' }
  ];

  // Dynamically generate quick demo shortcuts for live registered clubs
  const demoAccounts = registeredClubs.flatMap(club => [
    { role: 'admin', orgId: club.id, email: `admin${club.emailDomain || `@${club.id}.campus.edu`}`, name: `${club.short || club.name} Admin`, label: `${club.short || club.name} Admin`, color: club.color || '#FFE853', homeTab: 'club-dash' },
    { role: 'student', orgId: club.id, email: `member${club.emailDomain || `@${club.id}.campus.edu`}`, name: `${club.short || club.name} Member`, label: `${club.short || club.name} Member`, color: '#70D6FF', homeTab: 'my-membership' }
  ]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFDF7', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '70px',
          backgroundColor: '#FFFFFF',
          borderBottom: '3px solid #121212',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 4px 0px #121212'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#121212',
              color: '#FFE853',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '20px',
              borderRadius: '10px',
              border: '2px solid #121212',
              boxShadow: '2px 2px 0px #121212'
            }}
          >
            CS
          </div>
          <span style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#121212' }}>
            Club<span style={{ color: '#FF6B6B' }}>Sphere</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onLoginClick}
            className="neo-btn neo-btn-white neo-btn-sm"
          >
            Sign In
          </button>
          <button
            onClick={onRegisterClick}
            className="neo-btn neo-btn-yellow neo-btn-sm"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '60px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'inline-flex', marginBottom: '16px' }}>
          <span className="neo-badge neo-badge-yellow">
            ⚡ Centralized Campus Club Portal
          </span>
        </div>

        <h1
          style={{
            fontSize: '44px',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: '#121212',
            lineHeight: 1.15,
            margin: '0 0 16px'
          }}
        >
          One Central Portal. <br />
          <span style={{ backgroundColor: '#FFE853', padding: '2px 12px', border: '3px solid #121212', boxShadow: '4px 4px 0px #121212', display: 'inline-block', transform: 'rotate(-1deg)' }}>
            Strictly Isolated Club Workspaces.
          </span>
        </h1>

        <p
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--ink-muted)',
            maxWidth: '720px',
            margin: '0 auto 28px',
            lineHeight: 1.5
          }}
        >
          Sign in with your club email. Your club and role are automatically detected — giving you instant access to your events, members, treasury, and tasks with zero cross-club leakage.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <button
            onClick={onRegisterClick}
            className="neo-btn neo-btn-yellow neo-btn-lg"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Create Club Account</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={onLoginClick}
            className="neo-btn neo-btn-white neo-btn-lg"
          >
            Sign In to Your Club
          </button>
        </div>

        {/* Quick Demo One-Click Access Bar */}
        <div
          className="neo-box"
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            maxWidth: '960px',
            margin: '0 auto',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Zap size={18} color="#121212" />
            <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0 }}>
              Quick One-Click Demo Access (Test Any Role & Club)
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
            {demoAccounts.map((d) => (
              <button
                key={d.email}
                onClick={() => onDemoSelect(d)}
                className="neo-btn neo-btn-white"
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  borderLeft: `6px solid ${d.color}`
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 900 }}>{d.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Live Campus Clubs Directory */}
      <section
        style={{
          padding: '40px 24px',
          backgroundColor: '#FFFFFF',
          borderTop: '3px solid #121212',
          borderBottom: '3px solid #121212'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="neo-badge neo-badge-purple">Campus Organizations</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '8px 0 4px' }}>
              Connected Student Clubs ({registeredClubs.length})
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
              Each organization operates in its own encrypted sandbox with dedicated domain routing.
            </p>
          </div>

          {registeredClubs.length === 0 ? (
            <div
              className="neo-box"
              style={{
                backgroundColor: '#FFFDF7',
                padding: '48px 24px',
                textAlign: 'center',
                maxWidth: '680px',
                margin: '0 auto'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#FFE853',
                  border: '3px solid #121212',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '4px 4px 0px #121212',
                  marginBottom: '16px'
                }}
              >
                <Building2 size={32} color="#121212" />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px' }}>
                No Student Clubs Registered Yet
              </h3>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
                The portal database is completely fresh. Super Admin can onboard new clubs, allocate seed budgets, and assign unique email domains.
              </p>
              <button
                onClick={onSuperAdminClick}
                className="neo-btn neo-btn-yellow neo-btn-lg"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>👑 Open Super Admin Portal to Create First Club</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {registeredClubs.map((club) => {
                const IconComp = getClubIcon(club.category, club.short);
                const domain = club.emailDomain || `@${club.id}.campus.edu`;
                return (
                  <div
                    key={club.id}
                    className="neo-box"
                    style={{
                      backgroundColor: '#FFFDF7',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            backgroundColor: club.color || '#FFE853',
                            border: '2px solid #121212',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '3px 3px 0px #121212'
                          }}
                        >
                          <IconComp size={22} color="#121212" />
                        </div>
                        <span className="neo-badge neo-badge-yellow">{club.category || 'Organization'}</span>
                      </div>

                      <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px' }}>{club.name}</h3>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '14px' }}>
                        {club.description || club.tagline || 'Active student organization on campus.'}
                      </p>

                      <div style={{ padding: '8px 12px', backgroundColor: '#FAF5EE', border: '1.5px solid #121212', borderRadius: '8px', fontSize: '12px', fontWeight: 800, marginBottom: '16px' }}>
                        Unique Email Domain: <span style={{ color: '#2563EB' }}>{domain}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed #121212', paddingTop: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800 }}>
                        👥 {club.members?.length || 0} Members • 🎟️ {club.events?.length || 0} Events
                      </div>
                      <button
                        onClick={() => onLoginClick()}
                        className="neo-btn neo-btn-white neo-btn-sm"
                      >
                        Login
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Role Scopes Matrix */}
      <section style={{ padding: '50px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="neo-badge neo-badge-green">Role-Based Access Control (RBAC)</span>
          <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '8px 0 4px' }}>
            Tailored Experiences by Club Role
          </h2>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Every club member enters an experience designed specifically for their responsibilities.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {roles.map((r) => (
            <div
              key={r.role}
              className="neo-box"
              style={{
                backgroundColor: '#FFFFFF',
                padding: '18px',
                borderTop: `6px solid ${r.color}`
              }}
            >
              <h4 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 6px' }}>{r.role}</h4>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.45 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '40px 24px 60px', backgroundColor: '#FAF5EE', borderTop: '3px solid #121212' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span className="neo-badge neo-badge-pink">End-to-End Suite</span>
            <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '8px 0 4px' }}>
              Built for Fast Campus Operations
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => (
              <div
                key={i}
                className="neo-box"
                style={{ backgroundColor: '#FFFFFF', padding: '20px' }}
              >
                <div style={{ marginBottom: '12px' }}>{f.icon}</div>
                <h4 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 6px' }}>{f.title}</h4>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer with Super Admin Access Button */}
      <footer
        style={{
          padding: '28px 32px',
          backgroundColor: '#121212',
          color: '#FFFFFF',
          borderTop: '3px solid #121212',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#FFE853', color: '#121212', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
            CS
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: '16px', display: 'block' }}>ClubSphere Campus OS</span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Unified Multi-Tenant Student Organization Portal</span>
          </div>
        </div>

        {/* Super Admin Direct Access Button in Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onSuperAdminClick}
            className="neo-btn neo-btn-yellow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 900,
              boxShadow: '4px 4px 0px #FFFFFF'
            }}
          >
            <span>👑 Super Admin Portal • Create New Club</span>
            <Plus size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
};
