import React, { useState } from 'react';
import { Card, Button, Badge, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Shield, Search, Filter, Clock, User, Download } from 'lucide-react';

export const AuditLogView = ({ session, activeClub, onToast }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const logs = clubService.getAuditLogs(session.role === 'super_admin' ? null : activeClub.id);

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
    l.user.toLowerCase().includes(filterQuery.toLowerCase()) ||
    l.details.toLowerCase().includes(filterQuery.toLowerCase()) ||
    l.orgId.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Badge variant="black">NFR-10 Immutable Audit Ledger Trail</Badge>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '8px 0 0' }}>
            System Audit Trail & State Transitions
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Every mutation, budget update, ticket scan, and approval is immutably logged with before/after state diffs.
          </p>
        </div>
        <Button variant="yellow" size="sm" onClick={() => onToast && onToast('📄 Audit Log JSON exported.')} icon={Download}>
          Export Audit Trail
        </Button>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Filter audit actions, users, or detail diffs..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="neo-input"
          style={{ paddingLeft: '38px' }}
        />
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--ink-muted)' }} />
      </div>

      <Card title="📜 Immutable Audit Records" headerBg="var(--accent-yellow)">
        <div className="neo-table-container">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Tenant Org</th>
                <th>User & Role</th>
                <th>Action Triggered</th>
                <th>Details Description</th>
                <th>Before State</th>
                <th>After State</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                    {log.timestamp}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, textTransform: 'uppercase', backgroundColor: '#FAF4E8', padding: '2px 6px', border: '1px solid #000', borderRadius: '4px' }}>
                      {log.orgId}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 900 }}>{log.user}</div>
                    <Badge variant={log.role === 'Treasurer' ? 'green' : log.role === 'Admin' ? 'yellow' : 'purple'}>
                      {log.role}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 900 }}>{log.action}</td>
                  <td style={{ fontSize: '12px', color: 'var(--ink)' }}>{log.details}</td>
                  <td>
                    <span style={{ fontSize: '11px', color: '#DC2626', backgroundColor: '#FEE2E2', padding: '2px 6px', border: '1px solid #000', borderRadius: '4px', fontWeight: 800 }}>
                      {log.oldValue || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', color: '#059669', backgroundColor: '#DCFCE7', padding: '2px 6px', border: '1px solid #000', borderRadius: '4px', fontWeight: 800 }}>
                      {log.newValue}
                    </span>
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
