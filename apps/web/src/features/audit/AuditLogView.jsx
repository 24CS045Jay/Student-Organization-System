import React, { useState } from 'react';
import { Card, Button, Badge } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Shield, Search, Download, FileText, FileSpreadsheet } from 'lucide-react';

export const AuditLogView = ({ session, activeClub, onToast }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const logs = clubService.getAuditLogs(session.role === 'super_admin' ? null : activeClub.id);

  const filteredLogs = logs.filter(l =>
    (l.action || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (l.user || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (l.details || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (l.orgId || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleExportAuditTrail = (format = 'csv') => {
    try {
      const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs;
      if (!dataToExport || dataToExport.length === 0) {
        if (onToast) onToast('⚠️ No audit logs available to export.');
        return;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const clubPrefix = activeClub?.short || activeClub?.id || 'clubsphere';

      if (format === 'json') {
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${clubPrefix}_audit_trail_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        if (onToast) onToast(`💾 Exported ${dataToExport.length} audit records to JSON!`);
      } else {
        // CSV format
        const headers = ['ID', 'Timestamp', 'Tenant Org', 'User', 'Role', 'Action', 'Details', 'Before State', 'After State'];
        const rows = dataToExport.map(l => [
          `"${(l.id || '').replace(/"/g, '""')}"`,
          `"${(l.timestamp || '').replace(/"/g, '""')}"`,
          `"${(l.orgId || '').replace(/"/g, '""')}"`,
          `"${(l.user || '').replace(/"/g, '""')}"`,
          `"${(l.role || '').replace(/"/g, '""')}"`,
          `"${(l.action || '').replace(/"/g, '""')}"`,
          `"${(l.details || '').replace(/"/g, '""')}"`,
          `"${(l.oldValue || '').toString().replace(/"/g, '""')}"`,
          `"${(l.newValue || '').toString().replace(/"/g, '""')}"`
        ].join(','));

        const csvString = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${clubPrefix}_audit_trail_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        if (onToast) onToast(`📄 Exported ${dataToExport.length} audit records to CSV!`);
      }
    } catch (err) {
      if (onToast) onToast(`❌ Export failed: ${err.message}`);
    }
  };

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="yellow"
            size="sm"
            onClick={() => handleExportAuditTrail('csv')}
            icon={Download}
            style={{ boxShadow: '3px 3px 0px #000' }}
          >
            Export Audit Trail (CSV)
          </Button>
          <Button
            variant="white"
            size="sm"
            onClick={() => handleExportAuditTrail('json')}
            icon={FileText}
          >
            JSON
          </Button>
        </div>
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

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>📜 Immutable Audit Records</span>
            <span style={{ fontSize: '12px', fontWeight: 800, opacity: 0.85 }}>
              Showing {filteredLogs.length} of {logs.length} logged events
            </span>
          </div>
        }
        headerBg="var(--accent-yellow)"
      >
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px' }}>
            <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink-muted)' }}>
              No audit records matching "{filterQuery}"
            </p>
          </div>
        ) : (
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
        )}
      </Card>
    </div>
  );
};
