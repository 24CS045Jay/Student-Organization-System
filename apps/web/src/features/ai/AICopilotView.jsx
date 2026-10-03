import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge, Drawer } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { Sparkles, Send, Bot, Brain, Zap, ShieldCheck, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

export const AICopilotView = ({ session, activeClub, isDrawer = false, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `👋 Hello! I am the **ClubSphere AI Copilot** for **${activeClub.name}**.\n\n⚡ Powered by dynamic dual-engine LLM (Groq & Gemini fallback).\n🔒 **Domain Guard Active:** I only answer questions strictly related to the ClubSphere portal, campus clubs, events, finances, and club operations.\n\nAsk me anything about ${activeClub.short} or click a prompt below!`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'planner' | 'insights'

  // AI Event Planner Form State (Item F)
  const [plannerGuests, setPlannerGuests] = useState(150);
  const [plannerBudget, setPlannerBudget] = useState(75000);
  const [plannerTheme, setPlannerTheme] = useState('Campus Technical & Innovation Fest');
  const [isPlanning, setIsPlanning] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const suggestedPrompts = [
    'How much money is left in our balance?',
    'Which event has the most ticket sales?',
    'Show unpaid reimbursements',
    'How many active members do we have?',
    'What merchandise is in stock?',
    'Test Domain Guard: How to bake a chocolate cake?'
  ];

  const handleSend = async (textToSend) => {
    const q = textToSend || inputQuery;
    if (!q || !q.trim() || isThinking) return;

    const trimmed = q.trim();
    const userMsg = { role: 'user', text: trimmed };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const answer = await clubService.queryAICopilot(activeClub.id, trimmed);
      const aiMsg = { role: 'assistant', text: answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Error reaching AI engine: ${err.message || 'Please check your connection and try again.'}`
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (isPlanning) return;
    setIsPlanning(true);
    try {
      const plan = await clubService.generateDynamicEventPlan(activeClub.id, {
        guestCapacity: plannerGuests,
        targetBudget: plannerBudget,
        theme: plannerTheme
      });
      setGeneratedPlan(plan);
    } catch (err) {
      console.error('Plan generation failed:', err);
    } finally {
      setIsPlanning(false);
    }
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Engine & Guardrail Status Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FAF5EE',
          border: '2px solid #121212',
          borderRadius: '12px',
          padding: '8px 14px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800 }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
          <span>Dual-Engine: Groq High-Speed (Primary) & Gemini Flash (Fallback)</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Badge variant="purple">🔒 Strict Domain Guard</Badge>
          <Badge variant="green">🛡️ Anti-Hallucination Active</Badge>
        </div>
      </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '480px' }}>
          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FAF5EE',
              border: '2.5px solid #121212',
              borderRadius: '16px',
              padding: '16px',
              overflowY: 'auto',
              maxHeight: '420px',
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '12px'
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
                      fontWeight: 900,
                      flexShrink: 0
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

            {/* Thinking / Typing Animation */}
            {isThinking && (
              <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start', alignItems: 'center' }}>
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
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  🤖
                </div>
                <div
                  className="neo-box"
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #121212',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>AI Copilot is analyzing live club ledger...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                disabled={isThinking}
                onClick={() => handleSend(p)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: '1.5px solid #000',
                  backgroundColor: p.startsWith('Test Domain Guard') ? '#FFE4E6' : '#FFFFFF',
                  color: p.startsWith('Test Domain Guard') ? '#E11D48' : '#121212',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: isThinking ? 'not-allowed' : 'pointer',
                  opacity: isThinking ? 0.6 : 1,
                  boxShadow: '1.5px 1.5px 0px #000',
                  transition: 'all 0.1s ease'
                }}
              >
                {p.startsWith('Test Domain Guard') ? '🚫 ' : '💡 '}
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={`Ask AI Copilot about ${activeClub.short}'s finances, events, or portal features...`}
              value={inputQuery}
              disabled={isThinking}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="neo-input"
              style={{ fontWeight: 800, flex: 1 }}
            />
            <Button
              variant="yellow"
              disabled={isThinking || !inputQuery.trim()}
              onClick={() => handleSend()}
              icon={isThinking ? Loader2 : Send}
            >
              {isThinking ? 'Thinking...' : 'Ask'}
            </Button>
          </div>
        </div>
      )}

      {/* AI Event Planner (Item F) */}
      {activeTab === 'planner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="⚡ AI Autonomous Event Architect" headerBg="var(--accent-purple)">
            <form onSubmit={handleGeneratePlan} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label className="neo-label">Event Theme / Title</label>
                <input
                  type="text"
                  value={plannerTheme}
                  onChange={(e) => setPlannerTheme(e.target.value)}
                  className="neo-input"
                  placeholder="e.g. AI Hackathon, Cultural Gala"
                />
              </div>
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
              <Button variant="yellow" type="submit" disabled={isPlanning} icon={isPlanning ? Loader2 : Sparkles}>
                {isPlanning ? 'Synthesizing...' : 'Generate Plan'}
              </Button>
            </form>
          </Card>

          {generatedPlan && (
            <Card title={`📋 Generated Blueprint: ${generatedPlan.title}`} headerBg="var(--accent-green)">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 800 }}>
                    🏛️ Recommended Venue: <strong>{generatedPlan.venueRecommendation}</strong>
                  </div>
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
                    Recommended Pricing: Member Pass {inr(generatedPlan.ticketStrategy?.member || 0)} | Non-Member Pass {inr(generatedPlan.ticketStrategy?.nonMember || 0)}
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
          Autonomous assistant with tenant-isolated ledger access, anomaly detection, and dynamic event planner.
        </p>
      </div>
      {content}
    </div>
  );
};
