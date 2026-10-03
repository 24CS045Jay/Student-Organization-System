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
  Globe,
  Sparkles,
  KeyRound,
  Copy,
  ArrowRight,
  Info
} from 'lucide-react';
import { dbInstance } from '../../mock/db';
import { clubService } from '../../services/clubService';

export const AuthView = ({ onAuthSuccess, onBackToLanding, onSuperAdminClick, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  
  // Form fields
  const [personalEmail, setPersonalEmail] = useState('');
  const [clubLoginEmail, setClubLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [role, setRole] = useState('student');
  const [studentRollNo, setStudentRollNo] = useState('');
  
  const [error, setError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Available registered clubs from database
  const registeredClubs = Object.values(dbInstance.data.clubs || {});

  // Available roles
  const roles = [
    { value: 'student', label: 'Student / Club Member' },
    { value: 'volunteer', label: 'Club Volunteer' },
    { value: 'event_manager', label: 'Event Manager' },
    { value: 'treasurer', label: 'Club Treasurer' },
    { value: 'admin', label: 'Club Administrator' }
  ];

  // Helper to detect club from typed club email
  const detectClubFromEmail = (emailStr) => {
    const lower = (emailStr || '').toLowerCase();
    if (registeredClubs.length === 0) return null;

    for (const club of registeredClubs) {
      if (club.emailDomain) {
        const domainClean = club.emailDomain.replace('@', '').toLowerCase();
        if (domainClean && lower.includes(domainClean)) {
          return { id: club.id, name: club.name, color: club.color || '#FFE853' };
        }
      }
      if (
        (club.id && lower.includes(club.id.toLowerCase())) ||
        (club.short && lower.includes(club.short.toLowerCase())) ||
        (club.prefix && lower.includes(club.prefix.toLowerCase()))
      ) {
        return { id: club.id, name: club.name, color: club.color || '#FFE853' };
      }
    }
    return null;
  };

  const detectedClub = detectClubFromEmail(clubLoginEmail);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!personalEmail.trim() || !personalEmail.includes('@')) {
      setError('Please enter a valid personal email address (e.g. yourname@gmail.com).');
      return;
    }

    const targetOrgId = selectedOrgId || registeredClubs[0]?.id;
    if (!targetOrgId) {
      setError('⚠️ No student clubs exist in the system yet. Please create a club first in the Super Admin Portal.');
      return;
    }

    try {
      const res = clubService.signUpUser({
        name,
        personalEmail,
        role,
        orgId: targetOrgId,
        password: password || '12345678',
        studentRollNo: studentRollNo || `24CS${Math.floor(100 + Math.random() * 900)}`
      });

      setRegistrationSuccess(res);
      setClubLoginEmail(res.assignedClubEmail);
      setPassword(res.initialPassword);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!clubLoginEmail.trim()) {
      setError('Please enter your assigned official club email.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    const res = clubService.loginUser({
      email: clubLoginEmail,
      password: password
    });

    if (!res.success) {
      setError(res.error);
      if (res.isPersonalEmail && res.assignedClubEmail) {
        setClubLoginEmail(res.assignedClubEmail);
      }
      return;
    }

    onAuthSuccess(res.session);
  };

  const handleCopyAssignedEmail = (emailToCopy) => {
    navigator.clipboard?.writeText(emailToCopy);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
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

      {/* Main Container */}
      <div
        className="neo-box"
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          padding: '36px 32px',
          boxShadow: '6px 6px 0px #121212'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              backgroundColor: '#FFE853',
              color: '#121212',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '24px',
              borderRadius: '14px',
              border: '2px solid #121212',
              boxShadow: '3px 3px 0px #121212',
              marginBottom: '12px'
            }}
          >
            CS
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 6px', color: '#121212' }}>
            {mode === 'login' ? 'Sign In to Your Club' : 'Student Club Registration'}
          </h2>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', margin: 0 }}>
            {mode === 'login'
              ? 'Enter with your assigned official club domain email.'
              : 'Sign up with personal email to receive your dedicated club login email.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        {!registrationSuccess && (
          <div
            style={{
              display: 'flex',
              backgroundColor: '#FAF5EE',
              border: '2px solid #121212',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '20px',
              gap: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className="neo-btn neo-btn-sm"
              style={{
                flex: 1,
                backgroundColor: mode === 'login' ? '#FFE853' : 'transparent',
                border: mode === 'login' ? '2px solid #121212' : 'none',
                boxShadow: mode === 'login' ? '2px 2px 0px #121212' : 'none',
                fontWeight: 900
              }}
            >
              Sign In (Official Club Email)
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className="neo-btn neo-btn-sm"
              style={{
                flex: 1,
                backgroundColor: mode === 'register' ? '#FFE853' : 'transparent',
                border: mode === 'register' ? '2px solid #121212' : 'none',
                boxShadow: mode === 'register' ? '2px 2px 0px #121212' : 'none',
                fontWeight: 900
              }}
            >
              Sign Up (Get Club Email)
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FEE2E2',
              border: '2px solid #DC2626',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* CASE 1: Registration Success Credential Modal Card */}
        {registrationSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                backgroundColor: '#F0FDF4',
                border: '2.5px solid #16A34A',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '4px 4px 0px #16A34A'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#166534' }}>
                <CheckCircle2 size={22} />
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>
                  Account Created & Official Email Generated!
                </h3>
              </div>

              <p style={{ fontSize: '13px', fontWeight: 700, color: '#14532D', marginBottom: '16px', lineHeight: 1.5 }}>
                Your personal email <strong>{registrationSuccess.user.personalEmail}</strong> has been assigned the official institutional email below.
              </p>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #121212',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Assigned Official Club Login Email:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <code style={{ fontSize: '15px', fontWeight: 900, color: '#2563EB', wordBreak: 'break-all' }}>
                      {registrationSuccess.assignedClubEmail}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyAssignedEmail(registrationSuccess.assignedClubEmail)}
                      className="neo-btn neo-btn-white neo-btn-sm"
                      style={{ padding: '4px 8px', fontSize: '11px', marginLeft: '8px' }}
                    >
                      {copiedEmail ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #D1D5DB', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>Initial Password:</span>
                  <code style={{ fontSize: '13px', fontWeight: 900, color: '#121212' }}>{registrationSuccess.initialPassword}</code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>Role / Club:</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#121212' }}>
                    {registrationSuccess.user.role.toUpperCase()} • {registrationSuccess.clubName}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '14px', fontSize: '11px', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} />
                <span>Credentials have been synced to the database and sent to your personal email!</span>
              </div>
            </div>

            <button
              onClick={() => {
                setRegistrationSuccess(null);
                setMode('login');
              }}
              className="neo-btn neo-btn-yellow"
              style={{
                padding: '14px',
                fontSize: '15px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Proceed to Sign In with Assigned Email</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : mode === 'register' ? (
          /* CASE 2: Sign Up Form (Personal Email -> Club Email Assignment) */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {registeredClubs.length === 0 && onSuperAdminClick && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#FEF9C3',
                  border: '2px solid #CA8A04',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#854D0E' }}>
                  ⚠️ No clubs exist yet in the system.
                </span>
                <button
                  type="button"
                  onClick={onSuperAdminClick}
                  className="neo-btn neo-btn-yellow neo-btn-sm"
                  style={{ whiteSpace: 'nowrap', fontSize: '11px', padding: '6px 10px' }}
                >
                  Create in Super Admin
                </button>
              </div>
            )}
            {/* Full Name */}
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

            {/* Personal Email Address */}
            <div>
              <label className="neo-label">Your Personal Email Address *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="e.g. neil.patel@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '38px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700, margin: '4px 0 0' }}>
                Our platform will assign your official club email and send the initial access pass here.
              </p>
            </div>

            {/* Select Target Club */}
            <div>
              <label className="neo-label">Select Club Organization *</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedOrgId || (registeredClubs[0]?.id || '')}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="neo-input neo-select"
                  style={{ paddingLeft: '38px', fontWeight: 700 }}
                  required
                >
                  {registeredClubs.length === 0 ? (
                    <option value="">No clubs created yet (Super Admin must create first)</option>
                  ) : (
                    registeredClubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.emailDomain || `@${c.id}.campus.edu`})
                      </option>
                    ))
                  )}
                </select>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              </div>
            </div>

            {/* Select Role */}
            <div>
              <label className="neo-label">Your Desired Role in the Club *</label>
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
            </div>

            {/* Password */}
            <div>
              <label className="neo-label">Create Initial Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="Set your password (e.g. 12345678)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="neo-btn neo-btn-yellow"
              style={{ padding: '14px', fontSize: '15px', fontWeight: 900, marginTop: '8px' }}
              disabled={registeredClubs.length === 0}
            >
              Create Account & Generate Official Club Email
            </button>
          </form>
        ) : (
          /* CASE 3: Sign In Form (Using Assigned Club Email) */
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Assigned Club Email */}
            <div>
              <label className="neo-label">Official Assigned Club Email *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="e.g. neiladmin@techgenius.com"
                  value={clubLoginEmail}
                  onChange={(e) => setClubLoginEmail(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '38px' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700, margin: '4px 0 0' }}>
                Must be the platform-assigned club email (e.g. <code>nameadmin@clubdomain.com</code>).
              </p>
            </div>

            {/* Detected Club Badge */}
            {detectedClub && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#FAF5EE',
                  border: '2px solid #121212',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: detectedClub.color,
                    border: '1.5px solid #000'
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#121212' }}>
                  Target Club Organization: <strong>{detectedClub.name}</strong>
                </span>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="neo-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '38px' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="neo-btn neo-btn-yellow"
              style={{ padding: '14px', fontSize: '15px', fontWeight: 900, marginTop: '8px' }}
            >
              Sign In to Club Workspace
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
