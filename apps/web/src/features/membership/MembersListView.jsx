import React, { useState } from 'react';
import { Card, Button, Badge, Drawer, Modal, StatCard } from '../../components/ui/index';
import { NeoQRCode } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

export const MembersListView = ({ session, activeClub, onDataChange, onToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'reminders' | 'types'

  // New Member Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    dept: 'Computer Engineering',
    type: 'Standard Member',
    paid: true,
    phone: '+91 98980 00111'
  });

  const members = clubService.getMembers(activeClub.id);
  const membershipTypes = clubService.getMembershipTypes(activeClub.id);
  const club = clubService.getClub(activeClub.id);
  const reminders = club.renewalReminders || [];

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.studentId?.toLowerCase().includes(searchQuery.toLowerCase());

    const isExpired = new Date(m.exp) < new Date() || m.paid === 0;

    if (statusFilter === 'ACTIVE') return matchesSearch && !isExpired && m.paid === 1;
    if (statusFilter === 'EXPIRED') return matchesSearch && isExpired;
    if (statusFilter === 'UNPAID') return matchesSearch && m.paid === 0;
    return matchesSearch;
  });

  const handleCreateMember = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    try {
      const newM = clubService.registerMember(activeClub.id, formData, session);
      setIsAddDrawerOpen(false);
      setFormData({
        name: '',
        email: '',
        studentId: '',
        dept: 'Computer Engineering',
        type: 'Standard Member',
        paid: true,
        phone: '+91 98980 00111'
      });
      if (onToast) onToast(`✅ Registered ${newM.name} with ID ${newM.id}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRenewMember = (memberId) => {
    try {
      const updated = clubService.renewMember(activeClub.id, memberId, 12, session);
      setSelectedMember({ ...updated });
      if (onToast) onToast(`✅ Renewed membership for ${updated.name} until ${updated.exp}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = () => {
    try {
      const headers = ['Member ID', 'Name', 'Email', 'Student ID', 'Department', 'Tier', 'Status', 'Expires On', 'Paid'];
      const rows = filteredMembers.map(m => {
        const isExpired = new Date(m.exp) < new Date() || m.paid === 0;
        return [
          m.id,
          `"${(m.name || '').replace(/"/g, '""')}"`,
          m.email,
          m.studentId || '',
          `"${(m.dept || '').replace(/"/g, '""')}"`,
          `"${(m.type || '').replace(/"/g, '""')}"`,
          isExpired ? 'Expired' : 'Active',
          m.exp,
          m.paid ? 'Yes' : 'No'
        ].join(',');
      });
      const csvString = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${(activeClub?.name || 'club').replace(/\s+/g, '_')}_members_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (onToast) onToast(`📄 Exported ${filteredMembers.length} members to CSV!`);
    } catch (err) {
      if (onToast) onToast('❌ Failed to export CSV');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Stats Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Club Membership Directory
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Manage student registrations, digital cards, tier benefits, and renewal reminders for {activeClub.name}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="black" size="sm" onClick={handleExport} icon={Download}>
            Export CSV
          </Button>
          <Button variant="yellow" size="sm" onClick={() => setIsAddDrawerOpen(true)} icon={UserPlus}>
            Register Member
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2.5px solid #121212', paddingBottom: '8px' }}>
        <Button
          variant={activeTab === 'roster' ? 'yellow' : 'white'}
          size="sm"
          onClick={() => setActiveTab('roster')}
        >
          Active Roster ({members.length})
        </Button>
        <Button
          variant={activeTab === 'types' ? 'purple' : 'white'}
          size="sm"
          onClick={() => setActiveTab('types')}
        >
          Membership Tiers ({membershipTypes.length})
        </Button>
        <Button
          variant={activeTab === 'reminders' ? 'pink' : 'white'}
          size="sm"
          onClick={() => setActiveTab('reminders')}
        >
          Renewal Reminders ({reminders.length})
        </Button>
      </div>

      {activeTab === 'roster' && (
        <>
          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search member name, ID, student roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neo-input"
                style={{ paddingLeft: '38px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--ink-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'ACTIVE', 'EXPIRED', 'UNPAID'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '2px solid #121212',
                    backgroundColor: statusFilter === f ? 'var(--accent-yellow)' : '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: statusFilter === f ? '2px 2px 0px #121212' : 'none'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          <div className="neo-table-container">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Student Info</th>
                  <th>Department</th>
                  <th>Tier Plan</th>
                  <th>Validity Exp</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const isExp = new Date(m.exp) < new Date() || m.paid === 0;
                  return (
                    <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMember(m)}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 900 }}>
                        <span style={{ backgroundColor: '#FAF4E8', padding: '3px 8px', border: '1.5px solid #000', borderRadius: '6px' }}>
                          {m.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px' }}>{m.photo || '🧑‍🎓'}</span>
                          <div>
                            <div style={{ fontWeight: 900 }}>{m.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{m.dept}</div>
                        <div style={{ fontSize: '11px', color: '#71717A' }}>Roll: {m.studentId}</div>
                      </td>
                      <td>
                        <Badge variant={m.type.includes('Premium') || m.type.includes('VIP') ? 'pink' : 'blue'}>
                          {m.type}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 800, color: isExp ? '#DC2626' : '#059669' }}>
                        {m.exp}
                      </td>
                      <td>
                        <Badge variant={isExp ? 'pink' : 'green'}>
                          {isExp ? 'Expired' : 'Active'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="yellow"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMember(m);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Membership Types Tab */}
      {activeTab === 'types' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {membershipTypes.map((type) => (
            <Card key={type.id} title={type.name} headerBg="var(--accent-purple)">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>₹{type.price}</h2>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>/ {type.durationMonths} months</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Badge variant="green">{type.ticketDiscount}% Ticket Off</Badge>
                <Badge variant="yellow">{type.merchDiscount}% Merch Off</Badge>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {type.perks.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Renewal Reminders Tab */}
      {activeTab === 'reminders' && (
        <Card title="⏰ Automated 30 / 15 / 3 Day Expiry Reminders Log" headerBg="var(--accent-pink)">
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
            Under <strong>FR-02 & NFR-05</strong>, auto-renewal alerts are scheduled to notify members via email and in-app before privileges expire.
          </p>
          <div className="neo-table-container">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Days Left</th>
                  <th>Status & Channel</th>
                  <th>Dispatch Date</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 900 }}>{r.studentName}</td>
                    <td><Badge variant={r.daysLeft === 0 ? 'pink' : 'yellow'}>{r.daysLeft} Days</Badge></td>
                    <td style={{ fontWeight: 800 }}>{r.status}</td>
                    <td>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Member Details Profile Drawer */}
      <Drawer
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={`Member Profile — ${selectedMember?.id}`}
        headerColor="var(--accent-yellow)"
      >
        {selectedMember && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  border: '2.5px solid #000',
                  backgroundColor: '#FFF0B3',
                  fontSize: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0px #000'
                }}
              >
                {selectedMember.photo || '🧑‍🎓'}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>{selectedMember.name}</h3>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>{selectedMember.email}</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <Badge variant={selectedMember.paid ? 'green' : 'pink'}>
                    {selectedMember.paid ? 'Active' : 'Unpaid'}
                  </Badge>
                  <Badge variant="purple">{selectedMember.type}</Badge>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <NeoQRCode code={selectedMember.id} size={130} />
            </div>

            <div style={{ backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '14px', padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Roll Number</span>
                <div style={{ fontWeight: 900 }}>{selectedMember.studentId}</div>
              </div>
              <div>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Department</span>
                <div style={{ fontWeight: 900 }}>{selectedMember.dept}</div>
              </div>
              <div>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Start Date</span>
                <div style={{ fontWeight: 900 }}>{selectedMember.startDate}</div>
              </div>
              <div>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Expiry Date</span>
                <div style={{ fontWeight: 900, color: '#059669' }}>{selectedMember.exp}</div>
              </div>
            </div>

            {/* Renewal Button */}
            <Button variant="yellow" style={{ width: '100%' }} onClick={() => handleRenewMember(selectedMember.id)}>
              ⚡ Extend Membership (+12 Months)
            </Button>

            {/* History Timeline */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '8px' }}>Membership History Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedMember.history || []).map((h, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', border: '1.5px solid #000', borderRadius: '8px', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 800 }}>{h.action}</span>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Member Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Register New Student Member"
        headerColor="var(--accent-green)"
      >
        <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="neo-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Neil Patel"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="neo-input"
            />
          </div>

          <div>
            <label className="neo-label">Email Address *</label>
            <input
              type="email"
              required
              placeholder="neil.p@charusat.edu.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Student Roll No</label>
              <input
                type="text"
                placeholder="23IT099"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Department</label>
              <select
                value={formData.dept}
                onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                className="neo-input neo-select"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
            </div>
          </div>

          <div>
            <label className="neo-label">Membership Tier</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="neo-input neo-select"
            >
              {membershipTypes.map(t => (
                <option key={t.id} value={t.name}>{t.name} (₹{t.price})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '10px' }}>
            <input
              type="checkbox"
              id="paidCheckbox"
              checked={formData.paid}
              onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="paidCheckbox" style={{ fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
              Dues Paid Immediately (Marks as Active & Generates Income Record)
            </label>
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '10px' }}>
            Confirm & Generate Member ID Pass
          </Button>
        </form>
      </Drawer>
    </div>
  );
};
