import React, { useState } from 'react';
import { Card, Button, Badge, Drawer, Modal, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Calendar, Plus, Edit, Trash2, Users, DollarSign, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export const EventsManagerView = ({ session, activeClub, onDataChange, onToast, onNavigate }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEventForProfit, setSelectedEventForProfit] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Workshop',
    date: '2026-11-20',
    time: '10:00 AM',
    location: 'CSPIT Auditorium 1',
    capacity: 100,
    memberPrice: 100,
    nonMemberPrice: 200,
    status: 'Published',
    description: ''
  });

  const events = clubService.getEvents(activeClub.id);

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      const created = clubService.createEvent(activeClub.id, formData, session);
      setIsCreateOpen(false);
      setFormData({
        title: '',
        category: 'Workshop',
        date: '2026-11-20',
        time: '10:00 AM',
        location: 'CSPIT Auditorium 1',
        capacity: 100,
        memberPrice: 100,
        nonMemberPrice: 200,
        status: 'Published',
        description: ''
      });
      if (onToast) onToast(`✅ Created event: ${created.title}`);
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
            Events Management & Capacity Control
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Configure schedules, ticket tiers, registration limits, and event profitability analysis for {activeClub.name}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="black" size="sm" onClick={() => onNavigate && onNavigate('qr-checkin')}>
            Open QR Check-in Desk
          </Button>
          <Button variant="yellow" size="sm" onClick={() => setIsCreateOpen(true)} icon={Plus}>
            Create New Event
          </Button>
        </div>
      </div>

      {/* Events Table */}
      <div className="neo-table-container">
        <table className="neo-table">
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Category</th>
              <th>Date & Location</th>
              <th>Capacity & Bookings</th>
              <th>Pricing (Mem / Non)</th>
              <th>Status</th>
              <th>Financial Profitability</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => {
              const seatsPct = Math.round((ev.sold / ev.capacity) * 100);
              const estGross = (ev.sold * ((ev.memberPrice + ev.nonMemberPrice) / 2));
              const totalExp = Object.values(ev.budget || {}).reduce((a, b) => a + b, 0);
              const netProfit = estGross - totalExp;

              return (
                <tr key={ev.id}>
                  <td>
                    <div style={{ fontWeight: 900, fontSize: '14px' }}>{ev.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Org: {ev.organizer}</div>
                  </td>
                  <td>
                    <Badge variant="blue">{ev.category}</Badge>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{ev.date}</div>
                    <div style={{ fontSize: '11px', color: '#71717A' }}>{ev.location}</div>
                  </td>
                  <td style={{ minWidth: '160px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, marginBottom: '3px' }}>
                      <span>{ev.sold} Sold</span>
                      <span>{ev.capacity} Cap ({seatsPct}%)</span>
                    </div>
                    <ProgressBar value={ev.sold} max={ev.capacity} color={seatsPct > 80 ? 'var(--accent-pink)' : 'var(--accent-green)'} height={10} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 900, color: '#059669' }}>₹{ev.memberPrice}</span> / <span>₹{ev.nonMemberPrice}</span>
                  </td>
                  <td>
                    <Badge variant={ev.status === 'Published' ? 'green' : ev.status === 'Draft' ? 'yellow' : 'black'}>
                      {ev.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="purple"
                      size="sm"
                      onClick={() => setSelectedEventForProfit(ev)}
                    >
                      P&L Statement
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Profitability Drawer (Item I) */}
      <Drawer
        isOpen={Boolean(selectedEventForProfit)}
        onClose={() => setSelectedEventForProfit(null)}
        title={`Profitability & Budget — ${selectedEventForProfit?.title}`}
        headerColor="var(--accent-purple)"
      >
        {selectedEventForProfit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: '#FAF5EE', border: '2.5px solid #000', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>Estimated Ticket Revenue</span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>
                  +₹{(selectedEventForProfit.sold * ((selectedEventForProfit.memberPrice + selectedEventForProfit.nonMemberPrice) / 2)).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>Total Allocated Expenses</span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#DC2626' }}>
                  -₹{Object.values(selectedEventForProfit.budget || {}).reduce((a, b) => a + b, 0).toLocaleString()}
                </span>
              </div>
              <div style={{ borderTop: '2px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 900 }}>Net Event Surplus / Margin:</span>
                <Badge variant="green" style={{ fontSize: '14px' }}>
                  ₹{((selectedEventForProfit.sold * ((selectedEventForProfit.memberPrice + selectedEventForProfit.nonMemberPrice) / 2)) - Object.values(selectedEventForProfit.budget || {}).reduce((a, b) => a + b, 0)).toLocaleString()}
                </Badge>
              </div>
            </div>

            <Card title="Detailed Expense Breakdown" headerBg="var(--accent-yellow)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(selectedEventForProfit.budget || {}).map(([item, amt]) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                    <span style={{ textTransform: 'capitalize' }}>• {item} Allocation</span>
                    <span>₹{amt.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Create Event Drawer */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule New Club Event"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="neo-label">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. AI Agents & Prompt Engineering Bootcamp"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="neo-input neo-select"
              >
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Competition">Competition</option>
                <option value="Fest">Fest</option>
                <option value="Webinar">Webinar</option>
              </select>
            </div>
            <div>
              <label className="neo-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="neo-input neo-select"
              >
                <option value="Published">Published (Public)</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Time</label>
              <input
                type="text"
                placeholder="10:00 AM"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Location / Room</label>
            <input
              type="text"
              placeholder="CSPIT Central Computing Lab"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label className="neo-label">Max Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Member Price (₹)</label>
              <input
                type="number"
                value={formData.memberPrice}
                onChange={(e) => setFormData({ ...formData, memberPrice: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Non-Member (₹)</label>
              <input
                type="number"
                value={formData.nonMemberPrice}
                onChange={(e) => setFormData({ ...formData, nonMemberPrice: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Description & Highlights</label>
            <textarea
              rows={3}
              placeholder="Keynotes, mentor profiles, cash prize pool details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="neo-input"
            />
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '10px' }}>
            Publish Event to Public Portal
          </Button>
        </form>
      </Drawer>
    </div>
  );
};
