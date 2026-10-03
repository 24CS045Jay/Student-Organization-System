import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { Receipt, Plus, Trash2, Tag, TrendingDown } from 'lucide-react';

export const ExpensesView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Venue',
    amount: 2500,
    receipt: `BILL-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const club = clubService.getClub(activeClub.id);
  const finance = club.finance || {};
  const expenses = finance.expensesList || [];

  const handleOpenAdd = () => {
    setExpenseForm({
      title: '',
      category: 'Venue',
      amount: 2500,
      receipt: `BILL-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsAddExpenseOpen(true);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.title.trim()) return;
    try {
      clubService.addExpense(activeClub.id, expenseForm, session);
      setIsAddExpenseOpen(false);
      setExpenseForm({ title: '', category: 'Venue', amount: 2500, receipt: `BILL-${Math.floor(1000 + Math.random() * 9000)}` });
      if (onToast) onToast(`💸 Recorded disbursement of ${inr(expenseForm.amount)}`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteExpense = (exp) => {
    if (!window.confirm(`Delete expense voucher ${exp.id} (${inr(exp.amount)})? This will credit the amount back to treasury balance.`)) return;
    try {
      clubService.deleteExpense(activeClub.id, exp.id, session);
      if (onToast) onToast(`🗑️ Voided voucher ${exp.id} and refunded ${inr(exp.amount)} to treasury.`);
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
            Expense Ledger & Voucher Disbursements (FR-16)
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Audited outflow records with receipt attachments for {activeClub.name}.
          </p>
        </div>
        <Button variant="pink" size="sm" onClick={handleOpenAdd} icon={Plus}>
          Record Expense Voucher
        </Button>
      </div>

      {expenses.length === 0 ? (
        <Card title="No Expenses Recorded" headerBg="var(--accent-pink)">
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
                backgroundColor: '#FEE2E2',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000'
              }}
            >
              💸
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0' }}>
              Zero Disbursements in Ledger
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '420px' }}>
              All expenditures for events, catering, audio equipment, and logistics are tracked with audit-ready vouchers and invoices.
            </p>
            <Button variant="pink" onClick={handleOpenAdd} icon={Plus}>
              Record First Expense Voucher
            </Button>
          </div>
        </Card>
      ) : (
        <div className="neo-table-container">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Voucher Code</th>
                <th>Expenditure Details</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Authorized By</th>
                <th>Date</th>
                <th>Receipt Ref</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 900 }}>{exp.id}</td>
                  <td style={{ fontWeight: 900 }}>{exp.title}</td>
                  <td><Badge variant="purple">{exp.category}</Badge></td>
                  <td style={{ fontWeight: 900, color: '#DC2626' }}>-{inr(exp.amount)}</td>
                  <td style={{ fontWeight: 800 }}>{exp.approvedBy}</td>
                  <td>{exp.date}</td>
                  <td>
                    <span style={{ fontSize: '11px', backgroundColor: '#FAF4E8', padding: '2px 6px', border: '1px solid #000', borderRadius: '4px', fontWeight: 800 }}>
                      {exp.receipt}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="white"
                      size="sm"
                      onClick={() => handleDeleteExpense(exp)}
                      icon={Trash2}
                      title="Void / Delete Expense"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="💸 Disburse New Expense Voucher"
        headerColor="var(--accent-pink)"
      >
        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Expense Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Auditorium Audio Cable Rental"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="neo-input neo-select"
              >
                <option value="Venue">Venue & Facility</option>
                <option value="Food">Food & Catering</option>
                <option value="Equipment">Equipment & Tech</option>
                <option value="Marketing">Marketing & Banners</option>
                <option value="Operational">Operational</option>
                <option value="Stationery">Stationery & Badges</option>
              </select>
            </div>
            <div>
              <label className="neo-label">Disbursement (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Vendor Bill / Receipt Ref</label>
            <input
              type="text"
              placeholder="e.g. INV-AUD-2026-90"
              value={expenseForm.receipt}
              onChange={(e) => setExpenseForm({ ...expenseForm, receipt: e.target.value })}
              className="neo-input"
            />
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '8px' }}>
            Authorize Disbursement & Debit Treasury
          </Button>
        </form>
      </Modal>
    </div>
  );
};
