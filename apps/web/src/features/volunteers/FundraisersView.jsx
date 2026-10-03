import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Drawer, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { HeartHandshake, Plus, Users, Gift, CheckCircle2 } from 'lucide-react';

export const FundraisersView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [donateAmt, setDonateAmt] = useState(1000);
  const [donorName, setDonorName] = useState(session.name || 'Alumni Supporter');
  const [isAnon, setIsAnon] = useState(false);

  const club = clubService.getClub(activeClub.id);
  const fundraisers = club.fundraisers || [];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Club Campaigns & Fundraising Drives
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Empower initiatives, hardware lab kits, and student scholarships for {activeClub.name}.
          </p>
        </div>
        <Button variant="yellow" size="sm" onClick={() => setIsCreateOpen(true)} icon={Plus}>
          Launch New Campaign
        </Button>
      </div>

      {fundraisers.length === 0 ? (
        <Card title="No Active Campaigns" headerBg="var(--accent-yellow)">
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>🤝</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900 }}>No active fundraising campaigns yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontWeight: 700 }}>
              Launch a community drive to fund equipment, kits, and social causes.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {fundraisers.map((fund) => {
            const pct = Math.min(100, Math.round((fund.raised / fund.target) * 100));

            return (
              <Card
                key={fund.id}
                title={fund.title}
                headerBg="var(--accent-pink)"
                headerAction={<Badge variant="green">{fund.status}</Badge>}
              >
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
                  {fund.description}
                </p>

                {/* Progress Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 900, marginBottom: '4px' }}>
                    <span>Raised ₹{fund.raised.toLocaleString()}</span>
                    <span>Target ₹{fund.target.toLocaleString()} ({pct}%)</span>
                  </div>
                  <ProgressBar value={fund.raised} max={fund.target} color="var(--accent-green)" height={12} />
                </div>

                <div style={{ backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Organizer</span>
                    <div style={{ fontWeight: 900 }}>{fund.organizer}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Donors</span>
                    <div style={{ fontWeight: 900 }}>{fund.donorCount} Supporters</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Duration</span>
                    <div style={{ fontWeight: 900 }}>{fund.startDate} to {fund.endDate}</div>
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

      {/* Donate Modal */}
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
              {[500, 1000, 2500, 5000].map(amt => (
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
