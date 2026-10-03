import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { Building, Plus, Trash2, CheckCircle2, Award } from 'lucide-react';

export const SponsorsView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddSponsorOpen, setIsAddSponsorOpen] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({
    company: '',
    tier: 'Gold Sponsor',
    amount: 30000,
    contact: ''
  });

  const club = clubService.getClub(activeClub.id);
  const sponsors = club.sponsors || [];

  const handleOpenAdd = () => {
    setSponsorForm({
      company: '',
      tier: 'Gold Sponsor',
      amount: 30000,
      contact: ''
    });
    setIsAddSponsorOpen(true);
  };

  const handleAddSponsor = (e) => {
    e.preventDefault();
    if (!sponsorForm.company.trim()) return;
    try {
      clubService.addSponsor(
        activeClub.id,
        {
          company: sponsorForm.company,
          tier: sponsorForm.tier,
          amount: Number(sponsorForm.amount) || 0,
          contact: sponsorForm.contact || 'partnerships@company.com',
          perks: ['Logo on banners', 'Keynote address slot', 'Booth in arena']
        },
        session
      );
      setIsAddSponsorOpen(false);
      if (onToast) onToast(`🏢 Confirmed sponsorship with ${sponsorForm.company}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSponsor = (sp) => {
    if (!window.confirm(`Delete sponsor agreement with ${sp.company || sp.name}?`)) return;
    try {
      clubService.deleteSponsor(activeClub.id, sp.id, session);
      if (onToast) onToast(`🗑️ Removed sponsor agreement with ${sp.company || sp.name}`);
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
            Sponsors, Corporate Packages & Contracts (Item J)
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Manage corporate sponsorships, branding commitments, and deliverables for {activeClub.name}.
          </p>
        </div>
        <Button variant="yellow" size="sm" onClick={handleOpenAdd} icon={Plus}>
          Add Sponsor Agreement
        </Button>
      </div>

      {sponsors.length === 0 ? (
        <Card title="No Corporate Sponsors Yet" headerBg="var(--accent-yellow)">
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                fontSize: '44px',
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                backgroundColor: '#FEF9C3',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000'
              }}
            >
              🏢
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0' }}>
              No Active Sponsor Agreements
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '420px' }}>
              Add corporate industry partners, hackathon title sponsors, and event stall packages to monetize club initiatives.
            </p>
            <Button variant="yellow" onClick={handleOpenAdd} icon={Plus}>
              Register First Sponsor Agreement
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {sponsors.map((sp) => (
            <Card
              key={sp.id}
              title={sp.company || sp.name}
              headerBg={sp.tier.includes('Platinum') ? 'var(--accent-yellow)' : 'var(--accent-purple)'}
              headerAction={
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Badge variant="green">{sp.status}</Badge>
                  <Button
                    variant="white"
                    size="sm"
                    onClick={() => handleDeleteSponsor(sp)}
                    icon={Trash2}
                    title="Delete Sponsor"
                  />
                </div>
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <Badge variant="blue">{sp.tier}</Badge>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669' }}>
                  {inr(sp.amount)}
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '14px' }}>
                Contact: {sp.contact} • Contract: {sp.contractSigned ? '✓ Signed & Verified' : 'Pending'}
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                  Deliverables Checklist:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {(sp.perks || []).map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800 }}>
                      <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Sponsor Modal */}
      <Modal
        isOpen={isAddSponsorOpen}
        onClose={() => setIsAddSponsorOpen(false)}
        title="🏢 Register Sponsor Agreement"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleAddSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Company / Partner Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. RedBull India"
              value={sponsorForm.company}
              onChange={(e) => setSponsorForm({ ...sponsorForm, company: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Tier Package</label>
              <select
                value={sponsorForm.tier}
                onChange={(e) => setSponsorForm({ ...sponsorForm, tier: e.target.value })}
                className="neo-input neo-select"
              >
                <option value="Platinum Sponsor">Platinum Sponsor (₹50k+)</option>
                <option value="Gold Sponsor">Gold Sponsor (₹30k)</option>
                <option value="Silver Sponsor">Silver Sponsor (₹15k)</option>
                <option value="Bronze Partner">Bronze Partner (₹5k)</option>
              </select>
            </div>
            <div>
              <label className="neo-label">Sponsorship Value (₹)</label>
              <input
                type="number"
                min="0"
                value={sponsorForm.amount}
                onChange={(e) => setSponsorForm({ ...sponsorForm, amount: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Contact Email / Phone</label>
            <input
              type="text"
              placeholder="partnerships@company.com"
              value={sponsorForm.contact}
              onChange={(e) => setSponsorForm({ ...sponsorForm, contact: e.target.value })}
              className="neo-input"
            />
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '8px' }}>
            Sign Sponsor MoU & Credit Treasury
          </Button>
        </form>
      </Modal>
    </div>
  );
};
