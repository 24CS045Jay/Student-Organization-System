import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Stepper } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { Receipt, CheckCircle2, XCircle, Clock, Eye, AlertTriangle } from 'lucide-react';

export const ReimbursementsView = ({ session, activeClub, onDataChange, onToast }) => {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const reimbursements = clubService.getReimbursements(activeClub.id);
  const approvalSteps = ['Submitted', 'Manager Review', 'Treasurer Approval', 'Payment Sent', 'Reimbursed'];

  const getStepIndex = (status) => {
    if (status === 'Submitted') return 0;
    if (status === 'Manager Approved') return 1;
    if (status === 'Treasurer Approved') return 2;
    if (status === 'Payment Sent') return 3;
    if (status === 'Reimbursed') return 4;
    return 0;
  };

  const handleAdvanceStatus = (claimId, currentStatus) => {
    const nextMap = {
      Submitted: 'Manager Approved',
      'Manager Approved': 'Treasurer Approved',
      'Treasurer Approved': 'Reimbursed',
      'Payment Sent': 'Reimbursed'
    };

    const nextStatus = nextMap[currentStatus] || 'Reimbursed';

    try {
      clubService.advanceReimbursementStatus(activeClub.id, claimId, nextStatus, session);
      if (nextStatus === 'Reimbursed' && onToast) {
        onToast(`💸 Claim ${claimId} Reimbursed! Automatically recorded in Expense Ledger.`);
      } else if (onToast) {
        onToast(`✅ Claim advanced to: ${nextStatus}`);
      }
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = () => {
    if (!selectedClaim) return;
    try {
      clubService.advanceReimbursementStatus(activeClub.id, selectedClaim.id, 'Rejected', session);
      setIsRejectOpen(false);
      if (onToast) onToast(`❌ Claim ${selectedClaim.id} marked as Rejected.`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const isTreasurerOrAdmin = session.role === 'treasurer' || session.role === 'admin' || session.role === 'event_manager';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
          Expense Claims & Reimbursement Approval (FR-17)
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          Multi-stage verification: Volunteer submit → Manager audit → Treasurer disbursement → Auto expense entry for {activeClub.name}.
        </p>
      </div>

      {reimbursements.length === 0 ? (
        <Card title="No Claims on Record" headerBg="var(--accent-yellow)">
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>🧾</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900 }}>No reimbursement claims pending</h3>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reimbursements.map((r) => {
            const stepIdx = getStepIndex(r.status);
            const isFinished = r.status === 'Reimbursed' || r.status === 'Rejected';

            return (
              <Card
                key={r.id}
                title={`Claim ID: ${r.id} • ${r.volunteerName} (${inr(r.amount)})`}
                headerBg={r.status === 'Reimbursed' ? 'var(--accent-green)' : r.status === 'Rejected' ? '#FEE2E2' : 'var(--accent-yellow)'}
                headerAction={
                  <Badge variant={r.status === 'Reimbursed' ? 'green' : r.status === 'Rejected' ? 'pink' : 'yellow'}>
                    {r.status}
                  </Badge>
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'center' }}>
                  {/* Left: Stepper & Details */}
                  <div>
                    <Stepper steps={approvalSteps} activeIndex={stepIdx} />
                    <div style={{ marginTop: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong>Category:</strong> {r.category}</div>
                      <div><strong>Event:</strong> {r.event}</div>
                      <div><strong>Description:</strong> {r.description}</div>
                      <div style={{ color: 'var(--ink-muted)' }}><strong>Date:</strong> {r.date} • Approver: {r.approver || 'Pending'}</div>
                    </div>
                  </div>

                  {/* Right: Receipt & Actions */}
                  <div style={{ backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={r.receiptUrl}
                        alt="Receipt"
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #000' }}
                      />
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '14px' }}>GST Tax Invoice Attached</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>Verified merchant receipt</div>
                      </div>
                    </div>

                    {isTreasurerOrAdmin && !isFinished && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <Button
                          variant="yellow"
                          size="sm"
                          style={{ flex: 1 }}
                          onClick={() => handleAdvanceStatus(r.id, r.status)}
                        >
                          Approve ({r.status === 'Submitted' ? 'Step 1: Manager' : 'Step 2: Treasurer & Pay'})
                        </Button>
                        <Button
                          variant="pink"
                          size="sm"
                          onClick={() => {
                            setSelectedClaim(r);
                            setIsRejectOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="❌ Reject Reimbursement Claim"
        headerColor="#FEE2E2"
      >
        <div>
          <label className="neo-label">Reason for Rejection *</label>
          <textarea
            rows={3}
            placeholder="e.g. Missing official GST tax invoice or duplicate claim..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="neo-input"
            style={{ marginBottom: '16px' }}
          />
          <Button variant="pink" style={{ width: '100%' }} onClick={handleReject}>
            Confirm Rejection & Notify Volunteer
          </Button>
        </div>
      </Modal>
    </div>
  );
};
