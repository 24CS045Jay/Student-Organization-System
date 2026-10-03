import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard, ProgressBar } from '../../components/ui/index';
import { DigitalMemberCard } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { Sparkles, Calendar, Award, Gift, CheckCircle2, QrCode, Tag, ArrowRight } from 'lucide-react';

export const MyMembershipView = ({ session, activeClub, onRenewSuccess, onNavigate }) => {
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewPlan, setRenewPlan] = useState('Standard');

  // Find member record matching current session user
  const members = clubService.getMembers(activeClub?.id) || [];
  const currentMember = members.find(
    m => m.email?.toLowerCase() === session?.email?.toLowerCase() || 
         m.personalEmail?.toLowerCase() === session?.email?.toLowerCase()
  ) || members[0] || {
    id: `${activeClub?.prefix || 'CLB'}-001`,
    name: session?.name || 'Club Member',
    studentId: '24CS001',
    dept: activeClub?.department || 'Student Affairs',
    type: 'Standard Member',
    exp: '2027-10-01',
    startDate: '2026-01-01',
    paid: 1,
    attendanceCount: 0,
    photo: '🧑‍🎓'
  };

  const membershipTypes = clubService.getMembershipTypes(activeClub?.id) || [];
  const clubEvents = clubService.getEvents(activeClub?.id) || [];
  const publishedClubEvents = clubEvents.filter(e => (e.status || '').toLowerCase() === 'published');
  const allCampusEvents = clubService.getAllEvents ? clubService.getAllEvents().filter(e => (e.status || '').toLowerCase() === 'published') : [];
  const recommendedEvent = publishedClubEvents[0] || allCampusEvents[0];

  const handleRenew = () => {
    try {
      clubService.renewMember(activeClub.id, currentMember.id, 12, session, renewPlan);
      setShowRenewModal(false);
      if (onRenewSuccess) onRenewSuccess();
    } catch (e) {
      alert(e.message);
    }
  };

  // Get active membership details dynamically
  const activeMembershipType = membershipTypes.find(t => t.name === currentMember.type) || membershipTypes[0] || { ticketDiscount: 10, merchDiscount: 5, perks: ['Basic access'] };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Banner */}
      <div
        className="neo-box"
        style={{
          background: `linear-gradient(135deg, ${activeClub?.color || '#FFE853'} 0%, #FFFDF9 100%)`,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <Badge variant="black">Student Membership Portal</Badge>
          <h1 style={{ fontSize: '28px', margin: '8px 0 4px', fontWeight: 900 }}>
            Welcome, {currentMember?.name || session.name}! 👋
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Your official pass for event discounts, priority registration, and club merchandise perks.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="yellow" onClick={() => setShowRenewModal(true)}>
            ⚡ Renew / Upgrade Tier
          </Button>
          <Button variant="black" onClick={() => onNavigate && onNavigate('browse-events')}>
            Browse Events
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Digital Pass */}
        <div>
          <DigitalMemberCard
            member={currentMember}
            clubName={activeClub?.name || 'Club'}
            accentColor={activeClub?.color || 'var(--accent-yellow)'}
            onRenew={() => setShowRenewModal(true)}
          />

          {/* Membership Timeline / History */}
          <div style={{ marginTop: '24px' }}>
            <Card title="📜 Membership History Timeline" headerBg="var(--accent-purple)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(currentMember?.history || [
                  { date: currentMember?.startDate || '2026-01-15', action: `Enrolled as ${currentMember?.type || 'Standard Member'}`, amt: 499 }
                ]).map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FAF5EE',
                      border: '2px solid #121212',
                      borderRadius: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '13px' }}>{h.action}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>{h.date}</div>
                    </div>
                    <Badge variant="green">Paid ₹{h.amt}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Perks & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Benefits Card */}
          <Card title="🎁 Your Active Membership Perks" headerBg="var(--accent-green)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#DCFCE7', border: '2px solid #000', borderRadius: '10px', padding: '8px' }}>
                  <Tag size={20} color="#059669" />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900 }}>Discounted Event Tickets</h4>
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                    Enjoy up to {activeMembershipType.ticketDiscount || 15}% discount on all hackathon and workshop ticket passes.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#FEF9C3', border: '2px solid #000', borderRadius: '10px', padding: '8px' }}>
                  <Gift size={20} color="#B45309" />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900 }}>Merchandise Store Discount</h4>
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                    Exclusive {activeMembershipType.merchDiscount || 10}% member coupon auto-applied on hoodies and club gear.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: '#E0E7FF', border: '2px solid #000', borderRadius: '10px', padding: '8px' }}>
                  <Award size={20} color="#3730A3" />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900 }}>Exclusive Benefits</h4>
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                    {activeMembershipType.perks?.join(' • ') || 'Digital Verified Certificates and exclusive club access.'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Event Recommendation Widget */}
          <Card title="✨ AI Recommended Next Event" headerBg="var(--accent-yellow)">
            <div>
              <Badge variant="purple" style={{ marginBottom: '8px' }}>
                Recommended for You
              </Badge>
              <h3 style={{ fontSize: '16px', fontWeight: 900 }}>{recommendedEvent?.title || 'Annual Flagship Hackathon & Workshop'}</h3>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', margin: '4px 0 12px' }}>
                {recommendedEvent?.description?.substring(0, 100) || 'Connect with campus peers, build real projects, and earn exclusive club certificates!'}...
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: '15px' }}>
                  Member Price: <span style={{ color: '#059669' }}>{recommendedEvent ? `₹${recommendedEvent.memberPrice || 0}` : '₹150'}</span>
                </span>
                <Button variant="pink" size="sm" onClick={() => onNavigate && onNavigate('browse-events')}>
                  Get Ticket
                </Button>
              </div>
            </div>
          </Card>

          {/* Upcoming Published Events List */}
          {publishedClubEvents.length > 0 && (
            <Card title={`📅 Upcoming ${activeClub?.short || activeClub?.name} Events (${publishedClubEvents.length})`} headerBg="var(--accent-blue)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {publishedClubEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #000',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '13px' }}>{ev.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                        {ev.date} • {ev.location} • ₹{ev.memberPrice}
                      </div>
                    </div>
                    <Button variant="yellow" size="sm" onClick={() => onNavigate && onNavigate('browse-events')}>
                      Book Pass
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Renewal Modal */}
      <Modal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title="⚡ Renew or Upgrade Club Membership"
        headerColor="var(--accent-yellow)"
      >
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
            Extends your active validity by 12 months with full access to perks, hackathons, and certified sessions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div
              onClick={() => setRenewPlan('Standard')}
              className="neo-box neo-box-interactive"
              style={{
                padding: '14px',
                borderColor: renewPlan === 'Standard' ? '#000' : '#E4E4E7',
                backgroundColor: renewPlan === 'Standard' ? '#FEF9C3' : '#FFFFFF'
              }}
            >
              <Badge variant="blue">Standard</Badge>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '8px 0 4px' }}>₹499 / yr</h3>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                15% Ticket discount, basic Discord perks.
              </p>
            </div>

            <div
              onClick={() => setRenewPlan('Premium')}
              className="neo-box neo-box-interactive"
              style={{
                padding: '14px',
                borderColor: renewPlan === 'Premium' ? '#000' : '#E4E4E7',
                backgroundColor: renewPlan === 'Premium' ? '#FFD6E5' : '#FFFFFF'
              }}
            >
              <Badge variant="pink">Premium Pro</Badge>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '8px 0 4px' }}>₹999 / yr</h3>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                40% Ticket discount, Free Swag Pack, Fast-pass.
              </p>
            </div>
          </div>

          <Button variant="yellow" style={{ width: '100%' }} onClick={handleRenew}>
            Confirm Payment & Renew ({renewPlan} Plan)
          </Button>
        </div>
      </Modal>
    </div>
  );
};
