import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Shield,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  DollarSign,
  Users,
  Calendar,
  Layers,
  Palette,
  Briefcase,
  Globe,
  Tag,
  FileText,
  AlertTriangle,
  Lock,
  KeyRound,
  LogOut,
  Sparkles
} from 'lucide-react';
import { clubService } from '../../services/clubService';
import { dbInstance, inr } from '../../mock/db';

export const SuperAdminClubCreationView = ({ onBack, onClubCreated }) => {
  // Super Admin Password Protection (Master Password: 12345678)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('cs_superadmin_auth') === '1';
  });
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState(null);

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'manage' | 'users'
  const [selectedClubForDetails, setSelectedClubForDetails] = useState(null);
  const [clubsList, setClubsList] = useState(() => Object.values(dbInstance.data.clubs || {}));
  const [usersList, setUsersList] = useState(() => dbInstance.getAllUsers());

  const [formData, setFormData] = useState({
    name: '',
    short: '',
    prefix: '',
    category: 'Technical & Engineering',
    department: 'Department of Computer Science & Engineering',
    facultyAdvisor: 'Dr. R. K. Sharma',
    emailDomain: '',
    contactEmail: '',
    color: '#FFE853',
    tagline: '',
    description: '',
    tags: 'Innovation, Technology, Workshops',
    membershipFee: 500,
    initialGrant: 25000,
    adminName: 'Club President',
    adminEmail: ''
  });

  const [createdSuccess, setCreatedSuccess] = useState(null);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setAuthError(null);

    if (inputPassword === '12345678') {
      setIsAuthenticated(true);
      localStorage.setItem('cs_superadmin_auth', '1');
      setInputPassword('');
    } else {
      setAuthError('❌ Incorrect Super Admin password. Access denied.');
    }
  };

  const handleSuperAdminLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cs_superadmin_auth');
  };

  const handleDomainAutoFill = (val) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      short: prev.short || slug,
      prefix: prev.prefix || slug.substring(0, 3).toUpperCase(),
      emailDomain: prev.emailDomain || `@${slug}.campus.edu`,
      adminEmail: prev.adminEmail || `admin@${slug}.campus.edu`,
      contactEmail: prev.contactEmail || `info@${slug}.campus.edu`
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.emailDomain) {
      alert('Please fill in the Club Organization Name and Email Domain.');
      return;
    }

    const domain = formData.emailDomain.startsWith('@') ? formData.emailDomain.toLowerCase() : `@${formData.emailDomain.toLowerCase()}`;
    const clubId = (formData.short || formData.name.split(' ')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefix = (formData.prefix || clubId.substring(0, 3)).toUpperCase();

    const newClub = clubService.createClubOrganization({
      id: clubId,
      name: formData.name,
      short: formData.short || formData.name.split(' ')[0],
      prefix: prefix,
      category: formData.category,
      department: formData.department,
      facultyAdvisor: formData.facultyAdvisor,
      emailDomain: domain,
      contactEmail: formData.contactEmail || `info${domain}`,
      color: formData.color,
      tagline: formData.tagline || `Official ${formData.name} Student Organization`,
      description: formData.description || `Fostering student innovation, events, and projects in ${formData.category}.`,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : ['Campus', 'Club'],
      membershipFee: Number(formData.membershipFee) || 500,
      initialGrant: Number(formData.initialGrant) || 10000,
      adminName: formData.adminName || 'Club President',
      adminEmail: formData.adminEmail || `admin${domain}`
    }, { email: 'super_admin@clubsphere.demo', role: 'super_admin' });

    setCreatedSuccess(newClub);
    setClubsList(Object.values(dbInstance.data.clubs || {}));

    if (onClubCreated) {
      onClubCreated(newClub);
    }
  };

  const handleDeleteClub = (clubId, clubName) => {
    const confirmDelete = window.confirm(`⚠️ Are you sure you want to PERMANENTLY delete "${clubName}"?\n\nThis will remove all associated members, events, financial ledgers, and prevent further logins with its email domain.`);
    if (!confirmDelete) return;

    clubService.deleteClubOrganization(clubId, { email: 'super_admin@clubsphere.demo', role: 'super_admin' });
    setClubsList(Object.values(dbInstance.data.clubs || {}));
    if (selectedClubForDetails?.id === clubId) {
      setSelectedClubForDetails(null);
    }
    alert(`🗑️ Organization "${clubName}" deleted successfully.`);
  };

  // If Not Authenticated: Render Password Challenge Gate
  if (!isAuthenticated) {
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
        <button
          onClick={onBack}
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

        <div
          className="neo-box"
          style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            padding: '36px',
            boxShadow: '6px 6px 0px #121212',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              backgroundColor: '#121212',
              color: '#FFE853',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              borderRadius: '14px',
              border: '2px solid #121212',
              boxShadow: '3px 3px 0px #121212',
              marginBottom: '16px'
            }}
          >
            <KeyRound size={26} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px', color: '#121212' }}>
            Super Admin Security Gate
          </h2>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '24px' }}>
            This section is strictly restricted to platform administrators. Enter the master password to continue.
          </p>

          {authError && (
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
                marginBottom: '18px',
                textAlign: 'left'
              }}
            >
              <AlertTriangle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="neo-label" style={{ textAlign: 'left' }}>Master Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="Enter Super Admin Password..."
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '38px', fontSize: '15px' }}
                  autoFocus
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              </div>
            </div>

            <button
              type="submit"
              className="neo-btn neo-btn-yellow"
              style={{ padding: '12px', fontSize: '15px', fontWeight: 900 }}
            >
              Unlock Super Admin Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated Super Admin Console
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFDF7', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          height: '70px',
          backgroundColor: '#121212',
          color: '#FFFFFF',
          borderBottom: '3px solid #121212',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            className="neo-btn neo-btn-white neo-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Portal</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#FFE853',
                color: '#121212',
                fontWeight: 900,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}
            >
              👑
            </div>
            <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
              Super Admin Central Club Registry & Manager
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('create')}
            className={`neo-btn neo-btn-sm ${activeTab === 'create' ? 'neo-btn-yellow' : 'neo-btn-white'}`}
          >
            + Onboard New Club
          </button>
          <button
            onClick={() => { setActiveTab('manage'); setClubsList(Object.values(dbInstance.data.clubs || {})); }}
            className={`neo-btn neo-btn-sm ${activeTab === 'manage' ? 'neo-btn-yellow' : 'neo-btn-white'}`}
          >
            Manage Existing Clubs ({clubsList.length})
          </button>
          <button
            onClick={() => { setActiveTab('users'); setUsersList(dbInstance.getAllUsers()); }}
            className={`neo-btn neo-btn-sm ${activeTab === 'users' ? 'neo-btn-yellow' : 'neo-btn-white'}`}
          >
            👥 User Accounts & Assigned Emails ({usersList.length})
          </button>
          <button
            onClick={handleSuperAdminLogout}
            className="neo-btn neo-btn-sm"
            style={{ backgroundColor: '#FEE2E2', borderColor: '#DC2626', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Lock Super Admin Gate"
          >
            <LogOut size={13} />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1360px', margin: '32px auto', width: '100%', padding: '0 24px', flex: 1 }}>
        {/* Success Banner */}
        {createdSuccess && (
          <div
            className="neo-box"
            style={{
              backgroundColor: '#D1FAE5',
              border: '3px solid #065F46',
              padding: '20px 24px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#065F46', margin: '0 0 4px' }}>
                🎉 Successfully Registered "{createdSuccess.name}"!
              </h3>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#047857', margin: 0 }}>
                Unique Domain <strong>{createdSuccess.emailDomain}</strong> is active. Students & officers can now register and will be automatically routed to this club's isolated workspace.
              </p>
            </div>
            <button
              onClick={() => setCreatedSuccess(null)}
              className="neo-btn neo-btn-sm neo-btn-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Create New Club Form */}
        {activeTab === 'create' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '28px', alignItems: 'start' }}>
            {/* Left: Complete Club Creation Form */}
            <div
              className="neo-box"
              style={{
                backgroundColor: '#FFFFFF',
                padding: '32px',
                boxShadow: '6px 6px 0px #121212'
              }}
            >
              <div style={{ marginBottom: '24px', borderBottom: '2.5px solid #121212', paddingBottom: '16px' }}>
                <span className="neo-badge neo-badge-yellow">Step-by-Step Onboarding</span>
                <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '8px 0 4px', color: '#121212' }}>
                  Register New Student Organization
                </h2>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', margin: 0 }}>
                  Configure organizational parameters, unique domain routing, initial treasury allocation, and leadership credentials.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Section 1: Basic Organization Info */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: '#2563EB', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={16} />
                    <span>1. Organization Identity</span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="neo-label">Club Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Robotics & Autonomous Systems Society"
                        value={formData.name}
                        onChange={(e) => handleDomainAutoFill(e.target.value)}
                        className="neo-input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="neo-label">Short Slug (ID) *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. robotics"
                          value={formData.short}
                          onChange={(e) => setFormData({ ...formData, short: e.target.value })}
                          className="neo-input"
                        />
                      </div>
                      <div>
                        <label className="neo-label">ID Prefix (3-4 chars) *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. ROB"
                          value={formData.prefix}
                          onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                          className="neo-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="neo-label">Club Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="neo-input neo-select"
                          style={{ fontWeight: 700 }}
                        >
                          <option value="Technical & Engineering">Technical & Engineering</option>
                          <option value="Cultural, Arts & Music">Cultural, Arts & Music</option>
                          <option value="Sports & Athletics">Sports & Athletics</option>
                          <option value="Literature & Debating">Literature & Debating</option>
                          <option value="Social Impact & Volunteering">Social Impact & Volunteering</option>
                          <option value="Entrepreneurship & E-Cell">Entrepreneurship & E-Cell</option>
                        </select>
                      </div>
                      <div>
                        <label className="neo-label">Faculty Advisor / Mentor</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. A. K. Verma"
                          value={formData.facultyAdvisor}
                          onChange={(e) => setFormData({ ...formData, facultyAdvisor: e.target.value })}
                          className="neo-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Dedicated Email Domain & Security Routing */}
                <div style={{ borderTop: '2px dashed #E2E8F0', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: '#059669', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={16} />
                    <span>2. Dedicated Email Domain & Auto-Routing</span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="neo-label">Unique Club Email Domain *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          required
                          placeholder="e.g. @robotics.campus.edu"
                          value={formData.emailDomain}
                          onChange={(e) => setFormData({ ...formData, emailDomain: e.target.value })}
                          className="neo-input"
                          style={{ paddingLeft: '38px', fontWeight: 800, color: '#059669' }}
                        />
                        <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#059669' }} />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700, margin: '4px 0 0' }}>
                        🔑 Centralized Routing: Any student registering with an email under this domain will automatically land in this club workspace with zero cross-tenant leakage.
                      </p>
                    </div>

                    <div>
                      <label className="neo-label">Club Official Contact Email</label>
                      <input
                        type="email"
                        placeholder="e.g. contact@robotics.campus.edu"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="neo-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Branding & Presentation */}
                <div style={{ borderTop: '2px dashed #E2E8F0', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: '#D946EF', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Palette size={16} />
                    <span>3. Branding & Theme Presentation</span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="neo-label">Short Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Building next-gen autonomous drones and robotics"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        className="neo-input"
                      />
                    </div>

                    <div>
                      <label className="neo-label">Full Organization Description</label>
                      <textarea
                        rows={3}
                        placeholder="Detailed overview of what the club does, annual activities, and workshops..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="neo-input"
                      />
                    </div>

                    <div>
                      <label className="neo-label">Theme Color Accent</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {['#FFE853', '#FF70A6', '#70D6FF', '#6BCB77', '#D946EF', '#FFD93D', '#0284C7'].map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: col })}
                            style={{
                              width: '36px',
                              height: '36px',
                              backgroundColor: col,
                              border: formData.color === col ? '3.5px solid #121212' : '1.5px solid #CBD5E1',
                              borderRadius: '10px',
                              boxShadow: formData.color === col ? '2px 2px 0px #121212' : 'none',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Treasury & Leadership Setup */}
                <div style={{ borderTop: '2px dashed #E2E8F0', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: '#F59E0B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} />
                    <span>4. Initial Treasury & Administrator Account</span>
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label className="neo-label">Annual Member Dues (₹)</label>
                      <input
                        type="number"
                        placeholder="500"
                        value={formData.membershipFee}
                        onChange={(e) => setFormData({ ...formData, membershipFee: e.target.value })}
                        className="neo-input"
                      />
                    </div>
                    <div>
                      <label className="neo-label">Initial Seed Grant (₹)</label>
                      <input
                        type="number"
                        placeholder="25000"
                        value={formData.initialGrant}
                        onChange={(e) => setFormData({ ...formData, initialGrant: e.target.value })}
                        className="neo-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label className="neo-label">Initial Admin Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Neil Patel (President)"
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        className="neo-input"
                      />
                    </div>
                    <div>
                      <label className="neo-label">Initial Admin Email</label>
                      <input
                        type="email"
                        placeholder="e.g. president@robotics.campus.edu"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        className="neo-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="neo-btn neo-btn-yellow neo-btn-lg"
                  style={{ width: '100%', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={18} />
                  <span>Save, Register & Launch Organization</span>
                </button>
              </form>
            </div>

            {/* Right: Live Registered Clubs Directory with Quick Delete */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                className="neo-box"
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0 }}>
                    Active Registered Clubs ({clubsList.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className="neo-btn neo-btn-white neo-btn-sm"
                  >
                    View Details
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {clubsList.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '14px',
                        backgroundColor: '#FAF5EE',
                        border: '2px solid #121212',
                        borderRadius: '12px',
                        borderLeft: `6px solid ${c.color || '#FFE853'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 900, margin: 0 }}>{c.name}</h4>
                          <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>Prefix: {c.prefix}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteClub(c.id, c.name)}
                          className="neo-btn neo-btn-sm"
                          style={{ backgroundColor: '#FEE2E2', borderColor: '#DC2626', color: '#DC2626', padding: '4px 8px' }}
                          title="Delete Club"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#059669', marginBottom: '6px' }}>
                        <Mail size={13} />
                        <span>{c.emailDomain || `@${c.id}.campus.edu`}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                        <span>👥 {c.members?.length || 1} Members</span>
                        <span>💰 {inr(c.finance?.netBalance || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manage Existing Clubs Detailed View */}
        {activeTab === 'manage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px' }}>
                  Super Admin Club Directory & Tenant Inspection
                </h2>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', margin: 0 }}>
                  Inspect all club metrics, finances, members roster, and delete obsolete organizations.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('create')}
                className="neo-btn neo-btn-yellow neo-btn-sm"
              >
                + Register Another Club
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {clubsList.map((club) => {
                const domain = club.emailDomain || `@${club.id}.campus.edu`;
                return (
                  <div
                    key={club.id}
                    className="neo-box"
                    style={{
                      backgroundColor: '#FFFFFF',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderTop: `8px solid ${club.color || '#FFE853'}`
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <span className="neo-badge neo-badge-yellow" style={{ marginBottom: '6px' }}>
                            {club.category || 'Organization'}
                          </span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 2px' }}>{club.name}</h3>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                            Tenant ID: <code>{club.id}</code> • Prefix: <code>{club.prefix}</code>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteClub(club.id, club.name)}
                          className="neo-btn"
                          style={{ backgroundColor: '#FEE2E2', borderColor: '#DC2626', color: '#DC2626', padding: '6px 10px', fontSize: '12px', fontWeight: 900 }}
                          title="Delete Organization"
                        >
                          <Trash2 size={14} />
                          <span style={{ marginLeft: '4px' }}>Delete</span>
                        </button>
                      </div>

                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
                        {club.description || club.tagline || 'Active student organization.'}
                      </p>

                      {/* Unique Domain Box */}
                      <div style={{ padding: '10px 14px', backgroundColor: '#FEF3C7', border: '1.5px solid #121212', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#92400E' }}>Unique Email Domain</span>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#1E40AF' }}>{domain}</span>
                      </div>

                      {/* Metrics Breakdown Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', fontWeight: 800, marginBottom: '16px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#FAF5EE', border: '1.5px solid #121212', borderRadius: '8px' }}>
                          <span style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Active Members</span>
                          <span style={{ fontSize: '16px', fontWeight: 900 }}>{club.members?.length || 1} Students</span>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#FAF5EE', border: '1.5px solid #121212', borderRadius: '8px' }}>
                          <span style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Total Events</span>
                          <span style={{ fontSize: '16px', fontWeight: 900 }}>{club.events?.length || 0} Scheduled</span>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#FAF5EE', border: '1.5px solid #121212', borderRadius: '8px' }}>
                          <span style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Liquid Balance</span>
                          <span style={{ fontSize: '16px', fontWeight: 900, color: '#059669' }}>{inr(club.finance?.netBalance || 0)}</span>
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#FAF5EE', border: '1.5px solid #121212', borderRadius: '8px' }}>
                          <span style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Budget Burn</span>
                          <span style={{ fontSize: '16px', fontWeight: 900, color: '#DC2626' }}>{inr(club.finance?.totalExpenses || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '2px dashed #121212', paddingTop: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Faculty: {club.facultyAdvisor || 'Campus Dean'}</span>
                      <span>Admin: {club.adminEmail || `admin${domain}`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ALL USERS & GENERATED EMAILS REGISTRY */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0 }}>
                  Centralized User Accounts & Assigned Emails ({usersList.length})
                </h2>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                  Complete registry of student personal emails mapped to platform-assigned official club login emails.
                </p>
              </div>
              <button
                onClick={() => setUsersList(dbInstance.getAllUsers())}
                className="neo-btn neo-btn-white neo-btn-sm"
              >
                Refresh List
              </button>
            </div>

            {usersList.length === 0 ? (
              <div className="neo-box" style={{ backgroundColor: '#FFFFFF', padding: '48px', textAlign: 'center' }}>
                <h3 style={{ margin: 0 }}>No users registered yet.</h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '8px' }}>
                  When students sign up on the portal or when new clubs are onboarded, accounts appear here.
                </p>
              </div>
            ) : (
              <div className="neo-box" style={{ backgroundColor: '#FFFFFF', padding: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2.5px solid #121212', backgroundColor: '#FAF5EE' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 900 }}>User Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: 900 }}>Personal Signup Email</th>
                      <th style={{ padding: '12px 14px', fontWeight: 900 }}>Assigned Official Club Email</th>
                      <th style={{ padding: '12px 14px', fontWeight: 900 }}>Role</th>
                      <th style={{ padding: '12px 14px', fontWeight: 900 }}>Club Organization</th>
                      <th style={{ padding: '12px 14px', fontWeight: 900 }}>Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id || u.clubEmail} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800 }}>{u.name}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--ink-muted)', fontWeight: 700 }}>{u.personalEmail}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <code style={{ color: '#2563EB', fontWeight: 900, fontSize: '13px', backgroundColor: '#EFF6FF', padding: '3px 6px', borderRadius: '4px' }}>
                            {u.clubEmail}
                          </code>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="neo-badge neo-badge-yellow" style={{ fontSize: '10px' }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{u.clubName || u.orgId}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <code style={{ fontWeight: 800 }}>{u.password}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
