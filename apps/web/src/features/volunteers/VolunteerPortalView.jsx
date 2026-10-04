import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Clock, Award, Receipt, Upload, Plus, CheckCircle2, User, Sparkles } from 'lucide-react';

export const VolunteerPortalView = ({ session, activeClub, onToast, onDataChange }) => {
  const [isLogHoursOpen, setIsLogHoursOpen] = useState(false);
  const [isSubmitReimbOpen, setIsSubmitReimbOpen] = useState(false);
  const [hoursToAdd, setHoursToAdd] = useState(4);
  
  // Reimbursement Form State
  const [reimbForm, setReimbForm] = useState({
    amount: 1200,
    category: 'Supplies & Printing',
    event: 'Club Activity & Workshop',
    description: 'Hardware cables and snack supplies',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400'
  });

  const club = clubService.getClub(activeClub.id);
  const currentVol = clubService.getVolunteerForUser(activeClub.id, session);

  const handleLogHours = () => {
    try {
      const updated = clubService.logVolunteerHours(activeClub.id, currentVol.id || session.email, hoursToAdd, session);
      setIsLogHoursOpen(false);
      if (onToast) onToast(`⏱️ Logged +${hoursToAdd} hours to database! Verified total: ${updated.hours}h`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitReimbursement = (e) => {
    e.preventDefault();
    try {
      const reimb = clubService.submitReimbursement(
        activeClub.id,
        {
          volunteerName: currentVol.name || session?.name,
          volunteerEmail: session?.email || currentVol.email,
          ...reimbForm
        },
        session
      );
      setIsSubmitReimbOpen(false);
      if (onToast) onToast(`🧾 Reimbursement claim ${reimb.id} submitted for approval!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Volunteer Hero */}
      <div
        className="neo-box"
        style={{
          background: 'linear-gradient(135deg, #C8B6FF 0%, #70E4A8 100%)',
          padding: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <Badge variant="black">Volunteer Service Portal</Badge>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '8px 0 4px' }}>
            Volunteer Hub — {currentVol.name} 🌟
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(0,0,0,0.85)' }}>
            Log service hours, submit expense claims with receipts, and track your gamified contribution badges.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="yellow" onClick={() => setIsLogHoursOpen(true)} icon={Clock}>
            Log Hours
          </Button>
          <Button variant="pink" onClick={() => setIsSubmitReimbOpen(true)} icon={Receipt}>
            Claim Expense Reimbursement
          </Button>
        </div>
      </div>

      {/* Volunteer Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Total Hours Logged"
          value={`${currentVol.hours}h`}
          subtitle="Verified Service"
          icon={Clock}
          color="var(--accent-yellow)"
        />
        <StatCard
          title="Gamified Tier"
          value={currentVol.badge || 'Silver Contributor'}
          subtitle="Badge Status"
          icon={Award}
          color="var(--accent-purple)"
        />
        <StatCard
          title="Organizer Rating"
          value={`⭐ ${currentVol.rating || '4.9'}`}
          subtitle="Peer Review Score"
          icon={Sparkles}
          color="var(--accent-green)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Skills & Assigned Tasks */}
        <Card title="🎯 Verified Skills & Competencies" headerBg="var(--accent-yellow)">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {(currentVol.skills && currentVol.skills.length > 0 ? currentVol.skills : ['Club Logistics', 'Operations', 'Event Coordination']).map((s, idx) => (
              <Badge key={idx} variant="purple" style={{ fontSize: '13px', padding: '6px 14px' }}>
                ✓ {s}
              </Badge>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 900, margin: 0 }}>
              📋 Assigned Event Logistics Tasks
            </h4>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)' }}>
              Assigned by Event Managers
            </span>
          </div>

          {(() => {
            const userIdentifier = (session?.name || '').toLowerCase();
            const userEmail = (session?.email || '').toLowerCase();
            const volName = (currentVol.name || '').toLowerCase();

            const myTasks = (club.tasks || []).filter(t => {
              const o = (t.owner || '').toLowerCase();
              const a = (t.assignedTo || '').toLowerCase();
              const e = (t.assignedVolunteerEmail || '').toLowerCase();
              return (volName && (o === volName || a === volName)) ||
                     (userIdentifier && (o === userIdentifier || a === userIdentifier)) ||
                     (userEmail && (e === userEmail || o.includes(userEmail.split('@')[0])));
            });

            if (myTasks.length === 0) {
              return (
                <div style={{ padding: '24px 16px', textAlign: 'center', backgroundColor: '#FAF5EE', border: '1.5px dashed #000', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>✨</div>
                  No active logistics tasks assigned to you right now. When the Event Manager assigns duties for upcoming events, they will appear here!
                </div>
              );
            }

            const handleQuickStatus = (taskId, newStatus, newProgress) => {
              try {
                clubService.updateTaskStatus(activeClub.id, taskId, newStatus, newProgress, session);
                if (onToast) onToast(`📋 Task marked as "${newStatus}"!`);
                if (onDataChange) onDataChange();
              } catch (err) {
                alert(err.message);
              }
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myTasks.map((task) => {
                  const isPending = task.status === 'Pending' || task.stage === 'To Do';
                  const isInProgress = task.status === 'In Progress' || task.stage === 'In Progress';
                  const isDone = task.status === 'Done' || task.stage === 'Done';

                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: '14px',
                        backgroundColor: isDone ? '#F0FDF4' : '#FAF5EE',
                        border: '2px solid #000',
                        borderRadius: '12px',
                        boxShadow: '2px 2px 0px #000',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          {task.eventName && (
                            <span
                              style={{
                                backgroundColor: '#E0E7FF',
                                color: '#3730A3',
                                border: '1.5px solid #121212',
                                borderRadius: '6px',
                                padding: '1px 6px',
                                fontSize: '10px',
                                fontWeight: 900,
                                marginBottom: '4px',
                                display: 'inline-block'
                              }}
                            >
                              🎟️ {task.eventName}
                            </span>
                          )}
                          <div style={{ fontWeight: 900, fontSize: '14px' }}>{task.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700, marginTop: '2px' }}>
                            Due: {task.deadline} • Priority: <span style={{ color: task.priority === 'Urgent' ? '#DC2626' : task.priority === 'High' ? '#D97706' : '#2563EB', fontWeight: 900 }}>{task.priority || 'Normal'}</span>
                          </div>
                        </div>
                        <Badge variant={isDone ? 'green' : isInProgress ? 'purple' : 'yellow'}>
                          {task.status || task.stage || 'Pending'}
                        </Badge>
                      </div>

                      {task.notes && (
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#4B5563', backgroundColor: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                          💬 Note: {task.notes}
                        </div>
                      )}

                      {/* Quick Status Change Action Buttons */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #D4D4D8' }}>
                        {isPending && (
                          <Button
                            variant="yellow"
                            size="sm"
                            style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => handleQuickStatus(task.id, 'In Progress', 50)}
                          >
                            Start Working →
                          </Button>
                        )}
                        {isInProgress && (
                          <>
                            <Button
                              variant="white"
                              size="sm"
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                              onClick={() => handleQuickStatus(task.id, 'Pending', 0)}
                            >
                              ← Back
                            </Button>
                            <Button
                              variant="green"
                              size="sm"
                              style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
                              onClick={() => handleQuickStatus(task.id, 'Done', 100)}
                            >
                              ✓ Mark Complete
                            </Button>
                          </>
                        )}
                        {isDone && (
                          <Button
                            variant="white"
                            size="sm"
                            style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => handleQuickStatus(task.id, 'In Progress', 50)}
                          >
                            ↩ Reopen Task
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>

        {/* Right: Submit Reimbursement Quick Card */}
        <Card title="🧾 Expense Claim Submission (FR-17)" headerBg="var(--accent-pink)">
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '14px' }}>
            Spent out-of-pocket on supplies or printing? Upload GST invoice bill and get direct UPI reimbursement upon Treasurer approval.
          </p>
          <Button variant="yellow" style={{ width: '100%' }} onClick={() => setIsSubmitReimbOpen(true)} icon={Receipt}>
            Open Reimbursement Claim Form
          </Button>
        </Card>
      </div>

      {/* Log Hours Modal */}
      <Modal
        isOpen={isLogHoursOpen}
        onClose={() => setIsLogHoursOpen(false)}
        title="⏱️ Log Volunteer Service Hours"
        headerColor="var(--accent-yellow)"
      >
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label className="neo-label">Select Hours to Add:</label>
            <input
              type="number"
              min="1"
              max="24"
              value={hoursToAdd}
              onChange={(e) => setHoursToAdd(Number(e.target.value))}
              className="neo-input"
            />
          </div>
          <Button variant="yellow" style={{ width: '100%' }} onClick={handleLogHours}>
            Confirm & Save to Record (+{hoursToAdd} Hours)
          </Button>
        </div>
      </Modal>

      {/* Submit Reimbursement Modal */}
      <Modal
        isOpen={isSubmitReimbOpen}
        onClose={() => setIsSubmitReimbOpen(false)}
        title="🧾 Submit Expense Reimbursement Claim"
        headerColor="var(--accent-pink)"
      >
        <form onSubmit={handleSubmitReimbursement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Claim Amount (₹) *</label>
            <input
              type="number"
              required
              value={reimbForm.amount}
              onChange={(e) => setReimbForm({ ...reimbForm, amount: e.target.value })}
              className="neo-input"
            />
          </div>

          <div>
            <label className="neo-label">Expense Category</label>
            <select
              value={reimbForm.category}
              onChange={(e) => setReimbForm({ ...reimbForm, category: e.target.value })}
              className="neo-input neo-select"
            >
              <option value="Supplies & Printing">Supplies & Printing</option>
              <option value="Equipment & Cables">Equipment & Cables</option>
              <option value="Food & Refreshments">Food & Refreshments</option>
              <option value="Decor & Stage">Decor & Stage</option>
              <option value="Transportation">Transportation</option>
            </select>
          </div>

          <div>
            <label className="neo-label">Event / Activity</label>
            <input
              type="text"
              value={reimbForm.event}
              onChange={(e) => setReimbForm({ ...reimbForm, event: e.target.value })}
              className="neo-input"
            />
          </div>

          <div>
            <label className="neo-label">Description of Purchase</label>
            <input
              type="text"
              placeholder="e.g. HDMI splitters and extension cords from PrintZone"
              value={reimbForm.description}
              onChange={(e) => setReimbForm({ ...reimbForm, description: e.target.value })}
              className="neo-input"
            />
          </div>

          {/* Receipt Preview */}
          <div>
            <label className="neo-label">Receipt Image Upload (Simulated Preview):</label>
            <div style={{ border: '2px dashed #000', borderRadius: '12px', padding: '12px', textAlign: 'center', backgroundColor: '#FAF5EE' }}>
              <img
                src={reimbForm.receiptUrl}
                alt="Receipt Preview"
                style={{ maxHeight: '120px', borderRadius: '8px', border: '1.5px solid #000', marginBottom: '8px' }}
              />
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                ✓ Sample Tax Invoice Attached
              </div>
            </div>
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '8px' }}>
            Submit Claim to Event Manager & Treasurer
          </Button>
        </form>
      </Modal>
    </div>
  );
};
