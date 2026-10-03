import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Shield,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Globe
} from 'lucide-react';
import { dbInstance } from '../../mock/db';
import { clubService } from '../../services/clubService';
import { authService } from '../../services/authService';

export const AuthView = ({ onAuthSuccess, onBackToLanding, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available roles (strictly club roles)
  const roles = [
    { value: 'student', label: 'Student / Club Member' },
    { value: 'volunteer', label: 'Club Volunteer' },
    { value: 'event_manager', label: 'Event Manager' },
    { value: 'treasurer', label: 'Club Treasurer' },
    { value: 'admin', label: 'Club Administrator' }
  ];

  // Dynamic Helper: Detect club based on email address across all registered clubs
  const detectClubFromEmail = (emailStr) => {
    const lower = (emailStr || '').toLowerCase();
    const registeredClubs = Object.values(dbInstance.data.clubs || {});
    if (registeredClubs.length === 0) return null;

    // 1. Match by configured email domain (e.g. @robotics.campus.edu)
    for (const club of registeredClubs) {
      if (club.emailDomain) {
        const domainClean = club.emailDomain.replace('@', '').toLowerCase();
        if (domainClean && lower.includes(domainClean)) {
          return { id: club.id, name: club.name, color: club.color || '#FFE853' };
        }
      }
    }

    // 2. Match by club ID, short code, or prefix
    for (const club of registeredClubs) {
      if (
        (club.id && lower.includes(club.id.toLowerCase())) ||
        (club.short && lower.includes(club.short.toLowerCase())) ||
        (club.prefix && lower.includes(club.prefix.toLowerCase()))
      ) {
        return { id: club.id, name: club.name, color: club.color || '#FFE853' };
      }
    }

    // 3. If there is only 1 registered club on campus, map to that club
    if (registeredClubs.length === 1 && lower.includes('@')) {
      const single = registeredClubs[0];
      return { id: single.id, name: single.name, color: single.color || '#FFE853' };
    }

    return null;
  };

  const detectedClub = detectClubFromEmail(email);

  // Quick Demo Personas dynamically derived from active registered clubs
  const registeredClubsList = Object.values(dbInstance.data.clubs || {});
  const demoPersonas = registeredClubsList.flatMap(c => [
    { role: 'admin', orgId: c.id, email: `admin${c.emailDomain || `@${c.id}.campus.edu`}`, name: `${c.short || c.name} Admin`, label: `${c.short || c.name} Admin`, color: c.color || '#FFE853' },
    { role: 'student', orgId: c.id, email: `student${c.emailDomain || `@${c.id}.campus.edu`}`, name: `${c.short || c.name} Student`, label: `${c.short || c.name} Student`, color: '#70D6FF' }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your institutional or club email address.');
      return;
    }

    if (registeredClubsList.length === 0) {
      setError('⚠️ No student clubs have been created yet on the platform. Please access the Super Admin Portal to onboard your first club organization.');
      return;
    }

    const club = detectClubFromEmail(email);
    if (!club) {
      setError(`❌ No club found matching the email domain "${email.split('@')[1] || email}". Please verify your email or onboard this club in the Super Admin Portal.`);
      return;
    }

    setIsSubmitting(true);
    const assignedRole = role;
    const userName = name.trim() || email.split('@')[0].replace('.', ' ').toUpperCase();

    // If registering a new user, also record in club.members table if not already present
    if (mode === 'register') {
      try {
        clubService.registerMember(club.id, {
          name: userName,
          email: email,
          dept: 'Computer Engineering',
          type: 'Standard Member',
          paid: 1
        }, { email, role: assignedRole });
      } catch (err) {
        console.warn('Auto member registration notice:', err);
      }
    }

    try {
      const sessionData = await authService.login({
        email,
        password: password || 'Password123!',
        role: assignedRole,
        orgId: club.id,
        name: userName
      });

      setIsSubmitting(false);
      onAuthSuccess(sessionData);
    } catch (err) {
      setIsSubmitting(false);
      onAuthSuccess({
        role: assignedRole,
        orgId: club.id,
        email: email,
        name: userName
      });
    }
  };

  const handleQuickDemo = async (persona) => {
    setEmail(persona.email);
    setRole(persona.role);
    setName(persona.name);
    setPassword('demo1234');
    setIsSubmitting(true);

    try {
      const sessionData = await authService.login({
        email: persona.email,
        password: 'Password123!',
        role: persona.role,
        orgId: persona.orgId,
        name: persona.name
      });
      setIsSubmitting(false);
      onAuthSuccess(sessionData);
    } catch (err) {
      setIsSubmitting(false);
      onAuthSuccess({
        role: persona.role,
        orgId: persona.orgId,
        email: persona.email,
        name: persona.name
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFDF7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}
    >
      {/* Back Button */}
      <button
        onClick={onBackToLanding}
        className="neo-btn neo-btn-white neo-btn-sm"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Landing Page</span>
      </button>

      {/* Main Auth Box */}
      <div
        className="neo-box"
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          padding: '32px',
          boxShadow: '6px 6px 0px #121212'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              backgroundColor: '#121212',
              color: '#FFE853',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '22px',
              borderRadius: '12px',
              border: '2px solid #121212',
              boxShadow: '3px 3px 0px #121212',
              marginBottom: '10px'
            }}
          >
            CS
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 6px', color: '#121212' }}>
            {mode === 'login' ? 'Sign In to ClubSphere' : 'Create ClubSphere Account'}
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', margin: 0 }}>
            {mode === 'login'
              ? 'Enter your unique club email to access your isolated workspace'
              : 'Register with your unique club email for automated club assignment'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`neo-btn ${mode === 'login' ? 'neo-btn-yellow' : 'neo-btn-white'}`}
            style={{ padding: '8px', fontSize: '13px' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`neo-btn ${mode === 'register' ? 'neo-btn-yellow' : 'neo-btn-white'}`}
            style={{ padding: '8px', fontSize: '13px' }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FEE2E2',
              border: '2px solid #DC2626',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name (Sign Up only) */}
          {mode === 'register' && (
            <div>
              <label className="neo-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neil Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '38px' }}
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="neo-label">Your Role in the Club *</label>
            <div style={{ position: 'relative' }}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="neo-input neo-select"
                style={{ paddingLeft: '38px', fontWeight: 700 }}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700, margin: '4px 0 0' }}>
              Workspace views and permissions are strictly bounded by this role.
            </p>
          </div>

          {/* Email Address */}
          <div>
            <label className="neo-label">Institutional / Club Email *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="e.g. yourname@tech.campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neo-input"
                style={{ paddingLeft: '38px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>

            {/* Dynamic Auto-Detected Club Indicator */}
            {email.includes('@') && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#FAF5EE',
                  border: '1.5px solid #121212',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontWeight: 800
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} color="#121212" />
                  <span>Assigned Club Workspace:</span>
                </div>
                <span
                  style={{
                    backgroundColor: detectedClub.color,
                    color: detectedClub.isSuperAdmin ? '#FFFFFF' : '#121212',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #121212',
                    fontSize: '11px',
                    fontWeight: 900
                  }}
                >
                  {detectedClub.name}
                </span>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="neo-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neo-input"
                style={{ paddingLeft: '38px' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="neo-btn neo-btn-yellow"
            style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '6px' }}
          >
            {mode === 'login' ? 'Sign In to Portal' : 'Register & Enter Workspace'}
          </button>
        </form>

        {/* Demo Personas Quick Select */}
        <div style={{ marginTop: '24px', borderTop: '2px dashed #121212', paddingTop: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Zap size={15} />
            <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Instant Demo Login (One-Click)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
            {demoPersonas.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => handleQuickDemo(p)}
                className="neo-btn neo-btn-white"
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  textAlign: 'left',
                  borderLeft: `4px solid ${p.color}`,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <span style={{ fontWeight: 900 }}>{p.label}</span>
                <span style={{ color: 'var(--ink-muted)', fontSize: '10px' }}>{p.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
