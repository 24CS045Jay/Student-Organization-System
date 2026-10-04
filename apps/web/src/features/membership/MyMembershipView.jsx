import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard, ProgressBar } from '../../components/ui/index';
import { DigitalMemberCard } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { Sparkles, Calendar, Award, Gift, CheckCircle2, QrCode, Tag, ArrowRight, Zap, Crown, ShieldCheck, Users, Star } from 'lucide-react';

export const MyMembershipView = ({ session, activeClub, onRenewSuccess, onNavigate }) => {
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewPlan, setRenewPlan] = useState('Premium');

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

  const isPremium = (currentMember?.type || '').toLowerCase().includes('premium') || 
                    (currentMember?.type || '').toLowerCase().includes('pro');

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

  // Standard Member Benefits: Exactly 3 Benefits
  const standardBenefits = [
    {
      id: 'std-1',
      icon: <Tag size={20} color="#059669" />,
      bg: '#DCFCE7',
      title: '15% Off Event Tickets & Hackathons',
      desc: 'Automatic 15% discount on all campus hackathons, workshops, and certified bootcamps.'
    },
    {
      id: 'std-2',
      icon: <QrCode size={20} color="#2563EB" />,
      bg: '#DBEAFE',
      title: 'Digital Fast-Track QR Access Pass',
      desc: 'Verifiable student QR card for smooth, express check-in at event entry desks.'
    },
    {
      id: 'std-3',
      icon: <Award size={20} color="#7C3AED" />,
      bg: '#EDE9FE',
      title: 'Verified Participation Certificate',
      desc: 'Officially recognized digital certificates delivered to your profile on event completion.'
    }
  ];

  // Premium Pro Member Benefits: Superior VIP Benefits (Better Benefits)
  const premiumProBenefits = [
    {
      id: 'pro-1',
      icon: <Zap size={20} color="#DC2626" />,
      bg: '#FEE2E2',
      badge: 'TOP SAVING',
      title: '40% VIP Discount on All Campus Events',
      desc: 'Highest tier 40% discount automatically deducted across all flagship hackathons and tech summits.'
    },
    {
      id: 'pro-2',
      icon: <Gift size={20} color="#D97706" />,
      bg: '#FEF3C7',
      badge: 'EXCLUSIVE',
      title: '20% Off Official Club Merchandise',
      desc: 'Exclusive 20% discount on official club hoodies, tech tees, and limited-edition stickers.'
    },
    {
      id: 'pro-3',
      icon: <Crown size={20} color="#7C3AED" />,
      bg: '#EDE9FE',
      badge: 'VIP ACCESS',
      title: 'VIP Seating & Priority Queue Skip',
      desc: 'Skip regular registration lines with dedicated VIP entry and reserved front-row auditorium seats.'
    },
    {
      id: 'pro-4',
      icon: <Sparkles size={20} color="#059669" />,
      bg: '#DCFCE7',
      badge: 'FREE GIFT',
      title: 'Free Welcome Swag & Official Merch Kit',
      desc: 'Complimentary physical welcome pack with official club lanyard, metal badge, and club swag.'
    },
    {
      id: 'pro-5',
      icon: <Users size={20} color="#2563EB" />,
      bg: '#DBEAFE',
      badge: '1-ON-1',
      title: '1-on-1 Core Executive & Speaker Mentorship',
      desc: 'Direct private networking sessions with club leads, tech founders, and industry keynote speakers.'
    },
    {
      id: 'pro-6',
      icon: <ShieldCheck size={20} color="#9333EA" />,
      bg: '#F3E8FF',
      badge: 'AUTHENTICATED',
      title: 'Gold-Tier Authenticated Digital Pass',
      desc: 'Cryptographically signed VIP member pass with purple-gold styling and lifetime alumni priority.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Banner */}
      <div
        className="neo-box"
        style={{
          background: isPremium 
            ? 'linear-gradient(135deg, #FFD6E5 0%, #FFF5F9 50%, #FFFFFF 100%)' 
            : `linear-gradient(135deg, ${activeClub?.color || '#FFE853'} 0%, #FFFDF9 100%)`,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          border: '3.5px solid #121212',
          boxShadow: isPremium ? '6px 6px 0px #7C3AED' : '6px 6px 0px #121212'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="black">Student Membership Portal</Badge>
            {isPremium ? (
              <Badge variant="purple">⭐ Premium Pro VIP Member</Badge>
            ) : (
              <Badge variant="blue">✓ Standard Member (3 Benefits)</Badge>
            )}
          </div>
          <h1 style={{ fontSize: '28px', margin: '6px 0 4px', fontWeight: 900 }}>
            Welcome, {currentMember?.name || session.name}! 👋
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            {isPremium 
              ? '⭐ You are enjoying all 6 VIP privileges including 40% off, free swag kit & executive mentorship!'
              : 'Your official pass with 3 active student benefits. Upgrade to Premium Pro anytime for 40% off & VIP access.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button 
            variant={isPremium ? 'purple' : 'pink'} 
            onClick={() => {
              setRenewPlan(isPremium ? 'Premium' : 'Premium');
              setShowRenewModal(true);
            }}
          >
            {isPremium ? '⚡ Extend VIP Plan' : '⭐ Upgrade to Premium Pro'}
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
                  { date: currentMember?.startDate || '2026-01-15', action: `Enrolled as ${currentMember?.type || 'Standard Member'}`, amt: isPremium ? 999 : 499 }
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
                    <Badge variant={h.action?.includes('Premium') || h.action?.includes('Upgraded') ? 'purple' : 'green'}>
                      Paid ₹{h.amt}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Dynamic Perks & Upgrade CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active Membership Perks Card */}
          <Card 
            title={isPremium ? "⭐ Your VIP Premium Pro Privileges" : "🎁 Your Active Membership Benefits"} 
            headerBg={isPremium ? "var(--accent-pink)" : "var(--accent-green)"}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                {isPremium ? 'CURRENT TIER: PREMIUM PRO (6 VIP PERKS)' : 'CURRENT TIER: STANDARD (3 BENEFITS)'}
              </span>
              <Badge variant={isPremium ? 'purple' : 'green'}>
                {isPremium ? '⭐ All VIP Perks Unlocked' : '✓ 3 Benefits Active'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(isPremium ? premiumProBenefits : standardBenefits).map((b) => (
                <div 
                  key={b.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    padding: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #121212',
                    borderRadius: '12px',
                    boxShadow: '2px 2px 0px #121212'
                  }}
                >
                  <div 
                    style={{ 
                      backgroundColor: b.bg, 
                      border: '2px solid #000', 
                      borderRadius: '10px', 
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {b.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0 }}>{b.title}</h4>
                      {b.badge && (
                        <Badge variant="purple" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          {b.badge}
                        </Badge>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700, margin: '3px 0 0' }}>
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upgrade Prompt Box: Only shown if member is on Standard plan */}
          {!isPremium && (
            <div
              className="neo-box"
              style={{
                background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #F3E8FF 100%)',
                border: '3px solid #121212',
                boxShadow: '5px 5px 0px #7C3AED',
                padding: '20px',
                borderRadius: '18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Badge variant="purple">⭐ Better Benefits Available</Badge>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#7C3AED' }}>₹999 / yr</span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, margin: '4px 0 6px' }}>
                Upgrade to Premium Pro for Better VIP Benefits! 🚀
              </h3>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '14px' }}>
                Standard members only have 3 benefits. Upgrade to Premium Pro to instantly unlock:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚡</span> 40% Off Tickets (vs 15%)
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🛍️</span> 20% Off Merchandise
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🌟</span> VIP Seating & Queue Skip
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📦</span> Free Merch Kit & Mentorship
                </div>
              </div>
              <Button
                variant="pink"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 900 }}
                onClick={() => {
                  setRenewPlan('Premium');
                  setShowRenewModal(true);
                }}
              >
                <Sparkles size={16} />
                Upgrade to Premium Pro Plan (₹999) ⚡
              </Button>
            </div>
          )}

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

      {/* Renewal / Upgrade Modal */}
      <Modal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title={isPremium ? "⚡ Extend VIP Premium Pro Membership" : "⚡ Upgrade or Renew Membership"}
        headerColor={renewPlan === 'Premium' ? 'var(--accent-pink)' : 'var(--accent-yellow)'}
      >
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
            Choose your membership tier. Standard has 3 essential benefits, while Premium Pro unlocks superior VIP benefits including 40% off and 1-on-1 mentorship.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {/* Standard Plan (3 benefits) */}
            <div
              onClick={() => setRenewPlan('Standard')}
              className="neo-box neo-box-interactive"
              style={{
                padding: '14px',
                cursor: 'pointer',
                borderColor: renewPlan === 'Standard' ? '#000' : '#E4E4E7',
                borderWidth: renewPlan === 'Standard' ? '3px' : '2px',
                backgroundColor: renewPlan === 'Standard' ? '#FEF9C3' : '#FFFFFF',
                boxShadow: renewPlan === 'Standard' ? '4px 4px 0px #121212' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant="blue">Standard</Badge>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)' }}>3 Benefits</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '8px 0 2px' }}>₹499 / yr</h3>
              <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)', marginBottom: '8px' }}>
                Essential campus club privileges
              </p>
              <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                  <span>15% Off Event Tickets</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                  <span>Digital QR Access Pass</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                  <span>Verified Participation Cert</span>
                </div>
              </div>
            </div>

            {/* Premium Pro Plan (Superior benefits) */}
            <div
              onClick={() => setRenewPlan('Premium')}
              className="neo-box neo-box-interactive"
              style={{
                padding: '14px',
                cursor: 'pointer',
                borderColor: renewPlan === 'Premium' ? '#7C3AED' : '#E4E4E7',
                borderWidth: renewPlan === 'Premium' ? '3.5px' : '2px',
                backgroundColor: renewPlan === 'Premium' ? '#FFD6E5' : '#FFFFFF',
                boxShadow: renewPlan === 'Premium' ? '5px 5px 0px #7C3AED' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant="pink">Premium Pro</Badge>
                <Badge variant="purple" style={{ fontSize: '9px', padding: '1px 5px' }}>RECOMMENDED</Badge>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '8px 0 2px', color: '#7C3AED' }}>₹999 / yr</h3>
              <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-muted)', marginBottom: '8px' }}>
                Superior VIP Privileges (6 Benefits)
              </p>
              <div style={{ fontSize: '11px', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#7C3AED', fontWeight: 900 }}>⭐</span>
                  <span><strong>40% VIP Discount</strong> on Tickets</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#7C3AED', fontWeight: 900 }}>⭐</span>
                  <span><strong>20% Merch Discount</strong> Auto-Applied</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#7C3AED', fontWeight: 900 }}>⭐</span>
                  <span><strong>VIP Front-Row Seating</strong> & Fast-Pass</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#7C3AED', fontWeight: 900 }}>⭐</span>
                  <span><strong>Free Welcome Swag</strong> & Merch Pack</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#7C3AED', fontWeight: 900 }}>⭐</span>
                  <span><strong>1-on-1 Speaker & Lead</strong> Mentorship</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#7C3AED', fontWeight: 900 }}>⭐</span>
                  <span><strong>Gold Authenticated</strong> Digital Pass</span>
                </div>
              </div>
            </div>
          </div>

          <Button 
            variant={renewPlan === 'Premium' ? 'pink' : 'yellow'} 
            style={{ width: '100%', fontSize: '14px', fontWeight: 900, padding: '12px' }} 
            onClick={handleRenew}
          >
            {renewPlan === 'Premium' 
              ? (isPremium ? '⚡ Confirm VIP Renewal (₹999 / yr)' : '⚡ Confirm Upgrade to Premium Pro (₹999 / yr)')
              : 'Confirm Standard Membership (₹499 / yr)'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
