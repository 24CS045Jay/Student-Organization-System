import React from 'react';
import { Card, Button, Badge, StatCard, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  CheckSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const ClubDashboardView = ({ session, activeClub, onNavigate }) => {
  const club = clubService.getClub(activeClub.id);
  const members = club.members || [];
  const events = club.events || [];
  const finance = club.finance || {};
  const tasks = club.tasks || [];
  const merchandise = club.merchandise || [];

  const activeMembers = members.filter(m => m.status === 'Active').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
  const lowStockItems = merchandise.filter(m => Object.values(m.stock).reduce((a, b) => a + b, 0) < 15);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        className="neo-box"
        style={{
          background: `linear-gradient(135deg, ${activeClub.color} 0%, #FFD24C 100%)`,
          padding: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <Badge variant="black">{activeClub.banner || '⚡ Club Command Center'}</Badge>
          <h1 style={{ fontSize: '30px', fontWeight: 900, margin: '8px 0 4px', color: '#121212' }}>
            {activeClub.name}
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(0,0,0,0.85)' }}>
            {activeClub.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="black" onClick={() => onNavigate('events-list')} icon={Calendar}>
            Manage Events
          </Button>
          <Button variant="yellow" onClick={() => onNavigate('ai-copilot')} icon={Sparkles}>
            Launch AI Copilot
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Active Members"
          value={activeMembers}
          subtitle={`${members.length} Total Registered`}
          icon={Users}
          color="var(--accent-yellow)"
          trend="+14%"
        />
        <StatCard
          title="Treasury Balance"
          value={inr(finance.netBalance)}
          subtitle={`Gross: ${inr(finance.totalIncome)}`}
          icon={DollarSign}
          color="var(--accent-green)"
        />
        <StatCard
          title="Active Events"
          value={events.length}
          subtitle="This Semester"
          icon={Calendar}
          color="var(--accent-purple)"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          subtitle={`${tasks.length} In Logistics Pipeline`}
          icon={CheckSquare}
          color="var(--accent-pink)"
        />
      </div>

      {/* Main Grid: Upcoming Events & Operational Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Upcoming Events */}
        <Card
          title="📅 Upcoming Club Events & Occupancy"
          headerBg="var(--accent-yellow)"
          headerAction={
            <Button variant="black" size="sm" onClick={() => onNavigate('events-list')}>
              View All
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {events.slice(0, 2).map((ev) => {
              const pct = Math.round((ev.sold / ev.capacity) * 100);
              return (
                <div
                  key={ev.id}
                  style={{
                    padding: '14px',
                    backgroundColor: '#FAF5EE',
                    border: '2px solid #000',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 900, margin: 0 }}>{ev.title}</h4>
                    <Badge variant={ev.sold >= ev.capacity ? 'black' : 'green'}>
                      {ev.sold >= ev.capacity ? 'Sold Out' : `${ev.sold}/${ev.capacity} Seats`}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                    {ev.date} • {ev.location}
                  </div>
                  <ProgressBar value={ev.sold} max={ev.capacity} color="var(--accent-green)" height={8} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: Low Stock & Action Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Low stock alerts */}
          <Card title="⚠️ Low Inventory Stock Warning" headerBg="var(--accent-pink)">
            {lowStockItems.length === 0 ? (
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                ✓ All merchandise sizes well-stocked!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#FEF2F2',
                      border: '1.5px solid #000',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ fontWeight: 900 }}>{item.name}</span>
                    <Button variant="yellow" size="sm" onClick={() => onNavigate('inventory')}>
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Shortcuts */}
          <Card title="⚡ Quick Management Shortcuts" headerBg="var(--accent-purple)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button variant="white" size="sm" onClick={() => onNavigate('member-verify')}>
                Scan Member QR
              </Button>
              <Button variant="white" size="sm" onClick={() => onNavigate('qr-checkin')}>
                Door Check-in
              </Button>
              <Button variant="white" size="sm" onClick={() => onNavigate('reimbursements-mgmt')}>
                Reimbursements
              </Button>
              <Button variant="white" size="sm" onClick={() => onNavigate('reports-hub')}>
                Reports Hub
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
