import React, { useState } from 'react';
import { Card, Button, Badge, Modal, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { CheckSquare, Plus, Clock, User, ArrowRight, ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';

export const TasksKanbanView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState(session?.name || 'Volunteer Lead');
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [newTaskDeadline, setNewTaskDeadline] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);

  const club = clubService.getClub(activeClub.id);
  const tasks = clubService.getTasks(activeClub.id);
  const volunteers = club.volunteers || [];
  const members = club.members || [];

  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.stage === 'To Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.stage === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done' || t.stage === 'Done');

  const handleOpenAdd = () => {
    setNewTaskTitle('');
    setNewTaskOwner(session?.name || volunteers[0]?.name || members[0]?.name || 'Volunteer Lead');
    setNewTaskPriority('High');
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
      clubService.createTask(
        activeClub.id,
        {
          title: newTaskTitle.trim(),
          owner: newTaskOwner || session?.name || 'Volunteer Lead',
          priority: newTaskPriority,
          deadline: newTaskDeadline,
          status: 'Pending'
        },
        session
      );
      setIsAddTaskOpen(false);
      setNewTaskTitle('');
      if (onToast) onToast(`✅ Task created: "${newTaskTitle}"`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderColumn = (title, columnTasks, statusKey, color) => (
    <div
      style={{
        flex: 1,
        minWidth: '280px',
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
            padding: '1px 8px',
            fontSize: '11px',
            fontWeight: 900
          }}
        >
          {columnTasks.length}
        </span>
      </div>

      {/* Task Cards List */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', minHeight: '340px' }}>
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
          columnTasks.map((t) => (
            <div
              key={t.id}
              className="neo-box"
              style={{
                padding: '16px',
                border: '2px solid #121212',
                backgroundColor: '#FFFFFF',
                boxShadow: '2px 2px 0px #121212'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <Badge variant={t.priority === 'Urgent' ? 'pink' : t.priority === 'High' ? 'yellow' : 'blue'}>
                  {t.priority}
                </Badge>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                    Due: {t.deadline}
                  </span>
                  <Button
                    variant="white"
                    size="sm"
                    onClick={() => handleDeleteTask(t.id, t.title)}
                    icon={Trash2}
                    title="Delete Task"
                    style={{ padding: '2px 6px' }}
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '8px' }}>
                {t.title}
              </h4>

              {t.notes && (
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#71717A', marginBottom: '10px' }}>
                  💬 {t.notes}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)', marginBottom: '12px' }}>
                <User size={13} />
                <span>{t.owner || t.assignedTo || 'Unassigned'}</span>
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
          ))
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Volunteer Tasks & Kanban Logistics (Item N)
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Track sprint delivery, stage assignments, and operational checkpoints for {activeClub.name}.
          </p>
        </div>
        <Button variant="yellow" size="sm" onClick={handleOpenAdd} icon={Plus}>
          Add New Task
        </Button>
      </div>

      {/* Kanban Board 3-Column Grid */}
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px' }}>
        {renderColumn('To Do / Backlog', pendingTasks, 'Pending', '#FDE047')}
        {renderColumn('In Progress', inProgressTasks, 'In Progress', 'var(--accent-purple)')}
        {renderColumn('Done & Verified', doneTasks, 'Done', 'var(--accent-green)')}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        title="📋 Create New Logistics Task"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Set up sound system & stage lighting"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Assigned Volunteer</label>
              {(volunteers.length > 0 || members.length > 0) && (
                <select
                  value={newTaskOwner}
                  onChange={(e) => setNewTaskOwner(e.target.value)}
                  className="neo-input neo-select"
                  style={{ marginBottom: '6px' }}
                >
                  <option value={session?.name || 'Volunteer Lead'}>{session?.name ? `${session.name} (You)` : 'Volunteer Lead'}</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.name}>{v.name} (Volunteer)</option>
                  ))}
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.name} (Member)</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                placeholder="Or type custom volunteer name"
                value={newTaskOwner}
                onChange={(e) => setNewTaskOwner(e.target.value)}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
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
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="neo-input"
            />
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '8px' }}>
            Add Task to Backlog
          </Button>
        </form>
      </Modal>
    </div>
  );
};
