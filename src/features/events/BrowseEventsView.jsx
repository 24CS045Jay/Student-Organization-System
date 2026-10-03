import React, { useState } from 'react';
import { Card, Button, Badge, Modal, ProgressBar } from '../../components/ui/index';
import { DigitalEventTicket } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { Calendar, MapPin, Clock, Users, Tag, CheckCircle2, Ticket, Sparkles, CreditCard, ArrowRight } from 'lucide-react';

export const BrowseEventsView = ({ session, activeClub, onToast, onNavigate }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isMemberDiscount, setIsMemberDiscount] = useState(session.role === 'student' || session.role === 'admin');
  const [purchasedTicket, setPurchasedTicket] = useState(null);

  const events = clubService.getEvents(activeClub.id);
  const publishedEvents = events.filter(e => e.status === 'Published' || session.role !== 'student');

  const handleOpenBuy = (event) => {
    setSelectedEvent(event);
    setIsBuyModalOpen(true);
    setPurchasedTicket(null);
  };

  const handleConfirmPurchase = () => {
    if (!selectedEvent) return;

    try {
      const ticket = clubService.buyTicket(
        activeClub.id,
        selectedEvent.id,
        {
          name: session.name || 'Student Member',
          email: session.email || 'student@charusat.edu.in',
          isMember: isMemberDiscount,
          memberId: isMemberDiscount ? `${activeClub.prefix}-001` : null
        },
        session
      );

      setPurchasedTicket(ticket);
      setIsBuyModalOpen(false);
      if (onToast) onToast(`🎟️ Ticket confirmed! ID: ${ticket.id}`);
    } catch (err) {
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
          <Badge variant="black">FR-04 Public Events Hub</Badge>
          <h1 style={{ fontSize: '30px', fontWeight: 900, margin: '8px 0 4px', color: '#121212' }}>
            Explore {activeClub.name} Events
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(0,0,0,0.8)' }}>
            Hackathons, technical bootcamps, and cultural festivals. Real-time seats meter & instant digital passes.
          </p>
        </div>
        <Button variant="black" onClick={() => onNavigate && onNavigate('my-tickets')} icon={Ticket}>
          View My Passes
        </Button>
      </div>

      {/* Events Grid */}
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
                    padding: '20px',
                    borderBottom: '3px solid #121212',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <Badge variant={isSoldOut ? 'black' : 'green'}>
                    {isSoldOut ? '⛔ SOLD OUT' : `✓ ${seatsLeft} SEATS LEFT`}
                  </Badge>
                  <span style={{ backgroundColor: '#FFFFFF', border: '2px solid #000', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: 900 }}>
                    {event.category}
                  </span>
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

              {/* Action Button */}
              <div style={{ padding: '0 20px 20px' }}>
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
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>Event Date & Venue</div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>{selectedEvent.date} • {selectedEvent.location}</div>
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
                border: '2.5px solid #121212',
                borderRadius: '12px',
                backgroundColor: isMemberDiscount ? '#DCFCE7' : '#FFFFFF',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={isMemberDiscount}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: 900, fontSize: '14px' }}>Apply Club Member Discount</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-muted)' }}>
                    Active membership in {activeClub.short} saves ₹{selectedEvent.nonMemberPrice - selectedEvent.memberPrice}!
                  </div>
                </div>
              </div>
              <Badge variant={isMemberDiscount ? 'green' : 'yellow'}>
                {isMemberDiscount ? `₹${selectedEvent.memberPrice}` : `₹${selectedEvent.nonMemberPrice}`}
              </Badge>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label className="neo-label">Select Payment Method (Simulated):</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['UPI', 'Card', 'Student Wallet'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: paymentMethod === m ? '2.5px solid #000' : '2px solid #E4E4E7',
                      backgroundColor: paymentMethod === m ? 'var(--accent-yellow)' : '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="yellow" style={{ width: '100%' }} onClick={handleConfirmPurchase}>
              Pay ₹{isMemberDiscount ? selectedEvent.memberPrice : selectedEvent.nonMemberPrice} & Generate Digital Ticket
            </Button>
          </div>
        )}
      </Modal>

      {/* Instant Success Modal with Generated QR Ticket */}
      <Modal
        isOpen={Boolean(purchasedTicket)}
        onClose={() => setPurchasedTicket(null)}
        title="🎉 Payment Successful — Here is Your Digital Pass!"
        headerColor="var(--accent-green)"
      >
        {purchasedTicket && (
          <div>
            <DigitalEventTicket
              ticket={purchasedTicket}
              event={selectedEvent}
              onCancel={(id) => {
                clubService.cancelTicket(activeClub.id, id, session);
                setPurchasedTicket(null);
                if (onToast) onToast('Ticket cancelled & refund initiated.');
              }}
            />
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button variant="black" onClick={() => onNavigate && onNavigate('my-tickets')}>
                View in My Tickets Wallet
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
