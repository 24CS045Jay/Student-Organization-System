import React, { useState } from 'react';
import { Card, Button, Badge, StatCard, Drawer, Modal } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { dbInstance, inr } from '../../mock/db';
import {
  Building,
  Layers,
  Zap,
  BarChart3,
  Globe,
  Plus,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Server
} from 'lucide-react';

export const PlatformSuperAdminView = ({ session, onToast }) => {
  const [activeTab, setActiveTab] = useState('orgs'); // 'orgs' | 'plans' | 'modules' | 'analytics'
  const [isAddClubOpen, setIsAddClubOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // New Club Form State
  const [clubForm, setClubForm] = useState({
    name: '',
    short: '',
    category: 'Technical & Engineering',
    emailDomain: '',
    color: '#FFE853',
    adminName: 'Club Lead',
    adminEmail: ''
  });

  const platform = clubService.getPlatformData();
  const orgs = platform.organizations || [];
  const plans = platform.plans || [];
  const modules = platform.modules || [];
  const analytics = platform.analytics || {};

  const handleCreateClub = (e) => {
    e.preventDefault();
    if (!clubForm.name || !clubForm.emailDomain) {
      if (onToast) onToast('⚠️ Please enter Club Name and Email Domain.');
      return;
    }

    try {
      const shortCode = clubForm.short || clubForm.name.split(' ')[0].toLowerCase();
      const domain = clubForm.emailDomain.startsWith('@') ? clubForm.emailDomain : `@${clubForm.emailDomain}`;

      clubService.createClubOrganization({
        ...clubForm,
        short: shortCode,
        emailDomain: domain
      }, session);

      setIsAddClubOpen(false);
      setDataVersion(v => v + 1);
      if (onToast) onToast(`🏢 Registered "${clubForm.name}" with domain ${domain}! Users can now register with this email domain.`);

      setClubForm({
        name: '',
        short: '',
        category: 'Technical & Engineering',
        emailDomain: '',
        color: '#FFE853',
        adminName: 'Club Lead',
        adminEmail: ''
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleModule = (modId) => {
    const mod = modules.find(m => m.id === modId);
    if (mod) {
      mod.enabled = !mod.enabled;
      dbInstance.save();
      setDataVersion(v => v + 1);
      if (onToast) onToast(`⚡ SaaS Module "${mod.name}" ${mod.enabled ? 'Enabled' : 'Disabled'} globally!`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Badge variant="black">Platform Root Authority</Badge>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '8px 0 0' }}>
            Platform Super Admin & Club Registry
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Super Admin exclusive portal: Onboard new campus organizations, configure unique email domains, and manage SaaS quotas.
          </p>
        </div>
        <Button variant="yellow" onClick={() => setIsAddClubOpen(true)} icon={Plus}>
          Onboard New Club & Domain
        </Button>
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
          Subscription Plans & Limits
        </Button>
        <Button
          variant={activeTab === 'modules' ? 'pink' : 'white'}
          size="sm"
          onClick={() => setActiveTab('modules')}
          icon={Zap}
        >
          Module Architecture
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'green' : 'white'}
          size="sm"
          onClick={() => setActiveTab('analytics')}
          icon={BarChart3}
        >
          Platform Analytics
        </Button>
      </div>

      {/* Organizations Hierarchy Tab */}
      {activeTab === 'orgs' && (
        <Card title="🏢 Multi-Tenant Organizations & Unique Email Domains" headerBg="var(--accent-yellow)">
          <div className="neo-table-container">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Unique Email Domain</th>
                  <th>Category</th>
                  <th>Subscription Plan</th>
                  <th>Active Members</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => {
                  const clubData = dbInstance.data.clubs[org.id] || {};
                  const domain = org.emailDomain || clubData.emailDomain || `@${org.id}.campus.edu`;
                  return (
                    <tr key={org.id}>
                      <td>
                        <div style={{ fontWeight: 900 }}>{org.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Tenant ID: {org.id}</div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', backgroundColor: '#FEF3C7', border: '1px solid #121212', borderRadius: '6px', fontSize: '12px', fontWeight: 900, color: '#92400E' }}>
                          <Mail size={12} />
                          <span>{domain}</span>
                        </div>
                      </td>
                      <td><Badge variant="blue">{org.department || org.dept || 'General'}</Badge></td>
                      <td>
                        <Badge variant={org.tier === 'Enterprise' ? 'yellow' : 'purple'}>
                          {org.tier || org.plan || 'Pro Tier'}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 900 }}>{clubData.members?.length || org.membersCount || 1} Students</td>
                      <td><Badge variant="green">{org.status || 'Active'}</Badge></td>
                    </tr>
                  );
                })}
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
                  Included Features
                </span>
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', fontWeight: 700 }}>
                  {(p.features || []).map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <Card title="⚡ Global SaaS Module Toggles" headerBg="var(--accent-pink)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
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
                  <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 4px' }}>{m.name}</h4>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', margin: 0 }}>
                    {m.description}
                  </p>
                </div>
                <Button
                  variant={m.enabled ? 'green' : 'white'}
                  size="sm"
                  onClick={() => toggleModule(m.id)}
                >
                  {m.enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <StatCard
              title="Total Platform Organizations"
              value={orgs.length}
              subtitle="Active Tenants"
              icon={Building}
              color="var(--accent-yellow)"
            />
            <StatCard
              title="Total Campus Members"
              value={analytics.totalMembers || 356}
              subtitle="Across All Clubs"
              icon={Building}
              color="var(--accent-green)"
            />
            <StatCard
              title="Monthly Active Scans"
              value={analytics.monthlyScans || 2840}
              subtitle="QR Gate Tickets"
              icon={Zap}
              color="var(--accent-purple)"
            />
            <StatCard
              title="Gross Gross GMV"
              value={inr(analytics.gmv || 480000)}
              subtitle="Tickets & Merch"
              icon={BarChart3}
              color="var(--accent-pink)"
            />
          </div>
        </div>
      )}

      {/* Add New Club & Email Domain Drawer */}
      <Drawer
        isOpen={isAddClubOpen}
        onClose={() => setIsAddClubOpen(false)}
        title="🏢 Onboard New Club Organization"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleCreateClub} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="neo-label">Club Organization Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Robotics & Automation Society"
              value={clubForm.name}
              onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Short Name / Code</label>
              <input
                type="text"
                placeholder="e.g. Robotics"
                value={clubForm.short}
                onChange={(e) => setClubForm({ ...clubForm, short: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Category</label>
              <input
                type="text"
                placeholder="e.g. Technical / Hardware"
                value={clubForm.category}
                onChange={(e) => setClubForm({ ...clubForm, category: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Unique Club Email Domain *</label>
            <input
              type="text"
              required
              placeholder="e.g. @robotics.campus.edu"
              value={clubForm.emailDomain}
              onChange={(e) => setClubForm({ ...clubForm, emailDomain: e.target.value })}
              className="neo-input"
            />
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700, margin: '4px 0 0' }}>
              Any user registering with an email containing this domain will automatically enter this club's isolated workspace.
            </p>
          </div>

          <div>
            <label className="neo-label">Initial Admin Email</label>
            <input
              type="email"
              placeholder="e.g. admin@robotics.campus.edu"
              value={clubForm.adminEmail}
              onChange={(e) => setClubForm({ ...clubForm, adminEmail: e.target.value })}
              className="neo-input"
            />
          </div>

          <div>
            <label className="neo-label">Theme Accent Color</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['#FFE853', '#FF70A6', '#70D6FF', '#6BCB77', '#D946EF', '#FFD93D'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setClubForm({ ...clubForm, color: col })}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: col,
                    border: clubForm.color === col ? '3px solid #121212' : '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '10px' }}>
            Register Organization & Domain
          </Button>
        </form>
      </Drawer>
    </div>
  );
};
