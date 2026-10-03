import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertCircle, KeyRound, ShieldCheck, X } from 'lucide-react';
import { clubService } from '../../services/clubService';

export const PasswordUpdateModal = ({ isOpen, onClose, session, onToast }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !session) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      clubService.updateUserPassword(session.email, currentPassword, newPassword);
      if (onToast) onToast('✅ Password updated successfully! Your account is now secured.');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="neo-box"
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          padding: '28px',
          boxShadow: '8px 8px 0px #121212',
          position: 'relative',
          animation: 'scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: '2px solid #121212',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: '#FAF5EE'
          }}
          title="Close (Skip for now)"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: '#FFE853',
              border: '2px solid #121212',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0px #121212'
            }}
          >
            <KeyRound size={20} color="#121212" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
              Update Initial Password
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>
              First-time login security setup
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            backgroundColor: '#FEF9C3',
            border: '1.5px solid #CA8A04',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#854D0E',
            marginBottom: '18px',
            lineHeight: 1.4
          }}
        >
          👋 Welcome, <strong>{session.name}</strong>! Please change your initial/dummy password to your own secure personal password.
        </div>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#FEE2E2',
              border: '2px solid #DC2626',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Current / Temporary Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="Enter current password (e.g. 12345678)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="neo-input"
                style={{ paddingLeft: '36px' }}
                autoFocus
              />
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          <div>
            <label className="neo-label">New Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="Create new secure password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="neo-input"
                style={{ paddingLeft: '36px' }}
              />
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          <div>
            <label className="neo-label">Confirm New Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="neo-input"
                style={{ paddingLeft: '36px' }}
              />
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="neo-btn neo-btn-white"
              style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 800 }}
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="neo-btn neo-btn-yellow"
              style={{ flex: 2, padding: '10px', fontSize: '13px', fontWeight: 900 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
