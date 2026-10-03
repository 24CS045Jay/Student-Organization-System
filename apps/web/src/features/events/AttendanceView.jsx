import React from 'react';
import { Card, Button, Badge, StatCard, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Users, UserCheck, Clock, Award, Download, PieChart } from 'lucide-react';

export const AttendanceView = ({ session, activeClub, onToast }) => {
  const club = clubService.getClub(activeClub.id);
  const tickets = club.tickets || [];
  const events = club.events || [];

  const attendedTickets = tickets.filter(t => t.status === 'Attended');
  const validTickets = tickets.filter(t => t.status === 'Valid');
  const attendanceRate = tickets.length > 0 ? Math.round((attendedTickets.length / tickets.length) * 100) : 0;
  const memberAttendees = attendedTickets.filter(t => t.isMember).length;
  const nonMemberAttendees = attendedTickets.length - memberAttendees;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Event Attendance & Demographic Analytics
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Real-time gate scan records, attendance ratios, and member participation metrics for {activeClub.name}.
          </p>
        </div>
        <Button variant="black" size="sm" onClick={() => onToast && onToast('📄 Attendance log exported to CSV.')} icon={Download}>
          Export Attendance Roster
        </Button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Total Registered"
          value={tickets.length}
          subtitle="Tickets Issued"
          icon={Users}
          color="var(--accent-yellow)"
        />
        <StatCard
          title="Checked-In Attended"
          value={attendedTickets.length}
          subtitle="Physical Turnout"
          icon={UserCheck}
          color="var(--accent-green)"
          trend={`+${attendanceRate}%`}
        />
        <StatCard
          title="Member Turnout"
          value={`${memberAttendees} (${attendedTickets.length > 0 ? Math.round((memberAttendees / attendedTickets.length) * 100) : 0}%)`}
          subtitle="Active Members"
          icon={Award}
          color="var(--accent-purple)"
        />
        <StatCard
          title="Guest Turnout"
          value={nonMemberAttendees}
          subtitle="Non-members / External"
          icon={Clock}
          color="var(--accent-pink)"
        />
      </div>

      {/* Attendance Check-in Logs Table */}
      <Card title="📋 Real-time Gate Scan Ledger" headerBg="var(--accent-yellow)">
        <div className="neo-table-container">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Attendee Name</th>
                <th>Event</th>
                <th>Type</th>
                <th>Check-in Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 900 }}>{t.id}</td>
                  <td>
                    <div style={{ fontWeight: 900 }}>{t.attendeeName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{t.email}</div>
                  </td>
                  <td style={{ fontWeight: 800 }}>{t.eventTitle}</td>
                  <td>
                    <Badge variant={t.isMember ? 'purple' : 'yellow'}>
                      {t.isMember ? 'Member' : 'Guest'}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 800, color: t.checkInTime ? '#059669' : 'var(--ink-muted)' }}>
                    {t.checkInTime || 'Not checked in yet'}
                  </td>
                  <td>
                    <Badge variant={t.status === 'Attended' ? 'green' : t.status === 'Valid' ? 'yellow' : 'pink'}>
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
