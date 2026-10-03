import React, { useState } from 'react';
import { Card, Button, Badge, Drawer } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { Sparkles, Send, Bot, User, Brain, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export const AICopilotView = ({ session, activeClub, isDrawer = false, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `👋 Hello! I am the **ClubSphere AI Copilot** for **${activeClub.name}**.\n\nI can analyze your private club ledger, predict event attendance, generate budget splits, and allocate volunteers. Ask me anything or click a preset below!`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'planner' | 'insights'

  // AI Event Planner Form State (Item F)
  const [plannerGuests, setPlannerGuests] = useState(150);
  const [plannerBudget, setPlannerBudget] = useState(75000);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const suggestedPrompts = [
    'How much did we spend on events?',
    'Which event earned the most?',
    'How much money is left?',
    'Show unpaid reimbursements',
    'Which members haven\'t renewed?',
    'Show Cultural Club data (Cross-tenant test)'
  ];

  const handleSend = (textToSend) => {
    const q = textToSend || inputQuery;
    if (!q) return;

    const userMsg = { role: 'user', text: q };
    const answer = clubService.queryAICopilot(activeClub.id, q);
    const aiMsg = { role: 'assistant', text: answer };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputQuery('');
  };

  const handleGeneratePlan = (e) => {
    e.preventDefault();
    setGeneratedPlan({
      title: `${activeClub.short} Mega Innovation Summit 2026`,
      guestCapacity: plannerGuests,
      targetBudget: plannerBudget,
      venueRecommendation: 'CSPIT Auditorium 1 & Central Foyer',
      ticketStrategy: { member: Math.round(plannerBudget / (plannerGuests * 1.5)), nonMember: Math.round((plannerBudget / (plannerGuests * 1.5)) * 2) },
      budgetSplit: [
        { category: 'Venue, Sound & Air Conditioning', percent: 35, amt: Math.round(plannerBudget * 0.35) },
        { category: 'Catering, Energy Drinks & Snacks', percent: 30, amt: Math.round(plannerBudget * 0.30) },
        { category: 'Cash Prizes, Trophies & Swag Badges', percent: 25, amt: Math.round(plannerBudget * 0.25) },
        { category: 'Digital Marketing & Vinyl Banners', percent: 10, amt: Math.round(plannerBudget * 0.10) }
      ],
      volunteerAllocation: [
        { role: 'Stage & Audio/Video Leads', count: 3, suggested: 'Param Joshi (A/V Expert)' },
        { role: 'Registration & Fast-pass Desk', count: 4, suggested: 'Diya Patel (Logistics)' },
        { role: 'Hospitality & Mentors Liaison', count: 2, suggested: 'Isha Nair (Design & Hospitality)' }
      ]
    });
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2.5px solid #121212', paddingBottom: '8px' }}>
        <Button
          variant={activeTab === 'chat' ? 'yellow' : 'white'}
          size="sm"
          onClick={() => setActiveTab('chat')}
          icon={Brain}
        >
          Copilot Chat & Ledger AI
        </Button>
        <Button
          variant={activeTab === 'planner' ? 'purple' : 'white'}
          size="sm"
          onClick={() => setActiveTab('planner')}
          icon={Sparkles}
        >
          AI Event Planner (Item F)
        </Button>
        <Button
          variant={activeTab === 'insights' ? 'pink' : 'white'}
          size="sm"
          onClick={() => setActiveTab('insights')}
          icon={Zap}
        >
          Financial Anomaly Flags
        </Button>
      </div>

      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '460px' }}>
          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FAF5EE',
              border: '2.5px solid #121212',
              borderRadius: '16px',
              padding: '16px',
              overflowY: 'auto',
              maxHeight: '440px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '14px'
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {m.role === 'assistant' && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--accent-yellow)',
                      border: '1.5px solid #000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900
                    }}
                  >
                    🤖
                  </div>
                )}
                <div
                  className="neo-box"
                  style={{
                    padding: '12px 16px',
                    backgroundColor: m.role === 'user' ? 'var(--accent-yellow)' : '#FFFFFF',
                    border: '2px solid #121212',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Prompts Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1.5px solid #000',
                  backgroundColor: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                💡 {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={`Ask AI Copilot about ${activeClub.short}'s finances, members, or events...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="neo-input"
              style={{ fontWeight: 800 }}
            />
            <Button variant="yellow" onClick={() => handleSend()} icon={Send}>
              Ask
            </Button>
          </div>
        </div>
      )}

      {/* AI Event Planner (Item F) */}
      {activeTab === 'planner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="⚡ AI Autonomous Event Architect" headerBg="var(--accent-purple)">
            <form onSubmit={handleGeneratePlan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label className="neo-label">Expected Guest Count</label>
                <input
                  type="number"
                  value={plannerGuests}
                  onChange={(e) => setPlannerGuests(Number(e.target.value))}
                  className="neo-input"
                />
              </div>
              <div>
                <label className="neo-label">Target Budget Quota (₹)</label>
                <input
                  type="number"
                  value={plannerBudget}
                  onChange={(e) => setPlannerBudget(Number(e.target.value))}
                  className="neo-input"
                />
              </div>
              <Button variant="yellow" type="submit" icon={Sparkles}>
                Generate Execution Blueprint
              </Button>
            </form>
          </Card>

          {generatedPlan && (
            <Card title={`📋 Generated Blueprint: ${generatedPlan.title}`} headerBg="var(--accent-green)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '8px' }}>
                    Recommended Budget Allocations:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {generatedPlan.budgetSplit.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#FAF5EE', border: '1.5px solid #000', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                        <span>• {b.category} ({b.percent}%)</span>
                        <span style={{ fontWeight: 900, color: '#059669' }}>{inr(b.amt)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '14px', padding: '10px', backgroundColor: '#DCFCE7', border: '2px solid #000', borderRadius: '10px', fontSize: '12px', fontWeight: 900 }}>
                    Recommended Pricing: Member Pass {inr(generatedPlan.ticketStrategy.member)} | Non-Member Pass {inr(generatedPlan.ticketStrategy.nonMember)}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '8px' }}>
                    Smart Volunteer Allocation (Item 15):
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {generatedPlan.volunteerAllocation.map((v, i) => (
                      <div key={i} style={{ padding: '8px 12px', backgroundColor: '#FAF5EE', border: '1.5px solid #000', borderRadius: '8px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 900 }}>{v.role} ({v.count} slots)</div>
                        <div style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Best Match: {v.suggested}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Financial Anomaly Insights */}
      {activeTab === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Card title="🚨 Intelligent Ledger Anomaly Detection" headerBg="var(--accent-pink)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '14px', backgroundColor: '#FEF3C7', border: '2px solid #000', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '28px' }}>⚠️</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0 }}>High Vendor Expenditure Detected</h4>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '2px' }}>
                    Venue AC & Power was 38% of total semester budget. Recommended: Negotiate university internal subsidization.
                  </p>
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#DCFCE7', border: '2px solid #000', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '28px' }}>💡</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0 }}>Unleveraged Merchandise Demand</h4>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '2px' }}>
                    Hoodie stock size M sold out 3x faster than L. Pre-order recommended before winter fest.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  if (isDrawer) {
    return (
      <Drawer isOpen={true} onClose={onClose} title="🤖 ClubSphere AI Copilot" headerColor="var(--accent-yellow)">
        {content}
      </Drawer>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
          AI Copilot, Event Planner & Financial Intelligence (E, F, 15)
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          Autonomous assistant with tenant-isolated ledger access, anomaly detection, and predictive planner.
        </p>
      </div>
      {content}
    </div>
  );
};
