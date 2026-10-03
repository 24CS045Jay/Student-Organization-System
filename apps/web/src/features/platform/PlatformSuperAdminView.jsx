import React, { useState } from 'react';
import { Card, Button, Badge, StatCard, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { dbInstance, inr } from '../../mock/db';
import { Building, Layers, Zap, BarChart3, Globe, ShieldCheck, CheckCircle2, Server } from 'lucide-react';

export const PlatformSuperAdminView = ({ session, onToast }) => {
  const [activeTab, setActiveTab] = useState('orgs'); // 'orgs' | 'plans' | 'modules' | 'analytics'
  const platform = clubService.getPlatformData();

  const orgs = platform.organizations || [];
  const plans = platform.plans || [];
  const modules = platform.modules || [];
  const analytics = platform.analytics || {};

  const toggleModule = (modId) => {
    const mod = modules.find(m => m.id === modId);
    if (mod) {
      mod.enabled = !mod.enabled;
      dbInstance.save();
      if (onToast) onToast(`⚡ SaaS Module "${mod.name}" ${mod.enabled ? 'Enabled' : 'Disabled'} globally!`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Badge variant="black">Items 10–13, 17 Multi-Tenant SaaS Platform Root</Badge>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '8px 0 0' }}>
            Platform Super Admin & SaaS Tenant Manager
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Hierarchical organization management (University → College → Dept), SaaS tier pricing, and module architecture.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2.5px solid #121212', paddingBottom: '8px' }}>
        <Button
          variant={activeTab === 'orgs' ? 'yellow' : 'white'}
          size="sm"
          onClick={() => setActiveTab('orgs')}
          icon={Building}
        >
          Campus Organizations ({orgs.length})
        </Button>
        <Button
          variant={activeTab === 'plans' ? 'purple' : 'white'}
          size="sm"
          onClick={() => setActiveTab('plans')}
          icon={Layers}
        >
          Subscription Plans & Limits (Item 13)
        </Button>
        <Button
          variant={activeTab === 'modules' ? 'pink' : 'white'}
          size="sm"
          onClick={() => setActiveTab('modules')}
          icon={Zap}
        >
          Module Architecture (Item 17)
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'green' : 'white'}
          size="sm"
          onClick={() => setActiveTab('analytics')}
          icon={BarChart3}
        >
          Platform Analytics (Item 14)
        </Button>
      </div>

      {/* Organizations Hierarchy Tab */}
      {activeTab === 'orgs' && (
        <Card title="🏢 Multi-Tenant Organizations & Hierarchy Tree (Items 10-12)" headerBg="var(--accent-yellow)">
          <div className="neo-table-container">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Hierarchy Path</th>
                  <th>Department / Cell</th>
                  <th>Subscription Plan</th>
                  <th>Active Members</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div style={{ fontWeight: 900 }}>{org.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Tenant ID: {org.id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{org.university}</div>
                      <div style={{ fontSize: '11px', color: '#71717A' }}>↳ {org.college}</div>
                    </td>
                    <td><Badge variant="blue">{org.dept}</Badge></td>
                    <td>
                      <Badge variant={org.plan === 'Enterprise' ? 'yellow' : 'purple'}>
                        {org.plan} Tier
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 900 }}>{org.members} Students</td>
                    <td><Badge variant="green">{org.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {plans.map((p) => (
            <Card
              key={p.id}
              title={p.name}
              headerBg={p.id === 'plan-ent' ? 'var(--accent-yellow)' : p.id === 'plan-pro' ? 'var(--accent-purple)' : '#FAF5EE'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>
                  {p.price === 0 ? 'FREE' : inr(p.price)}
                </h2>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>{p.billing || 'forever'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontWeight: 800, marginBottom: '16px' }}>
                <div>• Quota: Up to <strong>{p.memberLimit}</strong> members</div>
                <div>• Events: Up to <strong>{p.eventLimit}</strong> active events</div>
                <div>• Platform Fee: <strong>{p.commissionPercent}%</strong> per ticket</div>
              </div>

              <div style={{ borderTop: '2px solid #000', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                  Included Features:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modules Architecture Tab */}
      {activeTab === 'modules' && (
        <Card title="⚡ Pluggable SaaS Module Architecture (Item 17)" headerBg="var(--accent-pink)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {modules.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#FAF5EE',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{m.name}</h3>
                    <Badge variant="purple">{m.category}</Badge>
                    <Badge variant={m.tier === 'Enterprise' ? 'yellow' : 'blue'}>{m.tier} Required</Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700, marginTop: '2px' }}>
                    Global Tenant Module ID: {m.id}
                  </div>
                </div>

                <Button
                  variant={m.enabled ? 'green' : 'white'}
                  size="sm"
                  onClick={() => toggleModule(m.id)}
                >
                  {m.enabled ? '✓ Enabled' : 'Disabled'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <StatCard
            title="Total Tenant Clubs"
            value={analytics.totalTenants}
            subtitle="Campus Organizations"
            icon={Building}
            color="var(--accent-yellow)"
          />
          <StatCard
            title="Active Students"
            value={analytics.activeStudents}
            subtitle="Registered Users"
            icon={Globe}
            color="var(--accent-green)"
          />
          <StatCard
            title="Platform Ticket Volume"
            value={inr(analytics.grossPlatformTicketRevenue)}
            subtitle="Gross Processed Volume"
            icon={BarChart3}
            color="var(--accent-purple)"
          />
          <StatCard
            title="System SLA Uptime"
            value={analytics.systemUptime}
            subtitle={`Avg Latency: ${analytics.avgResponseTime}`}
            icon={Server}
            color="var(--accent-pink)"
          />
        </div>
      )}
    </div>
  );
};
