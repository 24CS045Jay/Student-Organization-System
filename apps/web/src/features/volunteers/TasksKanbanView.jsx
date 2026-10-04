import React, { useState } from 'react';
import { Card, Button, Badge, Modal, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import {
  CheckSquare,
  Plus,
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Calendar,
  Filter,
  AlertCircle,
  Sparkles,
  Search,
  ShieldAlert
} from 'lucide-react';

export const TasksKanbanView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('');
  const [newTaskEventId, setNewTaskEventId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [newTaskDeadline, setNewTaskDeadline] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Filters
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [volunteerFilterMode, setVolunteerFilterMode] = useState('all'); // 'all' | 'my'

  const club = clubService.getClub(activeClub.id);
  const allTasks = clubService.getTasks(activeClub.id);
  const volunteers = club.volunteers || [];
  const members = club.members || [];
  const events = club.events || [];

  const isVolunteer = session?.role === 'volunteer' || session?.role === 'student' || session?.role === 'member';
  const isManagerOrAdmin = session?.role === 'event_manager' || session?.role === 'admin' || session?.role === 'super_admin';

  // Current volunteer identifier
  const userIdentifier = (session?.name || '').toLowerCase();
  const userEmail = (session?.email || '').toLowerCase();

  // Filter tasks
  const filteredTasks = allTasks.filter((t) => {
    // Event filter
    if (selectedEventFilter !== 'all') {
      if (t.eventId !== selectedEventFilter && t.eventName !== selectedEventFilter) return false;
    }

    // Volunteer filter mode
    if (volunteerFilterMode === 'my' || isVolunteer) {
      const isAssignedToUser =
        (t.owner && t.owner.toLowerCase() === userIdentifier) ||
        (t.assignedTo && t.assignedTo.toLowerCase() === userIdentifier) ||
        (t.assignedVolunteerEmail && t.assignedVolunteerEmail.toLowerCase() === userEmail) ||
        (t.owner && userEmail && t.owner.toLowerCase().includes(userEmail.split('@')[0]));

      // For volunteers, allow toggling between my tasks and all club logistics if they desire
      if (volunteerFilterMode === 'my' && !isAssignedToUser) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchOwner = (t.owner || t.assignedTo || '').toLowerCase().includes(q);
      const matchEvent = (t.eventName || '').toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchOwner && !matchEvent && !matchNotes) return false;
    }

    return true;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending' || t.stage === 'To Do');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress' || t.stage === 'In Progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'Done' || t.stage === 'Done');

  const handleOpenAdd = () => {
    setNewTaskTitle('');
    setNewTaskOwner(volunteers[0]?.name || members[0]?.name || '');
    setNewTaskEventId(events[0]?.id || '');
    setNewTaskPriority('High');
    setNewTaskNotes('');
    setNewTaskDeadline(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
    setIsAddTaskOpen(true);
  };

  const handleMoveTask = (taskId, newStatus, newProgress) => {
    try {
      clubService.updateTaskStatus(activeClub.id, taskId, newStatus, newProgress, session);
      if (onToast) onToast(`📋 Moved task to ${newStatus}`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = (taskId, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      clubService.deleteTask(activeClub.id, taskId, session);
      if (onToast) onToast(`🗑️ Deleted task: "${title}"`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const selectedEvent = events.find(ev => ev.id === newTaskEventId);
      clubService.createTask(
        activeClub.id,
        {
          title: newTaskTitle.trim(),
          owner: newTaskOwner || 'Volunteer Lead',
          assignedTo: newTaskOwner || 'Volunteer Lead',
          eventId: newTaskEventId || null,
          eventName: selectedEvent?.title || 'General Logistics',
          priority: newTaskPriority,
          deadline: newTaskDeadline,
          notes: newTaskNotes.trim(),
          status: 'Pending'
        },
        session
      );
      setIsAddTaskOpen(false);
      setNewTaskTitle('');
      setNewTaskNotes('');
      if (onToast) onToast(`✅ Task assigned to "${newTaskOwner || 'Volunteer'}" for event "${selectedEvent?.title || 'General'}"`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderColumn = (title, columnTasks, statusKey, color) => (
    <div
      style={{
        flex: 1,
        minWidth: '300px',
        backgroundColor: '#FAF5EE',
        border: '3px solid #121212',
        borderRadius: '20px',
        boxShadow: '4px 4px 0px #121212',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Column Header */}
      <div
        style={{
          backgroundColor: color,
          padding: '14px 18px',
          borderBottom: '2.5px solid #121212',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0 }}>{title}</h3>
        <span
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #000',
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '12px',
            fontWeight: 900
          }}
        >
          {columnTasks.length}
        </span>
      </div>

      {/* Task Cards List */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', minHeight: '380px' }}>
        {columnTasks.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              border: '2px dashed #D4D4D8',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              color: 'var(--ink-muted)',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📋</span>
            <span>No tasks in this stage</span>
          </div>
        ) : (
          columnTasks.map((t) => {
            const isAssignedToMe =
              (t.owner && userIdentifier && t.owner.toLowerCase() === userIdentifier) ||
              (t.assignedTo && userIdentifier && t.assignedTo.toLowerCase() === userIdentifier) ||
              (t.assignedVolunteerEmail && userEmail && t.assignedVolunteerEmail.toLowerCase() === userEmail);

            return (
              <div
                key={t.id}
                className="neo-box"
                style={{
                  padding: '16px',
                  border: isAssignedToMe ? '2.5px solid #121212' : '2px solid #121212',
                  backgroundColor: isAssignedToMe ? '#FFFBEB' : '#FFFFFF',
                  boxShadow: '3px 3px 0px #121212',
                  position: 'relative'
                }}
              >
                {/* Event Name Tag */}
                {t.eventName && (
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        backgroundColor: '#E0E7FF',
                        color: '#3730A3',
                        border: '1.5px solid #121212',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        fontSize: '10px',
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Calendar size={10} />
                      {t.eventName}
                    </span>
                    {isAssignedToMe && (
                      <span
                        style={{
                          backgroundColor: '#FEF08A',
                          color: '#854D0E',
                          border: '1.5px solid #121212',
                          borderRadius: '6px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 900
                        }}
                      >
                        ★ Assigned to You
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <Badge variant={t.priority === 'Urgent' ? 'pink' : t.priority === 'High' ? 'yellow' : 'blue'}>
                    {t.priority || 'Normal'}
                  </Badge>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                      Due: {t.deadline}
                    </span>
                    {/* Delete button only for Event Manager / Admin */}
                    {isManagerOrAdmin && (
                      <Button
                        variant="white"
                        size="sm"
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        icon={Trash2}
                        title="Delete Task (Manager Only)"
                        style={{ padding: '2px 6px' }}
                      />
                    )}
                  </div>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '6px', lineHeight: 1.3 }}>
                  {t.title}
                </h4>

                {t.notes && (
                  <p
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#4B5563',
                      backgroundColor: '#F3F4F6',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      marginBottom: '10px'
                    }}
                  >
                    📝 {t.notes}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)', marginBottom: '12px' }}>
                  <User size={13} />
                  <span>Assigned to: <strong style={{ color: '#121212' }}>{t.owner || t.assignedTo || 'Unassigned'}</strong></span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900, marginBottom: '3px' }}>
                    <span>Progress</span>
                    <span>{t.progress || (statusKey === 'Done' ? 100 : statusKey === 'In Progress' ? 50 : 0)}%</span>
                  </div>
                  <ProgressBar value={t.progress || (statusKey === 'Done' ? 100 : statusKey === 'In Progress' ? 50 : 0)} color={color} height={8} />
                </div>

                {/* Move Action Controls */}
                <div style={{ display: 'flex', gap: '6px', borderTop: '1.5px dashed #E4E4E7', paddingTop: '10px' }}>
                  {statusKey === 'Pending' && (
                    <Button
                      variant="yellow"
                      size="sm"
                      style={{ width: '100%' }}
                      onClick={() => handleMoveTask(t.id, 'In Progress', 50)}
                    >
                      Start Task →
                    </Button>
                  )}
                  {statusKey === 'In Progress' && (
                    <>
                      <Button
                        variant="white"
                        size="sm"
                        onClick={() => handleMoveTask(t.id, 'Pending', 0)}
                      >
                        ← Back
                      </Button>
                      <Button
                        variant="green"
                        size="sm"
                        style={{ flex: 1 }}
                        onClick={() => handleMoveTask(t.id, 'Done', 100)}
                      >
                        ✓ Complete
                      </Button>
                    </>
                  )}
                  {statusKey === 'Done' && (
                    <Button
                      variant="white"
                      size="sm"
                      style={{ width: '100%' }}
                      onClick={() => handleMoveTask(t.id, 'In Progress', 50)}
                    >
                      ↩ Reopen Task
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            {isVolunteer ? 'My Volunteer Tasks & Sprint Board' : 'Event Tasks & Volunteer Assignments'}
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            {isVolunteer
              ? 'View tasks assigned to you by Event Managers, update sprint progress, and mark tasks complete.'
              : `Assign logistics tasks to chosen volunteers for ${activeClub.name}'s events and track execution.`}
          </p>
        </div>

        {/* Action Buttons: Add Task ONLY visible to Event Managers and Admins */}
        {isManagerOrAdmin && (
          <Button variant="yellow" size="sm" onClick={handleOpenAdd} icon={Plus}>
            Assign Task to Volunteer
          </Button>
        )}
      </div>

      {/* Role Notice Banner for Volunteer */}
      {isVolunteer && (
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #1D4ED8',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '2px 2px 0px #1D4ED8'
          }}
        >
          <div style={{ fontSize: '22px' }}>💡</div>
          <div style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: '#1E3A8A' }}>
            <strong>Volunteer Workflow:</strong> Tasks are assigned to you by the Event Manager for each club event.
            Update your task status below as you start and finish your logistics duties!
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="neo-box"
        style={{
          padding: '14px 18px',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--ink-muted)' }} />
            <input
              type="text"
              placeholder="Search tasks, volunteers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
            />
          </div>

          {/* Event Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--ink-muted)' }}>Event:</span>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="neo-input neo-select"
              style={{ height: '36px', fontSize: '13px', padding: '4px 10px' }}
            >
              <option value="all">All Events ({events.length})</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.date})
                </option>
              ))}
            </select>
          </div>

          {/* Volunteer Filter Mode */}
          {isVolunteer ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setVolunteerFilterMode('my')}
                className={`neo-btn ${volunteerFilterMode === 'my' ? 'neo-btn-yellow' : 'neo-btn-white'} neo-btn-sm`}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                ★ My Assigned Tasks
              </button>
              <button
                onClick={() => setVolunteerFilterMode('all')}
                className={`neo-btn ${volunteerFilterMode === 'all' ? 'neo-btn-black' : 'neo-btn-white'} neo-btn-sm`}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                All Team Tasks
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Badge variant="purple">
                {allTasks.length} Total Logistics Tasks
              </Badge>
            </div>
          )}
        </div>

        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>
          Showing {filteredTasks.length} of {allTasks.length} tasks
        </div>
      </div>

      {/* Kanban Board 3-Column Grid */}
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px' }}>
        {renderColumn('To Do / Backlog', pendingTasks, 'Pending', '#FDE047')}
        {renderColumn('In Progress', inProgressTasks, 'In Progress', 'var(--accent-purple)')}
        {renderColumn('Done & Verified', doneTasks, 'Done', 'var(--accent-green)')}
      </div>

      {/* Add Task Modal (Managers and Admins Only) */}
      {isManagerOrAdmin && (
        <Modal
          isOpen={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          title="📋 Assign New Task to Volunteer"
          headerColor="var(--accent-yellow)"
        >
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Event Selector */}
            <div>
              <label className="neo-label">Select Event *</label>
              <select
                value={newTaskEventId}
                onChange={(e) => setNewTaskEventId(e.target.value)}
                className="neo-input neo-select"
                required
              >
                <option value="">-- General Club Logistics --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    🎟️ {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div>
              <label className="neo-label">Task Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Set up sound system & QR scanner desk"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="neo-input"
              />
            </div>

            {/* Assign Volunteer & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="neo-label">Assign to Volunteer *</label>
                <select
                  value={newTaskOwner}
                  onChange={(e) => setNewTaskOwner(e.target.value)}
                  className="neo-input neo-select"
                  required
                >
                  <option value="">-- Select Volunteer --</option>
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
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="neo-input neo-select"
                >
                  <option value="Urgent">Urgent (Red)</option>
                  <option value="High">High (Yellow)</option>
                  <option value="Medium">Medium (Blue)</option>
                  <option value="Low">Low (Gray)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="neo-label">Target Deadline</label>
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                className="neo-input"
              />
            </div>

            <div>
              <label className="neo-label">Logistics Instructions & Notes</label>
              <textarea
                rows={3}
                placeholder="Specific instructions for the volunteer, location, equipment needed..."
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                className="neo-input"
              />
            </div>

            <Button variant="yellow" type="submit" style={{ marginTop: '8px' }}>
              Assign Task to Volunteer
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
