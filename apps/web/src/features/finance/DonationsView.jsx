import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { Gift, Plus, FileText, CheckCircle2, ShieldCheck, Heart, Trash2, Check, Download, DollarSign, Users } from 'lucide-react';

export const DonationsView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddDonationOpen, setIsAddDonationOpen] = useState(false);
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState(null);

  const club = clubService.getClub(activeClub.id);
  const donations = clubService.getDonations(activeClub.id);
  const fundraisers = clubService.getFundraisers(activeClub.id) || [];

  const defaultDate = new Date().toISOString().split('T')[0];

  const initialForm = {
    donorName: '',
    email: '',
    amount: 1000,
    campaign: fundraisers[0]?.title || 'General Club Development Fund',
    campaignId: fundraisers[0]?.id || null,
    pan: '',
    paymentMethod: 'UPI',
    date: defaultDate,
    anonymous: false
  };

  const [donationForm, setDonationForm] = useState(initialForm);

  const totalDonationAmt = donations.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const totalDonors = donations.length;

  const handleCreateDonation = (e) => {
    e.preventDefault();
    if (!donationForm.donorName.trim() && !donationForm.anonymous) {
      alert('Please enter the donor name or mark the donation as anonymous.');
      return;
    }

    if (!donationForm.amount || Number(donationForm.amount) <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }

    try {
      const selectedCampaignObj = fundraisers.find((f) => f.title === donationForm.campaign);

      const created = clubService.createDonation(
        activeClub.id,
        {
          donorName: donationForm.anonymous ? 'Anonymous Supporter' : donationForm.donorName.trim(),
          email: donationForm.email.trim(),
          amount: Number(donationForm.amount),
          campaign: donationForm.campaign,
          campaignId: selectedCampaignObj?.id || donationForm.campaignId,
          pan: donationForm.pan.trim().toUpperCase(),
          paymentMethod: donationForm.paymentMethod,
          date: donationForm.date,
          anonymous: donationForm.anonymous
        },
        session
      );

      setIsAddDonationOpen(false);
      setDonationForm(initialForm);
      if (onToast) onToast(`❤️ Recorded donation of ${inr(created.amount)} from ${created.donorName}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDonation = (don) => {
    if (window.confirm(`Are you sure you want to remove the donation record ${don.receiptNo} of ${inr(don.amount)}?`)) {
      try {
        clubService.deleteDonation(activeClub.id, don.id, session);
        if (onToast) onToast(`🗑️ Removed donation record ${don.receiptNo}.`);
        if (onDataChange) onDataChange();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Badge variant="green">Section 80G Certified Institutional Portal</Badge>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '8px 0 0' }}>
            Donations Hub & 80G Tax Receipts
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Alumni contributions, campaign drives, and automated tax exemption receipts for {activeClub.name}.
          </p>
        </div>
        <Button
          variant="yellow"
          size="sm"
          onClick={() => setIsAddDonationOpen(true)}
          icon={Plus}
          style={{ boxShadow: '4px 4px 0px #000' }}
        >
          Record Donation
        </Button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Total Contributions"
          value={inr(totalDonationAmt)}
          subtitle="All Time Received"
          icon={DollarSign}
          color="var(--accent-green)"
        />
        <StatCard
          title="Supporters & Donors"
          value={totalDonors}
          subtitle="Direct Benefactors"
          icon={Users}
          color="var(--accent-yellow)"
        />
        <StatCard
          title="80G Receipts Issued"
          value={donations.length}
          subtitle="Tax Exemption Passes"
          icon={ShieldCheck}
          color="#A78BFA"
        />
        <StatCard
          title="Active Drives"
          value={fundraisers.length}
          subtitle="Fundraising Campaigns"
          icon={Heart}
          color="var(--accent-pink)"
        />
      </div>

      {/* Main Table Card */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>🎁 Official Donations Ledger & Tax Records</span>
            <span style={{ fontSize: '12px', fontWeight: 800, opacity: 0.85 }}>
              {donations.length} {donations.length === 1 ? 'Record' : 'Records'} Logged
            </span>
          </div>
        }
        headerBg="var(--accent-yellow)"
      >
        {donations.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '44px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div
              style={{
                fontSize: '52px',
                width: '84px',
                height: '84px',
                borderRadius: '20px',
                backgroundColor: '#FEF9C3',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000'
              }}
            >
              🎁
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0' }}>
                No Donations Recorded Yet
              </h3>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '440px' }}>
                You haven't recorded any alumni gifts or contributions for {activeClub.name}. Add offline checks, UPI direct gifts, or alumni sponsorships to issue 80G certificates.
              </p>
            </div>
            <Button
              variant="yellow"
              onClick={() => setIsAddDonationOpen(true)}
              icon={Plus}
              style={{ padding: '12px 24px', fontSize: '15px' }}
            >
              Record First Donation
            </Button>
          </div>
        ) : (
          <div className="neo-table-container">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Receipt Ref</th>
                  <th>Donor Supporter</th>
                  <th>Target Campaign</th>
                  <th>Donation Amount</th>
                  <th>Date & Mode</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((don) => (
                  <tr key={don.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '13px' }}>
                      {don.receiptNo}
                    </td>
                    <td>
                      <div style={{ fontWeight: 900 }}>{don.donorName}</div>
                      {don.anonymous && <Badge variant="purple">Anonymous Wall</Badge>}
                      {don.pan && (
                        <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                          PAN: {don.pan}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 800 }}>{don.campaign}</td>
                    <td style={{ fontWeight: 900, color: '#059669', fontSize: '15px' }}>
                      {inr(don.amount)}
                    </td>
                    <td>
                      <div>{don.date}</div>
                      <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 800 }}>
                        {don.paymentMethod || 'UPI'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <Button
                          variant="yellow"
                          size="sm"
                          onClick={() => setSelectedDonationForReceipt(don)}
                          icon={FileText}
                        >
                          80G Receipt
                        </Button>
                        <Button
                          variant="pink"
                          size="sm"
                          onClick={() => handleDeleteDonation(don)}
                          icon={Trash2}
                          title="Delete Donation Record"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD NEW DONATION */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddDonationOpen}
        onClose={() => setIsAddDonationOpen(false)}
        title="🎁 Record New Donation / Contribution"
        headerColor="var(--accent-yellow)"
        maxWidth="580px"
      >
        <form onSubmit={handleCreateDonation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="neo-label">Donor Supporter Name *</label>
            <input
              type="text"
              required={!donationForm.anonymous}
              disabled={donationForm.anonymous}
              placeholder={donationForm.anonymous ? 'Anonymous Supporter' : 'e.g. Dr. Rajesh Shah (Alumni 2018), TechCorp Foundation...'}
              className="neo-input"
              value={donationForm.anonymous ? 'Anonymous Supporter' : donationForm.donorName}
              onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Donor Email (For 80G Receipt)</label>
              <input
                type="email"
                placeholder="supporter@alumni.edu"
                className="neo-input"
                value={donationForm.email}
                onChange={(e) => setDonationForm({ ...donationForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="neo-label">PAN Number (Tax Deductible)</label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                className="neo-input"
                style={{ textTransform: 'uppercase' }}
                value={donationForm.pan}
                onChange={(e) => setDonationForm({ ...donationForm, pan: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Donation Amount (₹) *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {[500, 1000, 2500, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDonationForm({ ...donationForm, amount: preset })}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: Number(donationForm.amount) === preset ? '2.5px solid #000' : '1.5px solid #D1D5DB',
                    backgroundColor: Number(donationForm.amount) === preset ? '#FEF08A' : '#FFF',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  ₹{preset.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="100"
              required
              className="neo-input"
              value={donationForm.amount}
              onChange={(e) => setDonationForm({ ...donationForm, amount: Number(e.target.value) })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Target Campaign / Drive</label>
              <select
                className="neo-input neo-select"
                value={donationForm.campaign}
                onChange={(e) => setDonationForm({ ...donationForm, campaign: e.target.value })}
              >
                {fundraisers.map((f) => (
                  <option key={f.id} value={f.title}>
                    🎯 {f.title}
                  </option>
                ))}
                <option value="General Club Development Fund">General Club Development Fund</option>
                <option value="Student Hardware Lab Aid">Student Hardware Lab Aid</option>
                <option value="Hackathon Scholarship Pool">Hackathon Scholarship Pool</option>
              </select>
            </div>

            <div>
              <label className="neo-label">Payment Method</label>
              <select
                className="neo-input neo-select"
                value={donationForm.paymentMethod}
                onChange={(e) => setDonationForm({ ...donationForm, paymentMethod: e.target.value })}
              >
                <option value="UPI">UPI Transfer</option>
                <option value="Bank NEFT/IMPS">Bank NEFT/IMPS</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash / Campus Desk">Cash / Campus Desk</option>
              </select>
            </div>
          </div>

          <div>
            <label className="neo-label">Contribution Date</label>
            <input
              type="date"
              required
              className="neo-input"
              value={donationForm.date}
              onChange={(e) => setDonationForm({ ...donationForm, date: e.target.value })}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              backgroundColor: '#FAF5EE',
              border: '2px solid #000',
              borderRadius: '10px'
            }}
          >
            <input
              type="checkbox"
              id="anonCheck"
              checked={donationForm.anonymous}
              onChange={(e) => setDonationForm({ ...donationForm, anonymous: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="anonCheck" style={{ fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>
              Mark as Anonymous Supporter (Do not list personal name on public donor wall)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="white" onClick={() => setIsAddDonationOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" icon={Check}>
              Record Donation & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: OFFICIAL 80G TAX RECEIPT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedDonationForReceipt)}
        onClose={() => setSelectedDonationForReceipt(null)}
        title="📄 Official 80G Tax Exemption Receipt"
        headerColor="var(--accent-green)"
        maxWidth="520px"
      >
        {selectedDonationForReceipt && (
          <div style={{ backgroundColor: '#FAF5EE', border: '2.5px solid #000', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{activeClub.name}</h3>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                  Campus Student Activities Directorate
                </span>
              </div>
              <Badge variant="green">Receipt: {selectedDonationForReceipt.receiptNo}</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
              <div><strong>Donor:</strong> {selectedDonationForReceipt.donorName}</div>
              {selectedDonationForReceipt.email && (
                <div><strong>Email:</strong> {selectedDonationForReceipt.email}</div>
              )}
              {selectedDonationForReceipt.pan && (
                <div><strong>PAN Card / Tax ID:</strong> {selectedDonationForReceipt.pan}</div>
              )}
              <div><strong>Amount Received:</strong> <span style={{ color: '#059669', fontWeight: 900 }}>{inr(selectedDonationForReceipt.amount)}</span></div>
              <div><strong>Campaign / Purpose:</strong> {selectedDonationForReceipt.campaign}</div>
              <div><strong>Payment Mode:</strong> {selectedDonationForReceipt.paymentMethod || 'UPI'}</div>
              <div><strong>Transaction Date:</strong> {selectedDonationForReceipt.date}</div>
            </div>

            <div
              style={{
                backgroundColor: '#DCFCE7',
                border: '1.5px solid #059669',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#065F46',
                textAlign: 'center'
              }}
            >
              ✓ Certified Tax Exemption Receipt issued under Section 80G of the Income Tax Act.
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button
                variant="white"
                style={{ flex: 1 }}
                onClick={() => setSelectedDonationForReceipt(null)}
              >
                Close
              </Button>
              <Button
                variant="black"
                style={{ flex: 1 }}
                onClick={() => {
                  window.print();
                  if (onToast) onToast('📄 80G Tax Receipt PDF Print Dialog opened.');
                }}
                icon={Download}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
