import React, { useState } from 'react';
import { Card, Button, Badge, Drawer, Modal, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Calendar, Plus, Edit, Trash2, Users, DollarSign, TrendingUp, CheckCircle, Clock, Eye, Globe, XCircle } from 'lucide-react';

export const EventsManagerView = ({ session, activeClub, onDataChange, onToast, onNavigate }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEventForProfit, setSelectedEventForProfit] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

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

  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'Workshop',
    date: '',
    time: '',
    location: '',
    capacity: 100,
    memberPrice: 100,
    nonMemberPrice: 200,
    status: 'Published',
    description: ''
  });

  const events = clubService.getEvents(activeClub.id);

  const filteredEvents = events.filter(ev => {
    const s = (ev.status || '').toLowerCase().trim();
    if (statusFilter === 'published') return s === 'published';
    if (statusFilter === 'draft') return s === 'draft';
    return true;
  });

  const publishedCount = events.filter(e => (e.status || '').toLowerCase() === 'published').length;
  const draftCount = events.filter(e => (e.status || '').toLowerCase() === 'draft').length;

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
      if (onToast) onToast(`✅ Created event "${created.title}" (${created.status})! Visible to members!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePublishEvent = (ev) => {
    try {
      clubService.publishEvent(activeClub.id, ev.id, session);
      if (onToast) onToast(`📢 "${ev.title}" is now Published! All students & members can see and register for this event!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnpublishEvent = (ev) => {
    try {
      clubService.updateEventStatus(activeClub.id, ev.id, 'Draft', session);
      if (onToast) onToast(`📝 "${ev.title}" set to Draft (Hidden from members).`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (ev) => {
    setEditingEvent(ev);
    setEditFormData({
      title: ev.title,
      category: ev.category || 'Workshop',
      date: ev.date || '',
      time: ev.time || '',
      location: ev.location || '',
      capacity: ev.capacity || 100,
      memberPrice: ev.memberPrice || 0,
      nonMemberPrice: ev.nonMemberPrice || 0,
      status: ev.status || 'Published',
      description: ev.description || ''
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      clubService.updateEvent(activeClub.id, editingEvent.id, editFormData, session);
      setEditingEvent(null);
      if (onToast) onToast(`✅ Event "${editFormData.title}" updated successfully!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteEvent = (ev) => {
    if (window.confirm(`Are you sure you want to delete event "${ev.title}"?`)) {
      try {
        clubService.deleteEvent(activeClub.id, ev.id, session);
        if (onToast) onToast(`🗑️ Event "${ev.title}" removed.`);
        if (onDataChange) onDataChange();
      } catch (err) {
        alert(err.message);
      }
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
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="black" size="sm" onClick={() => onNavigate && onNavigate('browse-events')} icon={Globe}>
            View Student Portal
          </Button>
          <Button variant="black" size="sm" onClick={() => onNavigate && onNavigate('qr-checkin')}>
            QR Check-in Desk
          </Button>
          <Button variant="yellow" size="sm" onClick={() => setIsCreateOpen(true)} icon={Plus}>
            Create New Event
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setStatusFilter('all')}
          className={`neo-btn ${statusFilter === 'all' ? 'neo-btn-black' : 'neo-btn-white'} neo-btn-sm`}
        >
          All Events ({events.length})
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className={`neo-btn ${statusFilter === 'published' ? 'neo-btn-green' : 'neo-btn-white'} neo-btn-sm`}
        >
          ✓ Published & Live ({publishedCount})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`neo-btn ${statusFilter === 'draft' ? 'neo-btn-yellow' : 'neo-btn-white'} neo-btn-sm`}
        >
          📝 Drafts ({draftCount})
        </button>
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
              <th>Live Status</th>
              <th>Status Action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                  No events found in this category. Click "Create New Event" above to publish one!
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => {
                const isPublished = (ev.status || '').toLowerCase() === 'published';
                const seatsPct = Math.round((ev.sold / ev.capacity) * 100);
                const estGross = (ev.sold * ((ev.memberPrice + ev.nonMemberPrice) / 2));
                const totalExp = Object.values(ev.budget || {}).reduce((a, b) => a + b, 0);

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
                      <Badge variant={isPublished ? 'green' : ev.status === 'Draft' ? 'yellow' : 'black'}>
                        {isPublished ? '● Published (Live)' : ev.status || 'Draft'}
                      </Badge>
                    </td>
                    <td>
                      {isPublished ? (
                        <Button
                          variant="white"
                          size="sm"
                          onClick={() => handleUnpublishEvent(ev)}
                          title="Switch to Draft (Hide from Members)"
                        >
                          Unpublish
                        </Button>
                      ) : (
                        <Button
                          variant="green"
                          size="sm"
                          onClick={() => handlePublishEvent(ev)}
                          icon={CheckCircle}
                          title="Publish this event to Student & Member portal"
                        >
                          Publish Now
                        </Button>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Button
                          variant="purple"
                          size="sm"
                          onClick={() => setSelectedEventForProfit(ev)}
                          title="P&L Profitability Breakdown"
                        >
                          P&L
                        </Button>
                        <Button
                          variant="white"
                          size="sm"
                          onClick={() => handleOpenEdit(ev)}
                          icon={Edit}
                          title="Edit Event"
                        />
                        <Button
                          variant="pink"
                          size="sm"
                          onClick={() => handleDeleteEvent(ev)}
                          icon={Trash2}
                          title="Delete Event"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Profitability Drawer */}
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

      {/* Edit Event Drawer */}
      <Drawer
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        title={`Edit Event: ${editingEvent?.title}`}
        headerColor="var(--accent-purple)"
      >
        {editingEvent && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="neo-label">Event Title *</label>
              <input
                type="text"
                required
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="neo-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="neo-label">Category</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
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
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="neo-input neo-select"
                >
                  <option value="Published">Published (Public to Members)</option>
                  <option value="Draft">Draft (Hidden)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="neo-label">Date</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="neo-input"
                />
              </div>
              <div>
                <label className="neo-label">Time</label>
                <input
                  type="text"
                  value={editFormData.time}
                  onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                  className="neo-input"
                />
              </div>
            </div>

            <div>
              <label className="neo-label">Location / Room</label>
              <input
                type="text"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                className="neo-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label className="neo-label">Max Capacity</label>
                <input
                  type="number"
                  value={editFormData.capacity}
                  onChange={(e) => setEditFormData({ ...editFormData, capacity: Number(e.target.value) })}
                  className="neo-input"
                />
              </div>
              <div>
                <label className="neo-label">Member Price (₹)</label>
                <input
                  type="number"
                  value={editFormData.memberPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, memberPrice: Number(e.target.value) })}
                  className="neo-input"
                />
              </div>
              <div>
                <label className="neo-label">Non-Member (₹)</label>
                <input
                  type="number"
                  value={editFormData.nonMemberPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, nonMemberPrice: Number(e.target.value) })}
                  className="neo-input"
                />
              </div>
            </div>

            <div>
              <label className="neo-label">Description & Highlights</label>
              <textarea
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="neo-input"
              />
            </div>

            <Button variant="yellow" type="submit" style={{ marginTop: '10px' }}>
              Save & Apply Changes
            </Button>
          </form>
        )}
      </Drawer>

      {/* Create Event Drawer */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule & Publish New Club Event"
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
                <option value="Published">Published (Public to Members)</option>
                <option value="Draft">Draft (Internal Only)</option>
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
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Member Price (₹)</label>
              <input
                type="number"
                value={formData.memberPrice}
                onChange={(e) => setFormData({ ...formData, memberPrice: Number(e.target.value) })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Non-Member (₹)</label>
              <input
                type="number"
                value={formData.nonMemberPrice}
                onChange={(e) => setFormData({ ...formData, nonMemberPrice: Number(e.target.value) })}
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
