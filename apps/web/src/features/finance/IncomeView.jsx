import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { TrendingUp, Plus, Trash2, DollarSign, Wallet } from 'lucide-react';

export const IncomeView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [customSourceName, setCustomSourceName] = useState('');
  const [incomeForm, setIncomeForm] = useState({
    source: 'Corporate Sponsorship',
    amount: 10000,
    details: ''
  });

  const club = clubService.getClub(activeClub.id);
  const finance = club.finance || {};
  const incomeSources = finance.incomeSources || [];

  const handleOpenAdd = () => {
    setIncomeForm({
      source: 'Corporate Sponsorship',
      amount: 10000,
      details: ''
    });
    setCustomSourceName('');
    setIsAddIncomeOpen(true);
  };

  const handleAddIncome = (e) => {
    e.preventDefault();
    const finalSource = incomeForm.source === 'Other' && customSourceName.trim()
      ? customSourceName.trim()
      : incomeForm.source;

    if (!finalSource) {
      alert('Please specify the revenue source name.');
      return;
    }
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) {
      alert('Please enter a valid positive inflow amount.');
      return;
    }

    try {
      clubService.recordIncome(
        activeClub.id,
        {
          source: finalSource,
          amount: Number(incomeForm.amount),
          details: incomeForm.details
        },
        session
      );
      setIsAddIncomeOpen(false);
      if (onToast) onToast(`💰 Credited ${inr(incomeForm.amount)} from ${finalSource} to treasury!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSource = (index, s) => {
    if (!window.confirm(`Delete income stream "${s.source}" (${inr(s.amount)})? This will deduct the amount from treasury balance.`)) return;
    try {
      clubService.deleteIncomeSource(activeClub.id, index, session);
      if (onToast) onToast(`🗑️ Removed revenue stream "${s.source}"`);
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
            Revenue Sources & Inflow Ledger (FR-15)
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Track dues, ticket sales, merch shop profits, and direct sponsorship inflows for {activeClub.name}.
          </p>
        </div>
        <Button variant="yellow" size="sm" onClick={handleOpenAdd} icon={Plus}>
          Record Direct Income
        </Button>
      </div>

      {incomeSources.length === 0 ? (
        <Card title="No Revenue Streams Recorded" headerBg="var(--accent-green)">
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
                backgroundColor: '#DCFCE7',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000'
              }}
            >
              💰
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0' }}>
              Zero Inflow Records
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '420px' }}>
              Record college starter grants, corporate sponsorship agreements, merchandise sales, and alumni gifts dynamically.
            </p>
            <Button variant="yellow" onClick={handleOpenAdd} icon={Plus}>
              Record First Revenue Inflow
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {incomeSources.map((s, i) => (
            <Card
              key={i}
              title={s.source}
              headerBg="var(--accent-green)"
              headerAction={
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => handleDeleteSource(i, s)}
                  icon={Trash2}
                  title="Delete Stream"
                />
              }
            >
              <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '6px 0 2px', color: '#059669' }}>
                {inr(s.amount)}
              </h2>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                {s.count} Total {s.count === 1 ? 'Transaction' : 'Transactions'} Recorded
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Add Income Modal */}
      <Modal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        title="💰 Record Club Inflow"
        headerColor="var(--accent-green)"
      >
        <form onSubmit={handleAddIncome} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Revenue Source</label>
            <select
              value={incomeForm.source}
              onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
              className="neo-input neo-select"
            >
              <option value="Corporate Sponsorship">Corporate Sponsorship</option>
              <option value="Merchandise Direct Sale">Merchandise Direct Sale</option>
              <option value="Donation & Fundraiser">Donation & Fundraiser</option>
              <option value="University Seed Grant">University Seed Grant</option>
              <option value="Event Registration Dues">Event Registration Dues</option>
              <option value="Other">Other (Custom Title)</option>
            </select>
          </div>

          {incomeForm.source === 'Other' && (
            <div>
              <label className="neo-label">Custom Revenue Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alumni Association Equipment Grant"
                value={customSourceName}
                onChange={(e) => setCustomSourceName(e.target.value)}
                className="neo-input"
              />
            </div>
          )}

          <div>
            <label className="neo-label">Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              className="neo-input"
            />
          </div>

          <div>
            <label className="neo-label">Description / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Stall booking advance from Food Truck vendor"
              value={incomeForm.details}
              onChange={(e) => setIncomeForm({ ...incomeForm, details: e.target.value })}
              className="neo-input"
            />
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '8px' }}>
            Credit to Treasury Balance
          </Button>
        </form>
      </Modal>
    </div>
  );
};
