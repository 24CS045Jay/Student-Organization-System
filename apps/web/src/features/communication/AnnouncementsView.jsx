import React, { useState } from 'react';
import { Card, Button, Badge, Drawer } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Megaphone, Plus, Mail, Globe, Bell, Send, Users, Sparkles, Trash2 } from 'lucide-react';

export const AnnouncementsView = ({ session, activeClub, onDataChange, onToast }) => {
  const canCompose = session?.role === 'admin' || session?.role === 'event_manager' || session?.role === 'manager' || session?.role === 'super_admin';
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [activeView, setActiveView] = useState(canCompose ? 'manage' : 'feed');
  const [composeForm, setComposeForm] = useState({
    title: '',
    audience: 'All Members & Students',
    channels: ['In-app', 'Email'],
    content: ''
  });

  const club = clubService.getClub(activeClub.id);
  const announcements = club.announcements || [];
  const members = club.members || [];

  const audienceCounts = {
    'All Members & Students': members.length * 3,
    'Active Members Only': members.filter(m => m.status === 'Active').length,
    'Volunteers & Core Team': (club.volunteers || []).length,
    'Event Attendees': (club.tickets || []).length
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!canCompose || !composeForm.title) return;
    try {
      const ann = clubService.publishAnnouncement(activeClub.id, composeForm, session);
      setIsComposeOpen(false);
      setComposeForm({
        title: '',
        audience: 'All Members & Students',
        channels: ['In-app', 'Email'],
        content: ''
      });
      if (onToast) onToast(`📢 Broadcast sent to ${ann.reach} recipients via ${ann.channels.join(', ')}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleChannel = (ch) => {
    const exists = composeForm.channels.includes(ch);
    setComposeForm({
      ...composeForm,
      channels: exists ? composeForm.channels.filter(c => c !== ch) : [...composeForm.channels, ch]
    });
  };

  const handleDeleteAnnouncement = (ann) => {
    if (!window.confirm(`Delete announcement "${ann.title}"?`)) return;
    try {
      clubService.deleteAnnouncement(activeClub.id, ann.id, session);
      if (onToast) onToast(`🗑️ Deleted announcement "${ann.title}"`);
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
            Announcements & Multi-Channel Broadcast (FR-07, FR-08)
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            {canCompose
              ? `Segmented email blasts, in-app notifications, and portal updates for ${activeClub.name}.`
              : `Official announcements, event notices, and updates for ${activeClub.name}.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant={activeView === 'feed' ? 'yellow' : 'white'}
            size="sm"
            onClick={() => setActiveView('feed')}
          >
            Public Feed
          </Button>
          {canCompose && (
            <>
              <Button
                variant={activeView === 'manage' ? 'purple' : 'white'}
                size="sm"
                onClick={() => setActiveView('manage')}
              >
                Mailing Segments (FR-08)
              </Button>
              <Button variant="pink" size="sm" onClick={() => setIsComposeOpen(true)} icon={Plus}>
                Compose Broadcast
              </Button>
            </>
          )}
        </div>
      </div>

      {activeView === 'manage' && (
        <>
          {/* Audience Segmentation Cards (FR-08) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {Object.entries(audienceCounts).map(([aud, count]) => (
              <Card key={aud} title={aud} headerBg="var(--accent-purple)">
                <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0', color: 'var(--ink)' }}>
                  {count} Reach
                </h2>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                  Auto-synced from club database
                </div>
              </Card>
            ))}
          </div>

          {/* Broadcast History Table */}
          <Card title="📜 Broadcast History & Delivery Logs" headerBg="var(--accent-yellow)">
            <div className="neo-table-container">
              <table className="neo-table">
                <thead>
                  <tr>
                    <th>Title & Content</th>
                    <th>Target Audience</th>
                    <th>Channels</th>
                    <th>Date</th>
                    <th>Reach Count</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                        No announcements broadcasted yet. Click "Compose Broadcast" above to send your first message!
                      </td>
                    </tr>
                  ) : (
                    announcements.map((ann) => (
                      <tr key={ann.id}>
                        <td>
                          <div style={{ fontWeight: 900 }}>{ann.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{ann.content}</div>
                        </td>
                        <td><Badge variant="blue">{ann.audience}</Badge></td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {ann.channels.map(c => (
                              <span key={c} style={{ fontSize: '10px', fontWeight: 900, backgroundColor: '#FAF5EE', padding: '2px 6px', border: '1px solid #000', borderRadius: '4px' }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>{ann.date}</td>
                        <td style={{ fontWeight: 900 }}>{ann.reach} members</td>
                        <td><Badge variant="green">{ann.status}</Badge></td>
                        <td>
                          <Button
                            variant="white"
                            size="sm"
                            onClick={() => handleDeleteAnnouncement(ann)}
                            icon={Trash2}
                            title="Delete Announcement"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Feed View */}
      {activeView === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.length === 0 ? (
            <Card title="No Announcements" headerBg="var(--accent-yellow)">
              <div
                style={{
                  textAlign: 'center',
                  padding: '44px 20px',
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
                    backgroundColor: '#FEF9C3',
                    border: '3px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '4px 4px 0px #000'
                  }}
                >
                  📢
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0' }}>
                  No Broadcasts Yet
                </h3>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '420px' }}>
                  Club executive announcements, event updates, and news will appear here dynamically.
                </p>
                {canCompose && (
                  <Button variant="pink" onClick={() => setIsComposeOpen(true)} icon={Plus}>
                    Compose First Broadcast
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            announcements.map((ann) => (
              <Card
                key={ann.id}
                title={ann.title}
                headerBg="var(--accent-yellow)"
                headerAction={
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Badge variant="purple">{ann.audience}</Badge>
                    {canCompose && (
                      <Button
                        variant="white"
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(ann)}
                        icon={Trash2}
                        title="Delete Announcement"
                      />
                    )}
                  </div>
                }
              >
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px', lineHeight: 1.6 }}>
                  {ann.content}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 800 }}>
                  <span>Author: {ann.author}</span>
                  <span>Published on {ann.date}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Compose Broadcast Drawer (Manager & Admin only) */}
      {canCompose && (
        <Drawer
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          title="📢 Compose Multi-Channel Broadcast"
          headerColor="var(--accent-pink)"
        >
        <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="neo-label">Headline Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. 🚨 Hackathon Venue Update & Fast-Track Entry"
              value={composeForm.title}
              onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
              className="neo-input"
            />
          </div>

          <div>
            <label className="neo-label">Target Audience Segment</label>
            <select
              value={composeForm.audience}
              onChange={(e) => setComposeForm({ ...composeForm, audience: e.target.value })}
              className="neo-input neo-select"
            >
              <option value="All Members & Students">All Members & Students ({audienceCounts['All Members & Students']} people)</option>
              <option value="Active Members Only">Active Members Only ({audienceCounts['Active Members Only']} members)</option>
              <option value="Volunteers & Core Team">Volunteers & Core Team ({audienceCounts['Volunteers & Core Team']} volunteers)</option>
              <option value="Event Attendees">Registered Event Attendees</option>
            </select>
          </div>

          <div>
            <label className="neo-label">Distribution Channels:</label>
            <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '10px' }}>
              {['In-app Feed', 'Email Blast', 'Website Notice'].map((ch) => {
                const isSelected = composeForm.channels.includes(ch);
                return (
                  <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleChannel(ch)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>{ch}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="neo-label">Announcement Message Body</label>
            <textarea
              rows={4}
              required
              placeholder="Enter rich details, links, or schedule notes..."
              value={composeForm.content}
              onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
              className="neo-input"
            />
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '10px' }} icon={Send}>
            Broadcast to Audience
          </Button>
        </form>
      </Drawer>
      )}
    </div>
  );
};
