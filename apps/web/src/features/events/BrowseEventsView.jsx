import React, { useState } from 'react';
import { Card, Button, Badge, Modal, ProgressBar } from '../../components/ui/index';
import { DigitalEventTicket } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { openRazorpayCheckout } from '../../services/paymentService';
import { Calendar, MapPin, Ticket, Sparkles, AlertCircle, Search, Building2, CheckCircle2, CalendarPlus, Download, Share2 } from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsCalendarFile, getWhatsAppShareUrl } from '../../services/calendarService';

export const BrowseEventsView = ({ session, activeClub, onToast, onNavigate }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [isMemberDiscount, setIsMemberDiscount] = useState(session.role === 'student' || session.role === 'member' || session.role === 'admin');
  const [purchasedTicket, setPurchasedTicket] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClubFilter, setSelectedClubFilter] = useState('all');

  const registeredClubs = clubService.getAllClubsList ? clubService.getAllClubsList() : [];

  // Retrieve events based on club filter
  const rawEvents = (() => {
    if (selectedClubFilter === 'all') {
      return clubService.getAllEvents();
    }
    const evs = clubService.getEvents(selectedClubFilter);
    const targetClub = registeredClubs.find(c => c.id === selectedClubFilter);
    return evs.map(e => ({
      ...e,
      clubId: selectedClubFilter,
      clubName: targetClub?.name || activeClub.name,
      clubPrefix: targetClub?.prefix || activeClub.prefix,
      clubColor: targetClub?.color || activeClub.color
    }));
  })();

  // Filter for members / students: show published/active events
  const isStudentOrMember = session.role === 'student' || session.role === 'member';
  const publishedEvents = rawEvents.filter(e => {
    const st = (e.status || '').toLowerCase().trim();
    const isPublic = st === 'published' || st === 'active';
    if (isStudentOrMember && !isPublic) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (e.title || '').toLowerCase().includes(q);
      const matchCategory = (e.category || '').toLowerCase().includes(q);
      const matchLocation = (e.location || '').toLowerCase().includes(q);
      const matchDesc = (e.description || '').toLowerCase().includes(q);
      return matchTitle || matchCategory || matchLocation || matchDesc;
    }
    return true;
  });

  const handleOpenBuy = (event) => {
    setSelectedEvent(event);
    setIsBuyModalOpen(true);
    setPurchasedTicket(null);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedEvent) return;

    const targetClubId = selectedEvent.clubId || activeClub.id;
    const targetPrefix = selectedEvent.clubPrefix || activeClub.prefix || 'CLB';
    const price = isMemberDiscount ? selectedEvent.memberPrice : selectedEvent.nonMemberPrice;
    setIsProcessing(true);

    try {
      await openRazorpayCheckout({
        amount: price,
        title: selectedEvent.title,
        description: `Pass for ${selectedEvent.category} (${isMemberDiscount ? 'Member Discount' : 'Standard'})`,
        prefillName: session.name || 'Student Member',
        prefillEmail: session.email || 'student@campus.edu',
        onSuccess: (paymentResult) => {
          const membersList = clubService.getMembers(targetClubId) || [];
          const currentMember = membersList.find(m => m.email?.toLowerCase() === session?.email?.toLowerCase());
          const resolvedMemberId = currentMember?.id || session?.memberId || session?.studentId || (isMemberDiscount ? `${targetPrefix}-001` : null);

          const ticket = clubService.buyTicket(
            targetClubId,
            selectedEvent.id,
            {
              name: session.name || 'Student Member',
              email: session.email || 'student@campus.edu',
              isMember: isMemberDiscount,
              memberId: resolvedMemberId
            },
            session,
            paymentResult
          );

          setPurchasedTicket(ticket);
          setIsBuyModalOpen(false);
          setIsProcessing(false);
          if (onToast) onToast(`🎉 Ticket confirmed! Ref: ${paymentResult.paymentId}`);
        },
        onDismiss: () => {
          setIsProcessing(false);
        }
      });
    } catch (err) {
      setIsProcessing(false);
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Banner */}
      <div
        className="neo-box"
        style={{
          background: 'linear-gradient(135deg, #FFD24C 0%, #FF70A6 100%)',
          padding: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <Badge variant="black">FR-04 Campus Events Hub</Badge>
          <h1 style={{ fontSize: '30px', fontWeight: 900, margin: '8px 0 4px', color: '#121212' }}>
            Explore Campus & Club Events
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(0,0,0,0.8)' }}>
            Hackathons, technical bootcamps, and cultural festivals. Real-time seats meter & instant digital passes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="black" onClick={() => onNavigate && onNavigate('my-tickets')} icon={Ticket}>
            View My Passes
          </Button>
        </div>
      </div>

      {/* Campus Club Switcher & Search Bar */}
      <div className="neo-box" style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Filter By Club:
            </span>
            <button
              onClick={() => setSelectedClubFilter('all')}
              className={`neo-btn ${selectedClubFilter === 'all' ? 'neo-btn-black' : 'neo-btn-white'} neo-btn-sm`}
            >
              🌐 All Campus Events ({clubService.getAllEvents().filter(e => (e.status || '').toLowerCase() === 'published' || !isStudentOrMember).length})
            </button>
            {registeredClubs.map(c => {
              const count = clubService.getEvents(c.id).filter(e => (e.status || '').toLowerCase() === 'published' || !isStudentOrMember).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClubFilter(c.id)}
                  className={`neo-btn ${selectedClubFilter === c.id ? 'neo-btn-yellow' : 'neo-btn-white'} neo-btn-sm`}
                  style={{ borderLeft: `5px solid ${c.color || '#FFE853'}` }}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search events, workshops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--ink-muted)' }} />
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {publishedEvents.length === 0 ? (
        <Card title="No Events Found" headerBg="var(--accent-yellow)">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>
              No published events found {selectedClubFilter !== 'all' ? `for ${registeredClubs.find(c => c.id === selectedClubFilter)?.name || activeClub.name}` : 'right now'}
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
              Try switching to "All Campus Events" or check back soon as event managers publish new workshops and hackathons.
            </p>
            {selectedClubFilter !== 'all' && (
              <Button variant="black" onClick={() => setSelectedClubFilter('all')}>
                View All Campus Events
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {publishedEvents.map((event) => {
            const isSoldOut = event.sold >= event.capacity;
            const seatsLeft = Math.max(0, event.capacity - event.sold);
            const percentFull = Math.round((event.sold / event.capacity) * 100);

            return (
              <div
                key={event.id}
                className="neo-box"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  borderRadius: '24px'
                }}
              >
                <div>
                  {/* Event Card Header Banner */}
                  <div
                    style={{
                      background: event.bannerGradient || 'var(--accent-yellow)',
                      padding: '16px 20px',
                      borderBottom: '3px solid #121212',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <Badge variant={isSoldOut ? 'black' : 'green'}>
                      {isSoldOut ? '⛔ SOLD OUT' : `✓ ${seatsLeft} SEATS LEFT`}
                    </Badge>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ backgroundColor: '#FFFFFF', border: '2px solid #000', borderRadius: '8px', padding: '3px 8px', fontSize: '11px', fontWeight: 900 }}>
                        {event.clubName || activeClub.name}
                      </span>
                      <span style={{ backgroundColor: '#FFFFFF', border: '2px solid #000', borderRadius: '8px', padding: '3px 8px', fontSize: '11px', fontWeight: 900 }}>
                        {event.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>
                      {event.title}
                    </h3>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px', minHeight: '40px' }}>
                      {event.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 800, marginBottom: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#4B5563" />
                        <span>{event.date} • {event.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#4B5563" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    {/* Seats-left live meter */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 900, marginBottom: '4px' }}>
                        <span>Seats Filled ({percentFull}%)</span>
                        <span>{event.sold} / {event.capacity}</span>
                      </div>
                      <ProgressBar
                        value={event.sold}
                        max={event.capacity}
                        color={isSoldOut ? '#DC2626' : percentFull > 75 ? 'var(--accent-pink)' : 'var(--accent-green)'}
                      />
                    </div>

                    {/* Pricing Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px' }}>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, color: 'var(--ink-muted)' }}>Member Pass</span>
                        <div style={{ fontWeight: 900, fontSize: '16px', color: '#059669' }}>
                          {event.memberPrice === 0 ? 'FREE' : `₹${event.memberPrice}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, color: 'var(--ink-muted)' }}>Non-Member</span>
                        <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--ink)' }}>
                          ₹{event.nonMemberPrice}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Section */}
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Calendar & Share quick tools */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      title="Add to Google Calendar"
                      onClick={(e) => {
                        e.stopPropagation();
                        const gcal = getGoogleCalendarUrl({
                          title: event.title,
                          description: event.description,
                          location: event.location,
                          date: event.date,
                          time: event.time
                        });
                        window.open(gcal, '_blank');
                      }}
                      className="neo-btn neo-btn-sm neo-btn-white"
                      style={{
                        flex: 1,
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <CalendarPlus size={13} />
                      <span>Google Cal</span>
                    </button>

                    <button
                      type="button"
                      title="Download .ICS Calendar File"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadIcsCalendarFile({
                          title: event.title,
                          description: event.description,
                          location: event.location,
                          date: event.date,
                          time: event.time,
                          filename: `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`
                        });
                      }}
                      className="neo-btn neo-btn-sm neo-btn-white"
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Download size={13} />
                      <span>.ICS</span>
                    </button>

                    <button
                      type="button"
                      title="Share Event to WhatsApp"
                      onClick={(e) => {
                        e.stopPropagation();
                        const wa = getWhatsAppShareUrl({
                          title: event.title,
                          subtitle: `📅 ${event.date} • ${event.time} @ ${event.location}`,
                          url: window.location.href
                        });
                        window.open(wa, '_blank');
                      }}
                      className="neo-btn neo-btn-sm"
                      style={{
                        backgroundColor: '#25D366',
                        color: '#FFF',
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Share2 size={13} />
                    </button>
                  </div>

                  <Button
                    variant={isSoldOut ? 'black' : 'yellow'}
                    style={{ width: '100%' }}
                    disabled={isSoldOut}
                    onClick={() => handleOpenBuy(event)}
                    icon={Ticket}
                  >
                    {isSoldOut ? 'Registration Closed (Sold Out)' : 'Book Ticket / Pass'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Purchase Modal */}
      <Modal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        title={`🎟️ Book Pass: ${selectedEvent?.title}`}
        headerColor="var(--accent-yellow)"
      >
        {selectedEvent && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>Hosting Organization & Venue</div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>
                  {selectedEvent.clubName || activeClub.name} • {selectedEvent.location}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563' }}>{selectedEvent.date} @ {selectedEvent.time}</div>
              </div>
              <Badge variant="green">Instant QR Confirmation</Badge>
            </div>

            {/* Member Discount Toggle */}
            <div
              onClick={() => setIsMemberDiscount(!isMemberDiscount)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: isMemberDiscount ? '#FEF9C3' : '#F4F4F5',
                border: '2px solid #000',
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>
                  {isMemberDiscount ? '✓ Applying Active Member Discount' : 'Standard Student Pass'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                  {isMemberDiscount ? `Pay member rate ₹${selectedEvent.memberPrice}` : `Pay standard rate ₹${selectedEvent.nonMemberPrice}`}
                </div>
              </div>
              <Badge variant={isMemberDiscount ? 'yellow' : 'black'}>
                {isMemberDiscount ? `Save ₹${Math.max(0, selectedEvent.nonMemberPrice - selectedEvent.memberPrice)}` : 'Switch to Member'}
              </Badge>
            </div>

            {/* Price Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #000', paddingTop: '12px', marginBottom: '20px' }}>
              <span style={{ fontWeight: 900, fontSize: '16px' }}>Total Amount:</span>
              <span style={{ fontWeight: 900, fontSize: '24px', color: '#059669' }}>
                ₹{isMemberDiscount ? selectedEvent.memberPrice : selectedEvent.nonMemberPrice}
              </span>
            </div>

            <Button
              variant="yellow"
              style={{ width: '100%' }}
              onClick={handleConfirmPurchase}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing Secure Razorpay...' : `Pay ₹${isMemberDiscount ? selectedEvent.memberPrice : selectedEvent.nonMemberPrice} & Get Instant Pass`}
            </Button>
          </div>
        )}
      </Modal>

      {/* Purchased Ticket Confirmation Modal */}
      {purchasedTicket && (
        <Modal
          isOpen={Boolean(purchasedTicket)}
          onClose={() => setPurchasedTicket(null)}
          title="🎉 Registration Confirmed!"
          headerColor="var(--accent-green)"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>
              Your digital ticket is confirmed and cryptographically signed. Present this QR at the venue check-in desk!
            </p>
            <DigitalEventTicket ticket={purchasedTicket} />
            <Button variant="black" style={{ width: '100%' }} onClick={() => setPurchasedTicket(null)}>
              Done
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
