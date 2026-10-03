import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Stepper } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { Receipt, CheckCircle2, XCircle, Clock, Eye, AlertTriangle, Plus, FileText, Upload, Filter, Sparkles } from 'lucide-react';

export const ReimbursementsView = ({ session, activeClub, onDataChange, onToast }) => {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterMode, setFilterMode] = useState(session?.role === 'volunteer' ? 'my' : 'all'); // 'my' | 'all'

  // New claim form state
  const [newClaim, setNewClaim] = useState({
    amount: 1250,
    category: 'Supplies & Printing',
    event: 'General Club Operations',
    description: '',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    notes: ''
  });

  const reimbursements = clubService.getReimbursements(activeClub.id);
  const clubEvents = (activeClub?.events || []).map(e => e.title);
  const approvalSteps = ['Submitted', 'Manager Review', 'Treasurer Approval', 'Payment Sent', 'Reimbursed'];

  const isTreasurerOrAdmin = session?.role === 'treasurer' || session?.role === 'admin' || session?.role === 'event_manager';
  const isVolunteer = session?.role === 'volunteer';

  const userEmail = (session?.email || '').toLowerCase().trim();
  const userName = (session?.name || '').toLowerCase().trim();

  // Filter claims
  const displayClaims = filterMode === 'my'
    ? reimbursements.filter(r => 
        (r.volunteerEmail && userEmail && r.volunteerEmail.toLowerCase() === userEmail) ||
        (r.volunteerName && userName && r.volunteerName.toLowerCase() === userName)
      )
    : reimbursements;

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

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newClaim.amount || Number(newClaim.amount) <= 0) {
      alert('Please enter a valid expense amount in ₹.');
      return;
    }
    if (!newClaim.description.trim()) {
      alert('Please describe what items or services were purchased.');
      return;
    }

    try {
      const created = clubService.submitReimbursement(
        activeClub.id,
        {
          volunteerName: session?.name || 'Club Volunteer',
          volunteerEmail: session?.email || 'volunteer@campus.edu',
          amount: Number(newClaim.amount),
          category: newClaim.category,
          event: newClaim.event,
          description: newClaim.description,
          receiptUrl: newClaim.receiptUrl,
          notes: newClaim.notes
        },
        session
      );

      setIsCreateOpen(false);
      setNewClaim({
        amount: 1250,
        category: 'Supplies & Printing',
        event: 'General Club Operations',
        description: '',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        notes: ''
      });

      if (onToast) onToast(`🧾 Claim #${created.id} submitted! Status: Submitted (Awaiting Review)`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            {isVolunteer ? 'My Expense Claims & Reimbursements 🧾' : 'Expense Claims & Reimbursement Approval (FR-17)'}
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            {isVolunteer
              ? `File out-of-pocket receipts and track reimbursement approval stages for ${activeClub.name}.`
              : `Multi-stage verification: Volunteer submit → Manager audit → Treasurer disbursement → Auto expense ledger entry.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Filter toggle if volunteer has filed claims or wants to see all */}
          <div style={{ display: 'flex', border: '2px solid #000', borderRadius: '10px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setFilterMode('my')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: filterMode === 'my' ? 'var(--accent-yellow)' : '#FFF',
                fontWeight: 900,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              My Claims ({reimbursements.filter(r => (r.volunteerEmail && userEmail && r.volunteerEmail.toLowerCase() === userEmail) || (r.volunteerName && userName && r.volunteerName.toLowerCase() === userName)).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                padding: '6px 14px',
                borderLeft: '2px solid #000',
                borderTop: 'none',
                borderBottom: 'none',
                borderRight: 'none',
                background: filterMode === 'all' ? 'var(--accent-yellow)' : '#FFF',
                fontWeight: 900,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              All Claims ({reimbursements.length})
            </button>
          </div>

          {/* Primary Action Button to File Claim */}
          <Button variant="pink" size="sm" onClick={() => setIsCreateOpen(true)} icon={Plus}>
            File New Claim
          </Button>
        </div>
      </div>

      {/* Volunteer Helper Tip Banner */}
      {isVolunteer && (
        <div
          className="neo-box"
          style={{
            backgroundColor: '#E0F2FE',
            border: '2px solid #000',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '24px' }}>💡</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369A1' }}>
            <strong>How reimbursement works:</strong> Submit your purchase receipt with a clear GST bill. The Event Manager audits your claim, followed by Treasurer disbursement directly to your student bank / UPI account.
          </div>
        </div>
      )}

      {/* Claims List View */}
      {displayClaims.length === 0 ? (
        <Card title="No Reimbursement Claims Found" headerBg="var(--accent-yellow)">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧾</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>
              {filterMode === 'my' ? 'You have not submitted any claims yet' : 'No claims found in organization records'}
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
              Incurred an out-of-pocket expense for club supplies or event logistics? File a claim now.
            </p>
            <Button variant="pink" onClick={() => setIsCreateOpen(true)} icon={Plus}>
              Submit Expense Receipt
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayClaims.map((r) => {
            const stepIdx = getStepIndex(r.status);
            const isFinished = r.status === 'Reimbursed' || r.status === 'Rejected';
            const isMyClaim = (r.volunteerEmail && userEmail && r.volunteerEmail.toLowerCase() === userEmail) ||
                              (r.volunteerName && userName && r.volunteerName.toLowerCase() === userName);

            return (
              <Card
                key={r.id}
                title={`Claim ID: ${r.id} • ${r.volunteerName} (${inr(r.amount)}) ${isMyClaim ? '★ (Your Claim)' : ''}`}
                headerBg={r.status === 'Reimbursed' ? 'var(--accent-green)' : r.status === 'Rejected' ? '#FEE2E2' : 'var(--accent-yellow)'}
                headerAction={
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Badge variant={r.status === 'Reimbursed' ? 'green' : r.status === 'Rejected' ? 'pink' : 'yellow'}>
                      {r.status}
                    </Badge>
                  </div>
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'center' }}>
                  {/* Left: Stepper & Details */}
                  <div>
                    <Stepper steps={approvalSteps} activeIndex={stepIdx} />
                    <div style={{ marginTop: '14px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div><strong>Category:</strong> <Badge variant="black">{r.category}</Badge></div>
                      <div><strong>Event / Activity:</strong> {r.event || 'General Operations'}</div>
                      <div><strong>Description:</strong> {r.description}</div>
                      <div style={{ color: 'var(--ink-muted)', fontSize: '12px' }}>
                        <strong>Filed On:</strong> {r.date} • <strong>Approver:</strong> {r.approver || 'Pending Stage Review'}
                      </div>
                      {r.notes && (
                        <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#4B5563' }}>
                          <strong>Notes:</strong> {r.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Receipt & Actions */}
                  <div style={{ backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={r.receiptUrl}
                        alt="Receipt"
                        style={{ width: '68px', height: '68px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #000' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400';
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '14px' }}>GST Tax Invoice Attached</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                          Verified vendor bill attached
                        </div>
                        <a
                          href={r.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '11px', fontWeight: 900, color: '#2563EB', textDecoration: 'underline', marginTop: '2px', display: 'inline-block' }}
                        >
                          View Full Image ↗
                        </a>
                      </div>
                    </div>

                    {/* Volunteer Status Explainer */}
                    {!isTreasurerOrAdmin && (
                      <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 700, padding: '8px 10px', borderRadius: '8px', background: r.status === 'Reimbursed' ? '#DCFCE7' : r.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7', border: '1.5px solid #000' }}>
                        {r.status === 'Submitted' && '⏳ Status: Waiting for Event Manager review.'}
                        {r.status === 'Manager Approved' && '⚡ Manager Approved: Waiting for Treasurer disbursement.'}
                        {r.status === 'Treasurer Approved' && '💳 Approved: Disbursing funds to your account.'}
                        {r.status === 'Reimbursed' && '✅ Disbursed: Full amount reimbursed to your account.'}
                        {r.status === 'Rejected' && '❌ Rejected: Claim did not meet audit guidelines.'}
                      </div>
                    )}

                    {/* Treasurer & Admin Dual-stage Approval Action Buttons */}
                    {isTreasurerOrAdmin && !isFinished && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <Button
                          variant="yellow"
                          size="sm"
                          style={{ flex: 1 }}
                          onClick={() => handleAdvanceStatus(r.id, r.status)}
                        >
                          Approve ({r.status === 'Submitted' ? 'Step 1: Manager' : 'Step 2: Treasurer Disburse'})
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

      {/* Modal 1: File New Claim */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="🧾 Submit Reimbursement Claim"
        headerColor="var(--accent-pink)"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Amount in INR (₹) *</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                className="neo-input"
                placeholder="1200"
                value={newClaim.amount}
                onChange={(e) => setNewClaim({ ...newClaim, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="neo-label">Expense Category *</label>
              <select
                className="neo-input"
                value={newClaim.category}
                onChange={(e) => setNewClaim({ ...newClaim, category: e.target.value })}
              >
                <option value="Supplies & Printing">Supplies & Printing</option>
                <option value="Venue & AV Setup">Venue & AV Setup</option>
                <option value="Refreshments & Catering">Refreshments & Catering</option>
                <option value="Logistics & Transport">Logistics & Transport</option>
                <option value="Prizes, Trophies & Swag">Prizes, Trophies & Swag</option>
                <option value="Equipment & Hardware">Equipment & Hardware</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="neo-label">Associated Club Event / Project</label>
            <select
              className="neo-input"
              value={newClaim.event}
              onChange={(e) => setNewClaim({ ...newClaim, event: e.target.value })}
            >
              <option value="General Club Operations">General Club Operations</option>
              {clubEvents.map(evt => (
                <option key={evt} value={evt}>{evt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="neo-label">Itemized Expense Description *</label>
            <textarea
              rows={2}
              required
              className="neo-input"
              placeholder="e.g. Purchased 50 badge clips and lanyard ribbons for hackathon..."
              value={newClaim.description}
              onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
            />
          </div>

          <div>
            <label className="neo-label">Receipt / GST Invoice Image URL *</label>
            <input
              type="text"
              required
              className="neo-input"
              value={newClaim.receiptUrl}
              onChange={(e) => setNewClaim({ ...newClaim, receiptUrl: e.target.value })}
            />
            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800 }}>Sample Presets:</span>
              <button
                type="button"
                onClick={() => setNewClaim({ ...newClaim, receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400' })}
                style={{ fontSize: '11px', padding: '2px 8px', border: '1px solid #000', borderRadius: '4px', cursor: 'pointer', background: '#FEF3C7', fontWeight: 700 }}
              >
                GST Invoice
              </button>
              <button
                type="button"
                onClick={() => setNewClaim({ ...newClaim, receiptUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400' })}
                style={{ fontSize: '11px', padding: '2px 8px', border: '1px solid #000', borderRadius: '4px', cursor: 'pointer', background: '#E0F2FE', fontWeight: 700 }}
              >
                Logistics & Box Bill
              </button>
            </div>
          </div>

          <div>
            <label className="neo-label">Notes for Treasurer / Manager</label>
            <input
              type="text"
              className="neo-input"
              placeholder="e.g. Paid via Google Pay at Campus Stationery"
              value={newClaim.notes}
              onChange={(e) => setNewClaim({ ...newClaim, notes: e.target.value })}
            />
          </div>

          <Button variant="pink" type="submit" style={{ width: '100%', marginTop: '6px' }}>
            Submit Claim for Manager Review
          </Button>
        </form>
      </Modal>

      {/* Modal 2: Reject Claim */}
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
