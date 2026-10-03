import React from 'react';
import { Card, Button, Badge } from '../../components/ui/index';
import { DigitalEventTicket } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { Ticket, Calendar, MapPin, QrCode, AlertCircle } from 'lucide-react';

export const MyTicketsView = ({ session, activeClub, onToast, onNavigate }) => {
  const club = clubService.getClub(activeClub?.id) || activeClub;
  const allTickets = club?.tickets || [];
  
  // Show user's tickets (or all for demo/admin)
  const myTickets = allTickets.filter(t => 
    session?.role !== 'student' || 
    t.email?.toLowerCase() === session?.email?.toLowerCase() ||
    (t.attendeeName && session?.name && t.attendeeName.toLowerCase().includes(session.name.toLowerCase()))
  );

  const handleCancelTicket = (ticketId) => {
    try {
      clubService.cancelTicket(activeClub.id, ticketId, session);
      if (onToast) onToast(`🎟️ Ticket ${ticketId} refunded successfully.`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Badge variant="blue">FR-05 Digital Ticket Wallet</Badge>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: '8px 0 0' }}>
            My Event Passes & QR Badges
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Present these cryptographically stamped QR codes at door check-in scanners for entry.
          </p>
        </div>
        <Button variant="yellow" onClick={() => onNavigate && onNavigate('browse-events')}>
          Browse More Events
        </Button>
      </div>

      {myTickets.length === 0 ? (
        <Card title="No Active Tickets in Wallet" headerBg="var(--accent-yellow)">
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>🎟️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900 }}>You have not booked any event passes yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontWeight: 700, margin: '6px 0 16px' }}>
              Explore upcoming workshops and hackathons in {activeClub.name}.
            </p>
            <Button variant="black" onClick={() => onNavigate && onNavigate('browse-events')}>
              Explore Events Schedule
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {myTickets.map((ticket) => (
            <DigitalEventTicket
              key={ticket.id}
              ticket={ticket}
              onCancel={handleCancelTicket}
            />
          ))}
        </div>
      )}
    </div>
  );
};
