import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { apiClient } from '../../services/apiClient';
import { inr } from '../../mock/db';
import { BarChart3, Download, Calendar, Users, DollarSign, Award, FileText } from 'lucide-react';

export const ReportsHubView = ({ session, activeClub, onToast }) => {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'membership' | 'finance'
  const [dateRange, setDateRange] = useState('Current Semester (Fall 2026)');

  const club = clubService.getClub(activeClub.id);
  const [events, setEvents] = useState(club.events || []);
  const [members, setMembers] = useState(club.members || []);
  const [finance, setFinance] = useState(club.finance || {});
  const [tickets, setTickets] = useState(club.tickets || []);
  const reimbursements = club.reimbursements || [];

  useEffect(() => {
    // 1. Step 1 of replacing db.js with Backend APIs
    // We fetch the real mock payloads from Express (Phase 9 implementation)
    const loadBackendData = async () => {
      try {
        if (activeTab === 'events') {
          const res = await apiClient.get('/reports/events');
          // For now just logging to show integration, keeping local state sync 
          // as we transition fully.
          console.log('[Backend API Data - Events]', res.data);
        } else if (activeTab === 'membership') {
          const res = await apiClient.get('/reports/membership');
          console.log('[Backend API Data - Membership]', res.data);
        } else if (activeTab === 'finance') {
          const res = await apiClient.get('/reports/financial');
          console.log('[Backend API Data - Finance]', res.data);
        }
      } catch (err) {
        console.error('API Error:', err);
      }
    };
    loadBackendData();
  }, [activeTab]);

  const handleExport = (type) => {
    try {
      if (type === 'pdf') {
        window.print();
        if (onToast) onToast('🖨️ Print dialog opened for PDF export.');
        return;
      }

      let csvContent = "";
      let filename = `${activeClub.short || 'club'}_${activeTab}_report_${new Date().toISOString().split('T')[0]}`;
      
      if (activeTab === 'events') {
        csvContent = "Event Title,Date,Category,Capacity,Sold,Status,Member Price,Non-Member Price\n";
        csvContent += events.map(e => `"${e.title}","${e.date}","${e.category}",${e.capacity},${e.sold},${e.status},${e.memberPrice},${e.nonMemberPrice}`).join("\n");
      } else if (activeTab === 'membership') {
        csvContent = "Member Name,Email,Type,Status,Paid\n";
        csvContent += members.map(m => `"${m.name}","${m.email}","${m.type}","${m.status}",${m.paid}`).join("\n");
      } else if (activeTab === 'finance') {
        csvContent = "Transaction Type,Category,Title,Amount,Date,Approved By\n";
        const allTxns = [
          ...(finance.incomeSources || []).map(i => `"Income","${i.source}","Income Aggregation",${i.amount},"N/A","Auto"`),
          ...(finance.expensesList || []).map(e => `"Expense","${e.category}","${e.title}",${e.amount},"${e.date}","${e.approvedBy}"`)
        ];
        csvContent += allTxns.join("\n");
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onToast) onToast(`📄 Downloaded ${activeTab.toUpperCase()} report as CSV!`);
    } catch (err) {
      if (onToast) onToast(`❌ Export failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Badge variant="black">FR-19, FR-20, FR-21 Comprehensive Reports Hub</Badge>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '8px 0 0' }}>
            Executive Analytics & Audit Reports
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Audited financial statements, attendance ratios, and membership health reports for {activeClub.name}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="yellow" size="sm" onClick={() => handleExport('pdf')} icon={Download}>
            Export PDF Report
          </Button>
          <Button variant="black" size="sm" onClick={() => handleExport('csv')} icon={Download}>
            Export CSV Data
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2.5px solid #121212', paddingBottom: '8px' }}>
        <Button
          variant={activeTab === 'events' ? 'yellow' : 'white'}
          size="sm"
          onClick={() => setActiveTab('events')}
        >
          Event Profitability Report (FR-19)
        </Button>
        <Button
          variant={activeTab === 'membership' ? 'purple' : 'white'}
          size="sm"
          onClick={() => setActiveTab('membership')}
        >
          Membership Demographics Report (FR-20)
        </Button>
        <Button
          variant={activeTab === 'finance' ? 'green' : 'white'}
          size="sm"
          onClick={() => setActiveTab('finance')}
        >
          Financial Income Statement (FR-21)
        </Button>
      </div>

      {/* Tab 1: Event Report (FR-19) */}
      {activeTab === 'events' && (
        <Card title="🎟️ Event Revenue, Turnout & Profit/Loss Audit" headerBg="var(--accent-yellow)">
          <div className="neo-table-container">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Tickets Sold / Cap</th>
                  <th>Gross Revenue</th>
                  <th>Allocated Expenses</th>
                  <th>Net Profit / Margin</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const gross = ev.sold * ((ev.memberPrice + ev.nonMemberPrice) / 2);
                  const exp = Object.values(ev.budget || {}).reduce((a, b) => a + b, 0);
                  const net = gross - exp;
                  const att = tickets.filter(t => t.eventId === ev.id && t.status === 'Attended').length;
                  const attRate = ev.sold > 0 ? Math.round((att / ev.sold) * 100) : 0;

                  return (
                    <tr key={ev.id}>
                      <td style={{ fontWeight: 900 }}>{ev.title}</td>
                      <td>{ev.sold} / {ev.capacity}</td>
                      <td style={{ fontWeight: 900, color: '#059669' }}>{inr(gross)}</td>
                      <td style={{ fontWeight: 900, color: '#DC2626' }}>-{inr(exp)}</td>
                      <td>
                        <Badge variant={net >= 0 ? 'green' : 'pink'}>
                          {inr(net)}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 800 }}>{attRate}% ({att} checked in)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Membership Report (FR-20) */}
      {activeTab === 'membership' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <StatCard
              title="Total Roster"
              value={members.length}
              subtitle="Registered Students"
              icon={Users}
              color="var(--accent-yellow)"
            />
            <StatCard
              title="Active Verified"
              value={members.filter(m => m.status === 'Active').length}
              subtitle="Valid Membership"
              icon={Award}
              color="var(--accent-green)"
            />
            <StatCard
              title="Renewal Conversion"
              value="88.4%"
              subtitle="Semester Retention"
              icon={BarChart3}
              color="var(--accent-purple)"
            />
          </div>

          <Card title="👥 Department & Member Breakdown" headerBg="var(--accent-purple)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {['Computer Engineering', 'Information Technology', 'Electronics', 'Mechanical'].map((dept) => {
                const count = members.filter(m => m.dept.includes(dept)).length;
                return (
                  <div key={dept} style={{ padding: '12px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 900, fontSize: '14px' }}>{dept}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                      {count} Members
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Financial Report (FR-21) */}
      {activeTab === 'finance' && (
        <Card title="💰 Comprehensive Income & Expense Statement" headerBg="var(--accent-green)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '10px', color: '#059669' }}>
                + Income Statement Sources
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(finance.incomeSources || []).map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FAF5EE', border: '1.5px solid #000', borderRadius: '8px', fontSize: '13px', fontWeight: 800 }}>
                    <span>{s.source}</span>
                    <span style={{ color: '#059669' }}>+{inr(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '10px', color: '#DC2626' }}>
                - Disbursed Expenditures
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(finance.expensesList || []).map((exp) => (
                  <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FAF5EE', border: '1.5px solid #000', borderRadius: '8px', fontSize: '13px', fontWeight: 800 }}>
                    <span>{exp.title}</span>
                    <span style={{ color: '#DC2626' }}>-{inr(exp.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
