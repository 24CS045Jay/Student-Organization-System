import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { TrendingUp, Plus, Download, DollarSign } from 'lucide-react';

export const IncomeView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    source: 'Sponsorship',
    amount: 15000,
    details: 'Campus fest stall booking fee'
  });

  const club = clubService.getClub(activeClub.id);
  const finance = club.finance || {};

  const handleAddIncome = (e) => {
    e.preventDefault();
    try {
      finance.totalIncome += Number(incomeForm.amount);
      finance.netBalance += Number(incomeForm.amount);
      const match = finance.incomeSources.find(s => s.source.toLowerCase().includes(incomeForm.source.toLowerCase()));
      if (match) {
        match.amount += Number(incomeForm.amount);
        match.count += 1;
      }
      setIsAddIncomeOpen(false);
      if (onToast) onToast(`💰 Recorded income of ${inr(incomeForm.amount)}`);
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
            Track automated dues, ticket sales, merch shop profits, and direct sponsorship inflows for {activeClub.name}.
          </p>
        </div>
        <Button variant="yellow" size="sm" onClick={() => setIsAddIncomeOpen(true)} icon={Plus}>
          Record Direct Income
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {(finance.incomeSources || []).map((s, i) => (
          <Card key={i} title={s.source} headerBg="var(--accent-green)">
            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '6px 0 2px', color: '#059669' }}>
              {inr(s.amount)}
            </h2>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>
              {s.count} Total Transactions Recorded
            </p>
          </Card>
        ))}
      </div>

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
              <option value="Sponsorship">Corporate Sponsorship</option>
              <option value="Merchandise">Merchandise Direct Sale</option>
              <option value="Fundraising">Donation & Fundraiser</option>
              <option value="Other">Other Miscellaneous Inflow</option>
            </select>
          </div>

          <div>
            <label className="neo-label">Amount (₹) *</label>
            <input
              type="number"
              required
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
