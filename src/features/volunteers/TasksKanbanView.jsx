import React, { useState } from 'react';
import { Card, Button, Badge, Modal, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { CheckSquare, Plus, Clock, User, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const TasksKanbanView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState(session.name || 'Jay Barot');
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [newTaskDeadline, setNewTaskDeadline] = useState('2026-10-20');

  const tasks = clubService.getTasks(activeClub.id);

  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'Done');

  const handleMoveTask = (taskId, newStatus, newProgress) => {
    try {
      clubService.updateTaskStatus(activeClub.id, taskId, newStatus, newProgress, session);
      if (onToast) onToast(`📋 Moved task to ${newStatus}`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    try {
      clubService.createTask(
        activeClub.id,
        {
          title: newTaskTitle,
          owner: newTaskOwner,
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
        {columnTasks.map((t) => (
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
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                Due: {t.deadline}
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
              <span>{t.owner}</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900, marginBottom: '3px' }}>
                <span>Progress</span>
                <span>{t.progress || 0}%</span>
              </div>
              <ProgressBar value={t.progress || 0} color={color} height={8} />
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
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Volunteer Task Kanban & Logistics
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Track event preparation, logistics milestones, and volunteer assignments for {activeClub.name}.
          </p>
        </div>
        <Button variant="yellow" size="sm" onClick={() => setIsAddTaskOpen(true)} icon={Plus}>
          Add Kanban Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
        {renderColumn('Pending Backlog', pendingTasks, 'Pending', 'var(--accent-yellow)')}
        {renderColumn('In Progress', inProgressTasks, 'In Progress', 'var(--accent-pink)')}
        {renderColumn('Done & Verified', doneTasks, 'Done', 'var(--accent-green)')}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        title="➕ Create Volunteer Task"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Task Objective *</label>
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
              <input
                type="text"
                placeholder="Jay Barot"
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
