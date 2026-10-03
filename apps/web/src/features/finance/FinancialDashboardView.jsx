import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatCard, ProgressBar, Modal } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { DollarSign, TrendingUp, TrendingDown, Receipt, Edit2, ShieldCheck, Download, Check } from 'lucide-react';

export const FinancialDashboardView = ({ session, activeClub, onDataChange, onToast, onNavigate }) => {
  const finance = clubService.getFinanceSummary(activeClub.id);
  const reimbursements = clubService.getReimbursements(activeClub.id);
  const pendingClaims = reimbursements.filter(r => r.status !== 'Reimbursed');
  const pendingAmt = pendingClaims.reduce((acc, r) => acc + r.amount, 0);

  const budgetAllocated = finance.budgetAllocated || 150000;
  const budgetSpent = finance.totalExpenses || 0;
  const budgetUtilization = Math.min(100, Math.round((budgetSpent / budgetAllocated) * 100));

  // Edit Budget Modal State
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [newBudgetVal, setNewBudgetVal] = useState(budgetAllocated);

  useEffect(() => {
    setNewBudgetVal(budgetAllocated);
  }, [budgetAllocated]);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const parsed = Number(newBudgetVal);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid positive budget amount.');
      return;
    }

    try {
      clubService.updateBudgetAllocation(activeClub.id, parsed, session);
      setIsEditBudgetOpen(false);
      if (onToast) onToast(`✅ Semester budget quota updated to ${inr(parsed)}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Badge variant="green">FR-18 Financial Command Center</Badge>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '8px 0 0' }}>
            Treasury & Financial Overview
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Real-time cash reserves, audited revenue streams, and budget tracking for {activeClub.name}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="black" size="sm" onClick={() => { window.print(); if (onToast) onToast('🖨️ Opened print dialog for Financial Audit PDF.'); }} icon={Download}>
            Export Financial Report
          </Button>
          <Button variant="yellow" size="sm" onClick={() => onNavigate && onNavigate('reimbursements-mgmt')}>
            Review Reimbursements ({pendingClaims.length})
          </Button>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Net Cash Balance"
          value={inr(finance.netBalance)}
          subtitle="Liquid Operating Funds"
          icon={DollarSign}
          color="var(--accent-green)"
        />
        <StatCard
          title="Total Gross Income"
          value={inr(finance.totalIncome)}
          subtitle="All Revenue Streams"
          icon={TrendingUp}
          color="var(--accent-yellow)"
          trend="+32%"
        />
        <StatCard
          title="Total Expenses"
          value={inr(finance.totalExpenses)}
          subtitle="Approved Disbursements"
          icon={TrendingDown}
          color="var(--accent-pink)"
        />
        <StatCard
          title="Pending Claims"
          value={inr(pendingAmt)}
          subtitle={`${pendingClaims.length} Claims Awaiting`}
          icon={Receipt}
          color="var(--accent-purple)"
        />
      </div>

      {/* Budget vs Actual & Income Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Budget vs Actual Tracker */}
        <Card
          title="📊 Semester Budget vs Actual Burn Rate"
          headerBg="var(--accent-yellow)"
          headerAction={
            <Button
              variant="black"
              size="sm"
              onClick={() => setIsEditBudgetOpen(true)}
              icon={Edit2}
            >
              Edit Budget Quota
            </Button>
          }
        >
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900, marginBottom: '6px' }}>
              <span>Budget Utilized: {inr(budgetSpent)}</span>
              <span>Allocated Quota: {inr(budgetAllocated)} ({budgetUtilization}%)</span>
            </div>
            <ProgressBar
              value={budgetSpent}
              max={budgetAllocated}
              color={budgetUtilization > 85 ? 'var(--accent-pink)' : 'var(--accent-green)'}
              height={16}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div style={{ padding: '12px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '10px' }}>
              <div style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Unspent Margin</div>
              <div style={{ fontWeight: 900, fontSize: '18px', color: '#059669' }}>
                {inr(Math.max(0, budgetAllocated - budgetSpent))}
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '10px' }}>
              <div style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Liquidity Ratio</div>
              <div style={{ fontWeight: 900, fontSize: '18px', color: '#1E40AF' }}>
                1.75x (Healthy)
              </div>
            </div>
          </div>
        </Card>

        {/* Revenue Sources Breakdown */}
        <Card title="💰 Income Sources Split (FR-15)" headerBg="var(--accent-green)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(!finance.incomeSources || finance.incomeSources.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--ink-muted)', fontWeight: 700, fontSize: '13px' }}>
                No revenue streams recorded yet. Record merchandise sales, sponsor grants, or donations in Income Hub.
              </div>
            ) : (
              finance.incomeSources.map((src, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: '#FAF5EE',
                    border: '1.5px solid #000',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 800
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 900 }}>{src.source}</span>
                    <span style={{ color: 'var(--ink-muted)', fontSize: '11px', marginLeft: '6px' }}>
                      ({src.count} items)
                    </span>
                  </div>
                  <div style={{ fontWeight: 900, color: '#059669' }}>
                    {inr(src.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Ledger Feed & Quick Expense Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Approved Expenses Feed */}
        <Card title="🧾 Approved Disbursements & Ledger Entries" headerBg="var(--accent-pink)">
          {(!finance.expensesList || finance.expensesList.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--ink-muted)', fontWeight: 700, fontSize: '13px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🧾</div>
              <div style={{ fontWeight: 900, color: '#000', fontSize: '15px' }}>No Expense Disbursements Recorded</div>
              <div>Expense claims and vendor payments will appear here once registered.</div>
            </div>
          ) : (
            <div className="neo-table-container">
              <table className="neo-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Title & Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {finance.expensesList.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>{exp.date}</td>
                      <td>
                        <Badge variant="purple">{exp.category}</Badge>
                      </td>
                      <td style={{ fontWeight: 900 }}>{exp.title}</td>
                      <td style={{ fontWeight: 900, color: '#DC2626' }}>-{inr(exp.amount)}</td>
                      <td>
                        <Badge variant="green">{exp.status || 'Audited'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Audit Compliance Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="🔒 Fiscal Governance & Dual-Approval Rules" headerBg="var(--accent-purple)">
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '14px' }}>
              University compliance requires all expense disbursements over <strong>₹5,000</strong> to carry verified receipts and audit trails.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontWeight: 800 }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#FAF5EE', border: '1.5px solid #000', borderRadius: '8px' }}>
                ✓ Tier 1 (Up to ₹5,000): Treasurer Direct Approval
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#FAF5EE', border: '1.5px solid #000', borderRadius: '8px' }}>
                ✓ Tier 2 (Above ₹5,000): Treasurer + Faculty Advisor Signoff
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#FAF5EE', border: '1.5px solid #000', borderRadius: '8px' }}>
                ✓ NFR-10: Append-Only Immutable Transaction Ledger
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={isEditBudgetOpen}
        onClose={() => setIsEditBudgetOpen(false)}
        title="✏️ Adjust Semester Budget Quota"
        headerColor="var(--accent-yellow)"
        maxWidth="480px"
      >
        <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="neo-label">Allocated Budget Quota (₹) *</label>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              className="neo-input"
              value={newBudgetVal}
              onChange={(e) => setNewBudgetVal(e.target.value)}
            />
          </div>

          <div>
            <label className="neo-label" style={{ fontSize: '11px' }}>Quick Quota Presets:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {[100000, 150000, 200000, 300000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewBudgetVal(preset)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: Number(newBudgetVal) === preset ? '2.5px solid #000' : '1.5px solid #D1D5DB',
                    backgroundColor: Number(newBudgetVal) === preset ? '#FEF08A' : '#FFF',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  ₹{(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FAF5EE',
              border: '2px solid #000',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Total Spent So Far:</span>
              <span style={{ fontWeight: 900 }}>{inr(budgetSpent)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Projected Burn Rate:</span>
              <span style={{ fontWeight: 900, color: (budgetSpent / (Number(newBudgetVal) || 1)) > 0.85 ? '#DC2626' : '#059669' }}>
                {Math.min(100, Math.round((budgetSpent / (Number(newBudgetVal) || 1)) * 100))}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Remaining Unspent:</span>
              <span style={{ fontWeight: 900, color: '#059669' }}>
                {inr(Math.max(0, (Number(newBudgetVal) || 0) - budgetSpent))}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button type="button" variant="white" onClick={() => setIsEditBudgetOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" icon={Check}>
              Save & Apply Quota
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
