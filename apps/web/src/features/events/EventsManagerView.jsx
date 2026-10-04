import React, { useState } from 'react';
import { Card, Button, Badge, Drawer, Modal, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';https://github.githubassets.com/images/spinners/octocat-spinner-128.gif
import { Calendar, Plus, Edit, Trash2, Users, DollarSign, TrendingUp, CheckCircle, Clock, Eye, Globe, XCircle, FileSpreadsheet, Printer, Download } from 'lucide-react';

export const EventsManagerView = ({ session, activeClub, onDataChange, onToast, onNavigate }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEventForProfit, setSelectedEventForProfit] = useState(null);
  const [selectedEventForTasks, setSelectedEventForTasks] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Task Assignment State
  const [assignTaskForm, setAssignTaskForm] = useState({
    title: '',
    volunteer: '',
    priority: 'High',
    deadline: '',
    notes: ''
  });

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

  const club = clubService.getClub(activeClub.id);
  const events = clubService.getEvents(activeClub.id);
  const allTasks = clubService.getTasks(activeClub.id);
  const volunteers = club.volunteers || [];
  const members = club.members || [];

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

  // Assign task to volunteer for selected event
  const handleAssignEventTask = (e) => {
    e.preventDefault();
    if (!selectedEventForTasks || !assignTaskForm.title.trim()) return;

    try {
      const chosenVolunteer = assignTaskForm.volunteer || (volunteers[0]?.name || members[0]?.name || 'Volunteer Lead');
      const foundVol = volunteers.find(v => v.name === chosenVolunteer);

      clubService.createTask(
        activeClub.id,
        {
          title: assignTaskForm.title.trim(),
          owner: chosenVolunteer,
          assignedTo: chosenVolunteer,
          assignedVolunteerEmail: foundVol?.email || '',
          eventId: selectedEventForTasks.id,
          eventName: selectedEventForTasks.title,
          priority: assignTaskForm.priority || 'High',
          deadline: assignTaskForm.deadline || selectedEventForTasks.date || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          notes: assignTaskForm.notes.trim(),
          status: 'Pending'
        },
        session
      );
      setAssignTaskForm({
        title: '',
        volunteer: '',
        priority: 'High',
        deadline: selectedEventForTasks.date || '',
        notes: ''
      });
      if (onToast) onToast(`✅ Assigned task "${assignTaskForm.title.trim()}" to ${chosenVolunteer}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateTaskStatus = (taskId, newStatus, newProgress) => {
    try {
      clubService.updateTaskStatus(activeClub.id, taskId, newStatus, newProgress, session);
      if (onToast) onToast(`📋 Task status updated to ${newStatus}`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = (taskId, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      clubService.deleteTask(activeClub.id, taskId, session);
      if (onToast) onToast(`🗑️ Task deleted: "${title}"`);
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
            Events Management & Volunteer Logistics
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Schedule events, assign tasks to chosen volunteers, control ticketing, and track real-time logistics readiness for {activeClub.name}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="black" size="sm" onClick={() => onNavigate && onNavigate('tasks-kanban')} icon={CheckSquare}>
            Logistics Kanban
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
              <th>Logistics & Tasks Status</th>
              <th>Live Status</th>
              <th>Status Action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                  No events found in this category. Click "Create New Event" above to publish one!
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => {
                const isPublished = (ev.status || '').toLowerCase() === 'published';
                const seatsPct = Math.round((ev.sold / ev.capacity) * 100);

                // Event tasks calculation
                const eventTasks = allTasks.filter(t => t.eventId === ev.id || t.eventName === ev.title);
                const doneTasks = eventTasks.filter(t => t.status === 'Done' || t.stage === 'Done');
                const taskPct = eventTasks.length > 0 ? Math.round((doneTasks.length / eventTasks.length) * 100) : 0;

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
                    <td style={{ minWidth: '150px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, marginBottom: '3px' }}>
                        <span>{ev.sold} Sold</span>
                        <span>{ev.capacity} Cap ({seatsPct}%)</span>
                      </div>
                      <ProgressBar value={ev.sold} max={ev.capacity} color={seatsPct > 80 ? 'var(--accent-pink)' : 'var(--accent-green)'} height={10} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 900, color: '#059669' }}>₹{ev.memberPrice}</span> / <span>₹{ev.nonMemberPrice}</span>
                    </td>

                    {/* Logistics & Tasks Status Column */}
                    <td style={{ minWidth: '160px' }}>
                      {eventTasks.length === 0 ? (
                        <button
                          onClick={() => {
                            setSelectedEventForTasks(ev);
                            setAssignTaskForm({ ...assignTaskForm, deadline: ev.date || '' });
                          }}
                          className="neo-btn neo-btn-white neo-btn-sm"
                          style={{ fontSize: '11px', padding: '3px 8px', borderStyle: 'dashed' }}
                        >
                          + Assign Volunteer
                        </button>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, marginBottom: '2px' }}>
                            <span>{doneTasks.length}/{eventTasks.length} Tasks Done</span>
                            <span style={{ color: taskPct === 100 ? '#059669' : '#D97706' }}>{taskPct}%</span>
                          </div>
                          <ProgressBar value={doneTasks.length} max={eventTasks.length} color={taskPct === 100 ? 'var(--accent-green)' : 'var(--accent-yellow)'} height={8} />
                          <div style={{ marginTop: '3px' }}>
                            <Badge variant={taskPct === 100 ? 'green' : 'yellow'} style={{ fontSize: '9px', padding: '1px 5px' }}>
                              {taskPct === 100 ? '● Logistics Ready' : '● In Preparation'}
                            </Badge>
                          </div>
                        </div>
                      )}
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
                          variant="yellow"
                          size="sm"
                          onClick={() => {
                            setSelectedEventForTasks(ev);
                            setAssignTaskForm({ ...assignTaskForm, deadline: ev.date || '' });
                          }}
                          icon={CheckSquare}
                          title="Assign Tasks to Volunteers for this Event"
                        >
                          Tasks
                        </Button>
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

      {/* Event Logistics & Volunteer Task Assignment Drawer */}
      <Drawer
        isOpen={Boolean(selectedEventForTasks)}
        onClose={() => setSelectedEventForTasks(null)}
        title={`📋 Volunteer Tasks & Logistics — ${selectedEventForTasks?.title}`}
        headerColor="var(--accent-yellow)"
      >
        {selectedEventForTasks && (() => {
          const currentEventTasks = allTasks.filter(t => t.eventId === selectedEventForTasks.id || t.eventName === selectedEventForTasks.title);
          const doneCurrent = currentEventTasks.filter(t => t.status === 'Done' || t.stage === 'Done');
          const readyPct = currentEventTasks.length > 0 ? Math.round((doneCurrent.length / currentEventTasks.length) * 100) : 0;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Event Info Card */}
              <div style={{ padding: '16px', backgroundColor: '#FAF5EE', border: '2.5px solid #000', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{selectedEventForTasks.title}</h3>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                      📅 {selectedEventForTasks.date} at {selectedEventForTasks.time} • 📍 {selectedEventForTasks.location}
                    </div>
                  </div>
                  <Badge variant={readyPct === 100 ? 'green' : 'yellow'}>
                    {readyPct === 100 ? 'Logistics Ready' : 'Logistics In Progress'}
                  </Badge>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, marginBottom: '3px' }}>
                    <span>Logistics Readiness</span>
                    <span>{doneCurrent.length}/{currentEventTasks.length} Completed ({readyPct}%)</span>
                  </div>
                  <ProgressBar value={doneCurrent.length} max={currentEventTasks.length || 1} color={readyPct === 100 ? 'var(--accent-green)' : 'var(--accent-yellow)'} height={10} />
                </div>
              </div>

              {/* Form to Assign New Task to Chosen Volunteer */}
              <Card title="➕ Assign Task to Chosen Volunteer" headerBg="var(--accent-yellow)">
                <form onSubmit={handleAssignEventTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="neo-label">Task Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Set up QR Gate Scanner & ID Desk"
                      value={assignTaskForm.title}
                      onChange={(e) => setAssignTaskForm({ ...assignTaskForm, title: e.target.value })}
                      className="neo-input"
                    />
                    {/* Quick suggestion tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {['QR Gate Check-in Desk', 'Stage Lighting & Audio', 'Attendee Welcome Kits', 'Refreshments & Snack Bar', 'Sponsor Booth Desk'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAssignTaskForm({ ...assignTaskForm, title: preset })}
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #121212',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="neo-label">Choose Volunteer *</label>
                      <select
                        required
                        value={assignTaskForm.volunteer}
                        onChange={(e) => setAssignTaskForm({ ...assignTaskForm, volunteer: e.target.value })}
                        className="neo-input neo-select"
                      >
                        <option value="">-- Choose Volunteer --</option>
                        {volunteers.map((v) => (
                          <option key={v.id || v.email} value={v.name}>
                            👤 {v.name} ({v.email || 'Volunteer'})
                          </option>
                        ))}
                        {members.map((m) => (
                          <option key={m.id} value={m.name}>
                            👥 {m.name} (Member)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="neo-label">Priority</label>
                      <select
                        value={assignTaskForm.priority}
                        onChange={(e) => setAssignTaskForm({ ...assignTaskForm, priority: e.target.value })}
                        className="neo-input neo-select"
                      >
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="neo-label">Target Deadline</label>
                    <input
                      type="date"
                      value={assignTaskForm.deadline || selectedEventForTasks.date}
                      onChange={(e) => setAssignTaskForm({ ...assignTaskForm, deadline: e.target.value })}
                      className="neo-input"
                    />
                  </div>

                  <div>
                    <label className="neo-label">Logistics Instructions & Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Specific requirements, equipment, reporting time..."
                      value={assignTaskForm.notes}
                      onChange={(e) => setAssignTaskForm({ ...assignTaskForm, notes: e.target.value })}
                      className="neo-input"
                    />
                  </div>

                  <Button variant="yellow" type="submit" style={{ marginTop: '4px' }}>
                    Assign Task to Volunteer
                  </Button>
                </form>
              </Card>

              {/* Tasks Assigned to Volunteers for this event */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '10px' }}>
                  Assigned Volunteer Tasks ({currentEventTasks.length})
                </h4>

                {currentEventTasks.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#FAF5EE', border: '1.5px dashed #000', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                    No volunteer tasks assigned for this event yet. Use the form above to assign duties to volunteers!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentEventTasks.map((t) => {
                      const isDone = t.status === 'Done' || t.stage === 'Done';
                      const isInProgress = t.status === 'In Progress' || t.stage === 'In Progress';
                      const isPending = !isDone && !isInProgress;

                      return (
                        <div
                          key={t.id}
                          style={{
                            padding: '14px',
                            backgroundColor: isDone ? '#F0FDF4' : '#FFFFFF',
                            border: '2px solid #121212',
                            borderRadius: '12px',
                            boxShadow: '2px 2px 0px #121212',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 900, fontSize: '14px' }}>{t.title}</div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>
                                👤 Assigned Volunteer: <strong>{t.owner || t.assignedTo || 'Unassigned'}</strong>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700, marginTop: '2px' }}>
                                Due: {t.deadline} • Priority: <Badge variant={t.priority === 'Urgent' ? 'pink' : t.priority === 'High' ? 'yellow' : 'blue'} style={{ fontSize: '10px' }}>{t.priority}</Badge>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Badge variant={isDone ? 'green' : isInProgress ? 'purple' : 'yellow'}>
                                {t.status || 'Pending'}
                              </Badge>
                              <Button
                                variant="white"
                                size="sm"
                                onClick={() => handleDeleteTask(t.id, t.title)}
                                icon={Trash2}
                                title="Remove Task"
                                style={{ padding: '2px 6px' }}
                              />
                            </div>
                          </div>

                          {t.notes && (
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#4B5563', backgroundColor: '#F3F4F6', padding: '6px 8px', borderRadius: '6px' }}>
                              📝 {t.notes}
                            </div>
                          )}

                          {/* Quick Manager Status Toggle */}
                          <div style={{ display: 'flex', gap: '6px', paddingTop: '6px', borderTop: '1px dashed #D4D4D8' }}>
                            {isPending && (
                              <Button
                                variant="yellow"
                                size="sm"
                                style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                                onClick={() => handleUpdateTaskStatus(t.id, 'In Progress', 50)}
                              >
                                Mark In Progress →
                              </Button>
                            )}
                            {isInProgress && (
                              <Button
                                variant="green"
                                size="sm"
                                style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                                onClick={() => handleUpdateTaskStatus(t.id, 'Done', 100)}
                              >
                                ✓ Mark Verified & Done
                              </Button>
                            )}
                            {isDone && (
                              <Button
                                variant="white"
                                size="sm"
                                style={{ width: '100%', fontSize: '11px', padding: '4px 8px' }}
                                onClick={() => handleUpdateTaskStatus(t.id, 'In Progress', 50)}
                              >
                                ↩ Reopen Task
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* Profitability Drawer */}
      <Drawer
        isOpen={Boolean(selectedEventForProfit)}
        onClose={() => setSelectedEventForProfit(null)}
        title={`Executive ROI & P&L Statement — ${selectedEventForProfit?.title}`}
        headerColor="var(--accent-purple)"
      >
        {selectedEventForProfit && (() => {
          const avgTicketPrice = (selectedEventForProfit.memberPrice + selectedEventForProfit.nonMemberPrice) / 2;
          const ticketRevenue = selectedEventForProfit.sold * avgTicketPrice;
          const totalExpenses = Object.values(selectedEventForProfit.budget || {}).reduce((a, b) => a + b, 0);
          const netSurplus = ticketRevenue - totalExpenses;
          const isProfitable = netSurplus >= 0;
          const roiPercent = totalExpenses > 0 ? ((netSurplus / totalExpenses) * 100).toFixed(1) : '100.0';
          const costPerAttendee = selectedEventForProfit.sold > 0 ? (totalExpenses / selectedEventForProfit.sold).toFixed(0) : '0';
          const fillRate = Math.round((selectedEventForProfit.sold / (selectedEventForProfit.capacity || 1)) * 100);

          const handleExportCsv = () => {
            const rows = [
              ['ClubSphere Executive Event P&L Statement'],
              ['Organization', activeClub.name],
              ['Event Title', selectedEventForProfit.title],
              ['Date & Time', `${selectedEventForProfit.date} ${selectedEventForProfit.time}`],
              ['Location', selectedEventForProfit.location],
              ['Tickets Sold', `${selectedEventForProfit.sold} / ${selectedEventForProfit.capacity} (${fillRate}%)`],
              [],
              ['Financial Metric', 'Amount (INR)'],
              ['Gross Ticket Revenue', ticketRevenue],
              ['Total Expenses Allocated', totalExpenses],
              ['Net Event Margin', netSurplus],
              ['ROI (%)', `${roiPercent}%`],
              ['Cost Per Attendee', `INR ${costPerAttendee}`],
              [],
              ['Budget Breakdown Category', 'Allocation (INR)']
            ];
            Object.entries(selectedEventForProfit.budget || {}).forEach(([cat, amt]) => {
              rows.push([cat, amt]);
            });

            const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedEventForProfit.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-financial-roi.csv`;
            a.click();
            URL.revokeObjectURL(a);
            if (onToast) onToast(`📊 Downloaded P&L CSV statement for "${selectedEventForProfit.title}"`);
          };

          const handlePrintStatement = () => {
            window.print();
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Top KPI Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '14px', backgroundColor: '#FAF5EE', border: '2px solid #121212', borderRadius: '14px', boxShadow: '3px 3px 0px #121212' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Gross Ticket Revenue</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                    +₹{ticketRevenue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '2px' }}>
                    {selectedEventForProfit.sold} passes sold
                  </div>
                </div>

                <div style={{ padding: '14px', backgroundColor: '#FAF5EE', border: '2px solid #121212', borderRadius: '14px', boxShadow: '3px 3px 0px #121212' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Total Allocated Cost</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>
                    -₹{totalExpenses.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '2px' }}>
                    ₹{costPerAttendee} / attendee
                  </div>
                </div>
              </div>

              {/* Net Surplus & ROI Banner */}
              <div
                style={{
                  padding: '16px',
                  backgroundColor: isProfitable ? '#ECFDF5' : '#FEF2F2',
                  border: `2.5px solid ${isProfitable ? '#059669' : '#DC2626'}`,
                  borderRadius: '16px',
                  boxShadow: '3px 3px 0px #121212',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: isProfitable ? '#065F46' : '#991B1B' }}>
                    {isProfitable ? '✅ Net Event Surplus' : '⚠️ Net Event Deficit'}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: isProfitable ? '#059669' : '#DC2626', marginTop: '2px' }}>
                    {isProfitable ? `+₹${netSurplus.toLocaleString()}` : `-₹${Math.abs(netSurplus).toLocaleString()}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Return on Spend</span>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: isProfitable ? '#059669' : '#DC2626' }}>
                    {roiPercent}%
                  </div>
                </div>
              </div>

              {/* Attendance & Capacity Meter */}
              <div style={{ padding: '14px', backgroundColor: '#FFFFFF', border: '2px solid #121212', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 900, marginBottom: '6px' }}>
                  <span>Auditorium Fill Rate ({fillRate}%)</span>
                  <span>{selectedEventForProfit.sold} / {selectedEventForProfit.capacity} seats</span>
                </div>
                <ProgressBar value={selectedEventForProfit.sold} max={selectedEventForProfit.capacity} color="var(--accent-purple)" />
              </div>

              {/* Budget Itemized Breakdown */}
              <Card title="Itemized Expense Ledger" headerBg="var(--accent-yellow)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(selectedEventForProfit.budget || {}).map(([item, amt]) => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                      <span style={{ textTransform: 'capitalize' }}>• {item} Cost</span>
                      <span>₹{amt.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Export & Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="neo-btn neo-btn-sm neo-btn-black"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="neo-btn neo-btn-sm neo-btn-white"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}
                >
                  <Printer size={15} />
                  <span>Print P&L</span>
                </button>
              </div>
            </div>
          );
        })()}
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
