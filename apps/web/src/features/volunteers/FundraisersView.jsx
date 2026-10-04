import React, { useState } from 'react';
import { Card, Button, Badge, Modal, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import {
  HeartHandshake,
  Plus,
  Users,
  Gift,
  CheckCircle2,
  Trash2,
  Calendar,
  Target,
  Sparkles,
  Check
} from 'lucide-react';

const CAMPAIGN_CATEGORIES = [
  'Hardware & Lab Equipment',
  'Event Sponsorship & Hackathon',
  'Community Outreach & Charity',
  'Student Scholarship & Aid',
  'Infrastructure & Club Hub',
  'General Drive'
];

export const FundraisersView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [donateAmt, setDonateAmt] = useState(1000);
  const [donorName, setDonorName] = useState(session.name || 'Alumni Supporter');
  const [isAnon, setIsAnon] = useState(false);

  // New Campaign Form State
  const defaultEndDate = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
  const defaultStartDate = new Date().toISOString().split('T')[0];

  const initialCampaignForm = {
    title: '',
    category: 'Hardware & Lab Equipment',
    target: 25000,
    organizer: session?.name || 'Club President',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    description: '',
    assignedVolunteers: []
  };

  const [campaignForm, setCampaignForm] = useState(initialCampaignForm);

  const club = clubService.getClub(activeClub.id);
  const fundraisers = clubService.getFundraisers(activeClub.id);
  const volunteers = clubService.getVolunteers(activeClub.id) || [];

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!campaignForm.title.trim()) {
      alert('Please enter a campaign title');
      return;
    }

    if (!campaignForm.target || Number(campaignForm.target) <= 0) {
      alert('Target goal amount must be greater than zero');
      return;
    }

    try {
      const created = clubService.createFundraiser(
        activeClub.id,
        {
          title: campaignForm.title.trim(),
          category: campaignForm.category,
          target: Number(campaignForm.target),
          goal: Number(campaignForm.target),
          organizer: campaignForm.organizer.trim(),
          startDate: campaignForm.startDate,
          endDate: campaignForm.endDate,
          deadline: campaignForm.endDate,
          description: campaignForm.description.trim(),
          assignedVolunteers: campaignForm.assignedVolunteers
        },
        session
      );

      setIsCreateOpen(false);
      setCampaignForm(initialCampaignForm);
      if (onToast) onToast(`🚀 Successfully launched "${created.title}" with target ₹${created.target.toLocaleString()}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCampaign = (fund) => {
    if (window.confirm(`Are you sure you want to remove the fundraising campaign "${fund.title}"?`)) {
      try {
        clubService.deleteFundraiser(activeClub.id, fund.id, session);
        if (onToast) onToast(`🗑️ Removed campaign "${fund.title}"`);
        if (onDataChange) onDataChange();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleToggleVolunteer = (volName) => {
    setCampaignForm((prev) => {
      const exists = prev.assignedVolunteers.includes(volName);
      return {
        ...prev,
        assignedVolunteers: exists
          ? prev.assignedVolunteers.filter((v) => v !== volName)
          : [...prev.assignedVolunteers, volName]
      };
    });
  };

  const handleDonate = () => {
    try {
      clubService.createDonation(
        activeClub.id,
        {
          donorName,
          amount: Number(donateAmt),
          campaignId: selectedFund?.id,
          campaign: selectedFund?.title || 'Fundraiser',
          anonymous: isAnon
        },
        session
      );
      setIsDonateOpen(false);
      if (onToast) onToast(`❤️ Thank you! Donation of ₹${donateAmt} recorded!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Club Campaigns & Fundraising Drives
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Empower initiatives, hardware lab kits, and student scholarships for {activeClub.name}.
          </p>
        </div>
        <Button
          variant="yellow"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          icon={Plus}
          style={{ boxShadow: '4px 4px 0px #000' }}
        >
          Launch New Campaign
        </Button>
      </div>

      {fundraisers.length === 0 ? (
        <Card title="No Active Campaigns" headerBg="var(--accent-yellow)">
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '50px' }}>🤝</div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>No active fundraising campaigns yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontWeight: 700, maxWidth: '420px' }}>
              Launch a community drive to fund equipment, hackathon prizes, lab kits, and social causes.
            </p>
            <Button variant="yellow" onClick={() => setIsCreateOpen(true)} icon={Plus}>
              Launch Your First Campaign
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {fundraisers.map((fund) => {
            const targetVal = Number(fund.target || fund.goal || 1);
            const raisedVal = Number(fund.raised || 0);
            const pct = Math.min(100, Math.round((raisedVal / targetVal) * 100));

            return (
              <Card
                key={fund.id}
                title={fund.title}
                headerBg="var(--accent-pink)"
                headerAction={
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Badge variant={pct >= 100 ? 'yellow' : 'green'}>
                      {pct >= 100 ? 'Goal Reached!' : fund.status || 'Active'}
                    </Badge>
                    {session?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(fund)}
                        title="Delete Campaign"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#000'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                }
              >
                {fund.category && (
                  <div style={{ marginBottom: '8px' }}>
                    <Badge variant="blue">{fund.category}</Badge>
                  </div>
                )}

                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
                  {fund.description || 'Community fundraising drive for student projects and club equipment.'}
                </p>

                {/* Progress Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 900, marginBottom: '4px' }}>
                    <span>Raised ₹{raisedVal.toLocaleString()}</span>
                    <span>Target ₹{targetVal.toLocaleString()} ({pct}%)</span>
                  </div>
                  <ProgressBar value={raisedVal} max={targetVal} color="var(--accent-green)" height={12} />
                </div>

                <div style={{ backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Organizer</span>
                    <div style={{ fontWeight: 900 }}>{fund.organizer || 'Club Executive Team'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Donors</span>
                    <div style={{ fontWeight: 900 }}>{fund.donorCount || 0} Supporters</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Duration</span>
                    <div style={{ fontWeight: 900 }}>{fund.startDate || 'Ongoing'} to {fund.endDate || fund.deadline || '2026-11-30'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Volunteer Team</span>
                    <div style={{ fontWeight: 900 }}>{(fund.assignedVolunteers || []).length} Members</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    variant="yellow"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setSelectedFund(fund);
                      setIsDonateOpen(true);
                    }}
                    icon={Gift}
                  >
                    Donate to Fund
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LAUNCH NEW CAMPAIGN */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="🚀 Launch New Fundraising Campaign"
        headerColor="var(--accent-yellow)"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="neo-label">Campaign Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. AI Robotics Lab Hardware Fund, Annual Hackathon Travel Grant..."
              className="neo-input"
              value={campaignForm.title}
              onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Category</label>
              <select
                className="neo-input neo-select"
                value={campaignForm.category}
                onChange={(e) => setCampaignForm({ ...campaignForm, category: e.target.value })}
              >
                {CAMPAIGN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="neo-label">Target Goal Amount (₹) *</label>
              <input
                type="number"
                min="500"
                step="500"
                required
                className="neo-input"
                value={campaignForm.target}
                onChange={(e) => setCampaignForm({ ...campaignForm, target: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label className="neo-label" style={{ fontSize: '11px' }}>Campaign Lead / Organizer</label>
              <input
                type="text"
                required
                className="neo-input"
                value={campaignForm.organizer}
                onChange={(e) => setCampaignForm({ ...campaignForm, organizer: e.target.value })}
              />
            </div>
            <div>
              <label className="neo-label" style={{ fontSize: '11px' }}>Start Date</label>
              <input
                type="date"
                required
                className="neo-input"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="neo-label" style={{ fontSize: '11px' }}>Deadline / End Date</label>
              <input
                type="date"
                required
                className="neo-input"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Campaign Purpose & Description *</label>
            <textarea
              rows="3"
              required
              className="neo-input"
              placeholder="Explain the mission, equipment to purchase, beneficiary student groups, and impact of the funds..."
              value={campaignForm.description}
              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
            />
          </div>

          {/* Volunteer Team Assignee Chips */}
          {volunteers.length > 0 && (
            <div>
              <label className="neo-label">Assign Volunteer Support Team:</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
                {volunteers.map((vol) => {
                  const isSelected = campaignForm.assignedVolunteers.includes(vol.name);
                  return (
                    <button
                      key={vol.id}
                      type="button"
                      onClick={() => handleToggleVolunteer(vol.name)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: isSelected ? '2px solid #000' : '1.5px solid #D1D5DB',
                        backgroundColor: isSelected ? '#FEF08A' : '#FFF',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {vol.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="white" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" icon={Check}>
              Launch Campaign Now
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: DONATE TO FUND */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        title={`❤️ Donate to: ${selectedFund?.title}`}
        headerColor="var(--accent-pink)"
      >
        <div>
          <div style={{ marginBottom: '14px' }}>
            <label className="neo-label">Donation Amount (₹):</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {[500, 1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDonateAmt(amt)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: donateAmt === amt ? '2.5px solid #000' : '1.5px solid #E4E4E7',
                    backgroundColor: donateAmt === amt ? 'var(--accent-yellow)' : '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={donateAmt}
              onChange={(e) => setDonateAmt(Number(e.target.value))}
              className="neo-input"
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="neo-label">Donor Name:</label>
            <input
              type="text"
              disabled={isAnon}
              value={isAnon ? 'Anonymous Supporter' : donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '10px', marginBottom: '18px' }}>
            <input
              type="checkbox"
              id="anonDonCheck"
              checked={isAnon}
              onChange={(e) => setIsAnon(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="anonDonCheck" style={{ fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
              Keep my donation anonymous on public donor wall
            </label>
          </div>

          <Button variant="yellow" style={{ width: '100%' }} onClick={handleDonate}>
            Confirm Donation of ₹{donateAmt} & Generate 80G Receipt
          </Button>
        </div>
      </Modal>
    </div>
  );
};
