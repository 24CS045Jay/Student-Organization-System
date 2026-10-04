import React, { useState } from 'react';
import { Card, Button, Badge, Modal, Drawer, StatCard, ProgressBar } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import {
  Users,
  Plus,
  Clock,
  Award,
  Sparkles,
  Search,
  Filter,
  CheckSquare,
  Edit,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  Calendar,
  Grid,
  List,
  Star,
  ShieldCheck,
  UserCheck,
  BookOpen
} from 'lucide-react';

export const VolunteersListView = ({ session, activeClub, onDataChange, onToast, onNavigate }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'On Duty'
  const [tierFilter, setTierFilter] = useState('all');

  // Modals / Drawers State
  const [isAddVolunteerOpen, setIsAddVolunteerOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [loggingHoursVol, setLoggingHoursVol] = useState(null);
  const [viewingTasksVol, setViewingTasksVol] = useState(null);
  const [hoursToAdd, setHoursToAdd] = useState(4);
  const [hourNote, setHourNote] = useState('Event Duty Service');

  // New Volunteer Form
  const [newVolForm, setNewVolForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Computer Engineering',
    roleTitle: 'Event Operations Volunteer',
    skills: 'Event Logistics, Gate QR Scanner, Stage AV',
    hours: 10,
    rating: 5.0,
    status: 'Active'
  });

  // Edit Volunteer Form
  const [editVolForm, setEditVolForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    roleTitle: '',
    skills: '',
    hours: 0,
    rating: 5.0,
    status: 'Active'
  });

  const club = clubService.getClub(activeClub.id);
  const volunteers = clubService.getVolunteers(activeClub.id);
  const allTasks = clubService.getTasks(activeClub.id);

  // Filtered Volunteers
  const filteredVolunteers = volunteers.filter((vol) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (vol.name || '').toLowerCase().includes(q);
      const matchEmail = (vol.email || '').toLowerCase().includes(q);
      const matchDept = (vol.department || '').toLowerCase().includes(q);
      const matchSkills = (vol.skills || []).some(s => s.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchDept && !matchSkills) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const currentStatus = vol.status || 'Active';
      if (currentStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    // Tier filter
    if (tierFilter !== 'all') {
      const badge = (vol.badge || '').toLowerCase();
      if (!badge.includes(tierFilter.toLowerCase())) return false;
    }

    return true;
  });

  // Aggregated Stats
  const totalVolunteers = volunteers.length;
  const activeVolunteersCount = volunteers.filter(v => (v.status || 'Active') === 'Active').length;
  const totalHours = volunteers.reduce((acc, v) => acc + (Number(v.hours || v.service_hours) || 0), 0);
  const avgRating = volunteers.length > 0
    ? (volunteers.reduce((acc, v) => acc + (Number(v.rating) || 4.8), 0) / volunteers.length).toFixed(1)
    : '5.0';

  // Handlers
  const handleCreateVolunteer = (e) => {
    e.preventDefault();
    if (!newVolForm.name.trim() || !newVolForm.email.trim()) return;

    try {
      clubService.addVolunteer(activeClub.id, newVolForm, session);
      setIsAddVolunteerOpen(false);
      setNewVolForm({
        name: '',
        email: '',
        phone: '',
        department: 'Computer Engineering',
        roleTitle: 'Event Operations Volunteer',
        skills: 'Event Logistics, Gate QR Scanner, Stage AV',
        hours: 10,
        rating: 5.0,
        status: 'Active'
      });
      if (onToast) onToast(`✅ Volunteer "${newVolForm.name}" registered to ${activeClub.name}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (vol) => {
    setEditingVolunteer(vol);
    setEditVolForm({
      name: vol.name || '',
      email: vol.email || '',
      phone: vol.phone || '',
      department: vol.department || 'Computer Engineering',
      roleTitle: vol.roleTitle || 'Event Operations Volunteer',
      skills: Array.isArray(vol.skills) ? vol.skills.join(', ') : (vol.skills || ''),
      hours: Number(vol.hours || vol.service_hours) || 0,
      rating: Number(vol.rating) || 5.0,
      status: vol.status || 'Active'
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingVolunteer) return;

    try {
      clubService.updateVolunteer(activeClub.id, editingVolunteer.id, editVolForm, session);
      setEditingVolunteer(null);
      if (onToast) onToast(`✅ Updated volunteer profile for "${editVolForm.name}"!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmLogHours = () => {
    if (!loggingHoursVol) return;

    try {
      const updated = clubService.logVolunteerHours(activeClub.id, loggingHoursVol.id || loggingHoursVol.email, hoursToAdd, session);
      setLoggingHoursVol(null);
      if (onToast) onToast(`⏱️ Added +${hoursToAdd}h for ${updated.name} (Total: ${updated.hours}h)`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVolunteer = (vol) => {
    if (!window.confirm(`Are you sure you want to remove volunteer "${vol.name}" from active roster?`)) return;

    try {
      clubService.deleteVolunteer(activeClub.id, vol.id, session);
      if (onToast) onToast(`🗑️ Removed volunteer "${vol.name}" from club.`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Active Club Volunteers Directory (FR-12 & FR-13)
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Complete roster of all active student volunteers in {activeClub.name}, tracked competencies, verified hours, and task assignments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="black" size="sm" onClick={() => onNavigate && onNavigate('tasks-kanban')} icon={CheckSquare}>
            Tasks Kanban
          </Button>
          <Button variant="black" size="sm" onClick={() => onNavigate && onNavigate('leaderboard')} icon={Award}>
            Leaderboard
          </Button>
          <Button variant="yellow" size="sm" onClick={() => setIsAddVolunteerOpen(true)} icon={Plus}>
            Register New Volunteer
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Total Volunteers"
          value={totalVolunteers}
          subtitle={`${activeVolunteersCount} Active on Roster`}
          icon={Users}
          color="var(--accent-yellow)"
        />
        <StatCard
          title="Total Service Hours"
          value={`${totalHours} hrs`}
          subtitle="Verified Logistics Service"
          icon={Clock}
          color="var(--accent-green)"
        />
        <StatCard
          title="Avg Volunteer Rating"
          value={`⭐ ${avgRating} / 5.0`}
          subtitle="Organizer Feedback Score"
          icon={Sparkles}
          color="var(--accent-purple)"
        />
        <StatCard
          title="Active Logistics Tasks"
          value={allTasks.length}
          subtitle="Assigned Across Events"
          icon={CheckSquare}
          color="#FFD24C"
        />
      </div>

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
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--ink-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, email, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--ink-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neo-input neo-select"
              style={{ height: '36px', fontSize: '13px', padding: '4px 10px' }}
            >
              <option value="all">All Statuses ({volunteers.length})</option>
              <option value="Active">Active</option>
              <option value="Available">Available</option>
              <option value="On Duty">On Duty</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--ink-muted)' }}>Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="neo-input neo-select"
              style={{ height: '36px', fontSize: '13px', padding: '4px 10px' }}
            >
              <option value="all">All Contributor Tiers</option>
              <option value="Gold">Gold Legend (100h+)</option>
              <option value="Silver">Silver Contributor (50h+)</option>
              <option value="Bronze">Bronze Contributor (25h+)</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle & Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', border: '2px solid #000', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 10px',
                backgroundColor: viewMode === 'table' ? '#FFD24C' : '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                backgroundColor: viewMode === 'grid' ? '#FFD24C' : '#FFFFFF',
                border: 'none',
                borderLeft: '2px solid #000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Card Grid View"
            >
              <Grid size={16} />
            </button>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>
            Showing {filteredVolunteers.length} volunteers
          </span>
        </div>
      </div>

      {/* Main Volunteers View: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="neo-table-container">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Volunteer Name & Info</th>
                <th>Role & Department</th>
                <th>Verified Skills</th>
                <th>Service Hours</th>
                <th>Gamified Tier</th>
                <th>Rating</th>
                <th>Assigned Tasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                    No volunteers found matching your query. Click "Register New Volunteer" above to add one to the club!
                  </td>
                </tr>
              ) : (
                filteredVolunteers.map((vol) => {
                  const volIdentifier = (vol.name || '').toLowerCase();
                  const volEmail = (vol.email || '').toLowerCase();
                  const volTasks = allTasks.filter(t => {
                    const o = (t.owner || '').toLowerCase();
                    const a = (t.assignedTo || '').toLowerCase();
                    const e = (t.assignedVolunteerEmail || '').toLowerCase();
                    return o === volIdentifier || a === volIdentifier || (volEmail && e === volEmail);
                  });
                  const doneVolTasks = volTasks.filter(t => t.status === 'Done' || t.stage === 'Done');

                  return (
                    <tr key={vol.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#FFE853',
                              border: '2px solid #121212',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '14px'
                            }}
                          >
                            {(vol.name || 'V').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '14px' }}>{vol.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                              {vol.email} {vol.phone && `• ${vol.phone}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '13px' }}>{vol.roleTitle || 'Event Volunteer'}</div>
                        <div style={{ fontSize: '11px', color: '#71717A' }}>{vol.department || 'Computer Engineering'}</div>
                      </td>
                      <td style={{ maxWidth: '220px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(vol.skills && vol.skills.length > 0 ? vol.skills : ['Event Logistics']).map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                border: '1px solid #1D4ED8',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                fontSize: '10px',
                                fontWeight: 800
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 900, fontSize: '14px', color: '#059669' }}>
                            {vol.hours || vol.service_hours || 0} hrs
                          </span>
                          <Button
                            variant="white"
                            size="sm"
                            onClick={() => {
                              setLoggingHoursVol(vol);
                              setHoursToAdd(4);
                            }}
                            title="Log / Add Service Hours"
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            + Hours
                          </Button>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            (vol.badge || '').includes('Gold')
                              ? 'yellow'
                              : (vol.badge || '').includes('Silver')
                              ? 'purple'
                              : 'blue'
                          }
                          style={{ fontSize: '11px' }}
                        >
                          {(vol.badge || '').includes('Gold') ? '🏆 ' : (vol.badge || '').includes('Silver') ? '🥈 ' : '🥉 '}
                          {vol.badge || 'Bronze Contributor'}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontWeight: 900, fontSize: '13px' }}>
                          ⭐ {vol.rating || '4.9'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setViewingTasksVol(vol)}
                          className="neo-btn neo-btn-white neo-btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CheckSquare size={12} />
                          <span>{doneVolTasks.length}/{volTasks.length} Tasks</span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Button
                            variant="white"
                            size="sm"
                            onClick={() => handleOpenEdit(vol)}
                            icon={Edit}
                            title="Edit Volunteer Details"
                          />
                          <Button
                            variant="pink"
                            size="sm"
                            onClick={() => handleDeleteVolunteer(vol)}
                            icon={Trash2}
                            title="Remove from Roster"
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
      ) : (
        /* Card Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredVolunteers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px', fontWeight: 800, color: 'var(--ink-muted)' }}>
              No volunteers found matching your query.
            </div>
          ) : (
            filteredVolunteers.map((vol) => {
              const volIdentifier = (vol.name || '').toLowerCase();
              const volEmail = (vol.email || '').toLowerCase();
              const volTasks = allTasks.filter(t => {
                const o = (t.owner || '').toLowerCase();
                const a = (t.assignedTo || '').toLowerCase();
                const e = (t.assignedVolunteerEmail || '').toLowerCase();
                return o === volIdentifier || a === volIdentifier || (volEmail && e === volEmail);
              });
              const doneVolTasks = volTasks.filter(t => t.status === 'Done' || t.stage === 'Done');

              return (
                <div
                  key={vol.id}
                  className="neo-box"
                  style={{
                    padding: '20px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}
                >
                  <div>
                    {/* Top Row: Avatar + Name + Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: '#FFE853',
                            border: '2px solid #121212',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '16px'
                          }}
                        >
                          {(vol.name || 'V').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{vol.name}</h3>
                          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                            {vol.roleTitle || 'Event Operations Volunteer'}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          (vol.badge || '').includes('Gold')
                            ? 'yellow'
                            : (vol.badge || '').includes('Silver')
                            ? 'purple'
                            : 'blue'
                        }
                      >
                        {vol.badge || 'Bronze Contributor'}
                      </Badge>
                    </div>

                    {/* Contact & Department */}
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} />
                        <span>{vol.email}</span>
                      </div>
                      {vol.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} />
                          <span>{vol.phone}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={12} />
                        <span>{vol.department || 'Computer Engineering'}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--ink-muted)', marginBottom: '4px' }}>
                        Verified Skills:
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(vol.skills && vol.skills.length > 0 ? vol.skills : ['Event Logistics']).map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: '#FAF5EE',
                              color: '#121212',
                              border: '1.5px solid #121212',
                              borderRadius: '6px',
                              padding: '2px 7px',
                              fontSize: '11px',
                              fontWeight: 800
                            }}
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', backgroundColor: '#FAF5EE', border: '1.5px solid #121212', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ink-muted)' }}>Service Hours</div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#059669' }}>{vol.hours || vol.service_hours || 0} hrs</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ink-muted)' }}>Rating Score</div>
                        <div style={{ fontSize: '15px', fontWeight: 900 }}>⭐ {vol.rating || '4.9'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1.5px dashed #E5E7EB' }}>
                    <Button
                      variant="yellow"
                      size="sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setLoggingHoursVol(vol);
                        setHoursToAdd(4);
                      }}
                      icon={Clock}
                    >
                      Log Hours
                    </Button>
                    <Button
                      variant="white"
                      size="sm"
                      onClick={() => setViewingTasksVol(vol)}
                      icon={CheckSquare}
                      title="View Assigned Tasks"
                    >
                      Tasks ({volTasks.length})
                    </Button>
                    <Button
                      variant="white"
                      size="sm"
                      onClick={() => handleOpenEdit(vol)}
                      icon={Edit}
                      title="Edit Profile"
                    />
                    <Button
                      variant="pink"
                      size="sm"
                      onClick={() => handleDeleteVolunteer(vol)}
                      icon={Trash2}
                      title="Remove Volunteer"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Register New Volunteer */}
      <Modal
        isOpen={isAddVolunteerOpen}
        onClose={() => setIsAddVolunteerOpen(false)}
        title="➕ Register New Volunteer to Club Roster"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleCreateVolunteer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={newVolForm.name}
              onChange={(e) => setNewVolForm({ ...newVolForm, name: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Campus Email *</label>
              <input
                type="email"
                required
                placeholder="rahul@charusat.edu.in"
                value={newVolForm.email}
                onChange={(e) => setNewVolForm({ ...newVolForm, email: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98250 12345"
                value={newVolForm.phone}
                onChange={(e) => setNewVolForm({ ...newVolForm, phone: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Department / Branch</label>
              <input
                type="text"
                placeholder="e.g. Information Technology"
                value={newVolForm.department}
                onChange={(e) => setNewVolForm({ ...newVolForm, department: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Volunteer Role Designation</label>
              <input
                type="text"
                placeholder="e.g. Logistics & AV Lead"
                value={newVolForm.roleTitle}
                onChange={(e) => setNewVolForm({ ...newVolForm, roleTitle: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Verified Competencies / Skills (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Gate QR Scanner, Sound & Lighting, Registration Desk, PR & Social"
              value={newVolForm.skills}
              onChange={(e) => setNewVolForm({ ...newVolForm, skills: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Initial Service Hours Logged</label>
              <input
                type="number"
                min="0"
                value={newVolForm.hours}
                onChange={(e) => setNewVolForm({ ...newVolForm, hours: Number(e.target.value) })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Initial Rating (out of 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={newVolForm.rating}
                onChange={(e) => setNewVolForm({ ...newVolForm, rating: Number(e.target.value) })}
                className="neo-input"
              />
            </div>
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '8px' }}>
            Add Volunteer to Active Roster
          </Button>
        </form>
      </Modal>

      {/* Modal: Edit Volunteer */}
      <Drawer
        isOpen={Boolean(editingVolunteer)}
        onClose={() => setEditingVolunteer(null)}
        title={`Edit Volunteer: ${editingVolunteer?.name}`}
        headerColor="var(--accent-purple)"
      >
        {editingVolunteer && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="neo-label">Full Name *</label>
              <input
                type="text"
                required
                value={editVolForm.name}
                onChange={(e) => setEditVolForm({ ...editVolForm, name: e.target.value })}
                className="neo-input"
              />
            </div>

            <div>
              <label className="neo-label">Email Address *</label>
              <input
                type="email"
                required
                value={editVolForm.email}
                onChange={(e) => setEditVolForm({ ...editVolForm, email: e.target.value })}
                className="neo-input"
              />
            </div>

            <div>
              <label className="neo-label">Phone Number</label>
              <input
                type="tel"
                value={editVolForm.phone}
                onChange={(e) => setEditVolForm({ ...editVolForm, phone: e.target.value })}
                className="neo-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="neo-label">Department</label>
                <input
                  type="text"
                  value={editVolForm.department}
                  onChange={(e) => setEditVolForm({ ...editVolForm, department: e.target.value })}
                  className="neo-input"
                />
              </div>
              <div>
                <label className="neo-label">Status</label>
                <select
                  value={editVolForm.status}
                  onChange={(e) => setEditVolForm({ ...editVolForm, status: e.target.value })}
                  className="neo-input neo-select"
                >
                  <option value="Active">Active</option>
                  <option value="Available">Available</option>
                  <option value="On Duty">On Duty</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="neo-label">Designation / Role Title</label>
              <input
                type="text"
                value={editVolForm.roleTitle}
                onChange={(e) => setEditVolForm({ ...editVolForm, roleTitle: e.target.value })}
                className="neo-input"
              />
            </div>

            <div>
              <label className="neo-label">Verified Competencies (Comma separated)</label>
              <input
                type="text"
                value={editVolForm.skills}
                onChange={(e) => setEditVolForm({ ...editVolForm, skills: e.target.value })}
                className="neo-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="neo-label">Total Hours</label>
                <input
                  type="number"
                  min="0"
                  value={editVolForm.hours}
                  onChange={(e) => setEditVolForm({ ...editVolForm, hours: Number(e.target.value) })}
                  className="neo-input"
                />
              </div>
              <div>
                <label className="neo-label">Rating (1.0 - 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={editVolForm.rating}
                  onChange={(e) => setEditVolForm({ ...editVolForm, rating: Number(e.target.value) })}
                  className="neo-input"
                />
              </div>
            </div>

            <Button variant="yellow" type="submit" style={{ marginTop: '10px' }}>
              Save & Apply Changes
            </Button>
          </form>
        )}
      </Drawer>

      {/* Modal: Log Service Hours */}
      <Modal
        isOpen={Boolean(loggingHoursVol)}
        onClose={() => setLoggingHoursVol(null)}
        title={`⏱️ Log Volunteer Hours — ${loggingHoursVol?.name}`}
        headerColor="var(--accent-yellow)"
      >
        {loggingHoursVol && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>
                Current Verified Total: <strong style={{ color: '#059669' }}>{loggingHoursVol.hours || loggingHoursVol.service_hours || 0} hrs</strong>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                Current Tier: {loggingHoursVol.badge || 'Bronze Contributor'}
              </div>
            </div>

            <div>
              <label className="neo-label">Select Hours to Add:</label>
              <input
                type="number"
                min="1"
                max="24"
                value={hoursToAdd}
                onChange={(e) => setHoursToAdd(Number(e.target.value))}
                className="neo-input"
              />
            </div>

            <div>
              <label className="neo-label">Duty / Activity Description:</label>
              <input
                type="text"
                value={hourNote}
                onChange={(e) => setHourNote(e.target.value)}
                placeholder="e.g. AI Hackathon Gate Check-in Duty"
                className="neo-input"
              />
            </div>

            <Button variant="yellow" style={{ width: '100%' }} onClick={handleConfirmLogHours}>
              Confirm & Credit +{hoursToAdd} Hours
            </Button>
          </div>
        )}
      </Modal>

      {/* Drawer: Viewing Volunteer Assigned Tasks */}
      <Drawer
        isOpen={Boolean(viewingTasksVol)}
        onClose={() => setViewingTasksVol(null)}
        title={`📋 Assigned Tasks — ${viewingTasksVol?.name}`}
        headerColor="var(--accent-yellow)"
      >
        {viewingTasksVol && (() => {
          const volIdentifier = (viewingTasksVol.name || '').toLowerCase();
          const volEmail = (viewingTasksVol.email || '').toLowerCase();
          const volTasks = allTasks.filter(t => {
            const o = (t.owner || '').toLowerCase();
            const a = (t.assignedTo || '').toLowerCase();
            const e = (t.assignedVolunteerEmail || '').toLowerCase();
            return o === volIdentifier || a === volIdentifier || (volEmail && e === volEmail);
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '14px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px' }}>
                <div style={{ fontWeight: 900, fontSize: '15px' }}>{viewingTasksVol.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                  {viewingTasksVol.email} • {viewingTasksVol.roleTitle}
                </div>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '4px 0 0' }}>
                Active Tasks ({volTasks.length})
              </h4>

              {volTasks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#FAF5EE', border: '1.5px dashed #000', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                  No tasks currently assigned to this volunteer. Head to Events Management or Tasks Kanban to assign duties!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {volTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px',
                        backgroundColor: t.status === 'Done' ? '#F0FDF4' : '#FAF5EE',
                        border: '2px solid #121212',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          {t.eventName && (
                            <span
                              style={{
                                backgroundColor: '#E0E7FF',
                                color: '#3730A3',
                                border: '1px solid #121212',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                fontSize: '10px',
                                fontWeight: 800,
                                display: 'inline-block',
                                marginBottom: '2px'
                              }}
                            >
                              🎟️ {t.eventName}
                            </span>
                          )}
                          <div style={{ fontWeight: 900, fontSize: '13px' }}>{t.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                            Due: {t.deadline} • Priority: {t.priority}
                          </div>
                        </div>
                        <Badge variant={t.status === 'Done' ? 'green' : t.status === 'In Progress' ? 'purple' : 'yellow'}>
                          {t.status || 'Pending'}
                        </Badge>
                      </div>

                      {t.notes && (
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#4B5563', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                          💬 {t.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
};
