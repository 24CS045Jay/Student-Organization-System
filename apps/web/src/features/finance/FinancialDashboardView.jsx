import React from 'react';
import { Card, Button, Badge, StatCard, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { DollarSign, TrendingUp, TrendingDown, Receipt, PieChart, ShieldCheck, Download } from 'lucide-react';

export const FinancialDashboardView = ({ session, activeClub, onToast, onNavigate }) => {
  const finance = clubService.getFinanceSummary(activeClub.id);
  const reimbursements = clubService.getReimbursements(activeClub.id);
  const pendingClaims = reimbursements.filter(r => r.status !== 'Reimbursed');
  const pendingAmt = pendingClaims.reduce((acc, r) => acc + r.amount, 0);

  const budgetAllocated = finance.budgetAllocated || 150000;
  const budgetSpent = finance.totalExpenses || 0;
  const budgetUtilization = Math.min(100, Math.round((budgetSpent / budgetAllocated) * 100));

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
        <Card title="📊 Semester Budget vs Actual Burn Rate" headerBg="var(--accent-yellow)">
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
            {(finance.incomeSources || []).map((src, i) => (
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
                  <div>{src.source}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{src.count} transactions</div>
                </div>
                <Badge variant="green">{inr(src.amount)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Ledger Transactions */}
      <Card title="📋 Audited Expense Disbursements Ledger (FR-16)" headerBg="var(--accent-pink)">
        <div className="neo-table-container">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Voucher ID</th>
                <th>Expense Item</th>
                <th>Category</th>
                <th>Disbursed Amount</th>
                <th>Authorized Signer</th>
                <th>Date</th>
                <th>Receipt Ref</th>
              </tr>
            </thead>
            <tbody>
              {(finance.expensesList || []).map((exp) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
