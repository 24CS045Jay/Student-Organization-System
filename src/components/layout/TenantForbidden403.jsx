import React from 'react';
import { Card, Button, Badge } from '../ui/index';
import { ShieldAlert, ArrowLeft, Lock, RefreshCw } from 'lucide-react';

export const TenantForbidden403 = ({
  userRole,
  userOrg,
  requiredRole,
  onResetToHome,
  onOpenQuickLogin
}) => {
  return (
    <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px' }}>
      <Card
        title="403 Forbidden — Access Restricted"
        headerBg="var(--accent-pink)"
        style={{ border: '3.5px solid #121212', boxShadow: '8px 8px 0px #121212' }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              backgroundColor: '#FEE2E2',
              border: '3px solid #121212',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              boxShadow: '4px 4px 0px #121212',
              marginBottom: '20px'
            }}
          >
            🚫
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '8px' }}>
            Cross-Tenant / Unauthorized Route
          </h2>

          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '480px', margin: '0 auto 20px' }}>
            Under <strong>NFR-03 Security & Tenant Isolation Rules</strong>, your current role (<strong>{userRole}</strong> in organization <strong>{userOrg}</strong>) does not have permission to access this module.
          </p>

          <div
            style={{
              backgroundColor: '#FAF5EE',
              border: '2px solid #121212',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'left',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Lock size={16} />
              <span style={{ fontWeight: 900 }}>Enforced Safeguards:</span>
            </div>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Club financial books and member PII are isolated per-tenant.</li>
              <li>Only <strong>{requiredRole || 'Admin/Treasurer'}</strong> accounts can view this ledger.</li>
              <li>Attempted unauthorized query was recorded in the immutable audit log.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Button variant="yellow" onClick={onResetToHome} icon={ArrowLeft}>
              Return to Authorized Workspace
            </Button>
            <Button variant="black" onClick={onOpenQuickLogin} icon={RefreshCw}>
              Switch Role / Club
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
