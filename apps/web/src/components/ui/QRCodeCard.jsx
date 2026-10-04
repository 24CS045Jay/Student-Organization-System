import React, { useState, useEffect } from 'react';
import { Badge, Button } from './index';
import { Check, Copy, QrCode, ShieldCheck, Sparkles, Lock, CalendarPlus, Share2, Download, ExternalLink } from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsCalendarFile, getWhatsAppShareUrl } from '../../services/calendarService';
import QRCodeLib from 'qrcode';

// Universal ClubSphere Verified QR Code Pass
export const NeoQRCode = ({ code = 'TC-001', size = 150, color = '#121212' }) => {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let isCurrent = true;
    const clean = String(code || 'TC-001').trim();
    const origin = (typeof window !== 'undefined' && window.location?.origin)
      ? window.location.origin
      : 'https://clubsphere-campus-os.vercel.app';
    // Universal verification payload that works on both smartphone camera and in-app scanner
    const payload = (clean.startsWith('http://') || clean.startsWith('https://'))
      ? clean
      : `${origin}/?verify=${encodeURIComponent(clean)}`;

    QRCodeLib.toDataURL(payload, {
      width: Math.max(size * 2, 320),
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(url => {
      if (isCurrent) setDataUrl(url);
    }).catch(err => {
      console.warn('QR gen error:', err);
    });

    return () => { isCurrent = false; };
  }, [code, size, color]);

  return (
    <div
      style={{
        padding: '14px',
        backgroundColor: '#FFFFFF',
        border: '3px solid #121212',
        borderRadius: '16px',
        boxShadow: '4px 4px 0px #121212',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        position: 'relative'
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR Code for ${code}`}
          width={size}
          height={size}
          style={{
            display: 'block',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '6px',
            objectFit: 'contain'
          }}
        />
      ) : (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: '#F4F4F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#71717A' }}>Generating Pass...</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Lock size={11} color="#71717A" />
        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '13px', letterSpacing: '0.08em', color: '#121212' }}>
          {code}
        </span>
      </div>
      <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#71717A', letterSpacing: '0.05em' }}>
        ClubSphere Verified Pass
      </span>
    </div>
  );
};
// Digital Member Pass (FR-01, FR-02, Item C)
export const DigitalMemberCard = ({
  member,
  clubName = 'Student Club Organization',
  accentColor = 'var(--accent-yellow)',
  onRenew
}) => {
  const [copied, setCopied] = useState(false);

  if (!member) return null;

  const isExpired = new Date(member.exp) < new Date() || member.paid === 0;

  const handleCopy = () => {
    navigator.clipboard?.writeText(member.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="neo-box"
      style={{
        maxWidth: '440px',
        margin: '0 auto',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '3.5px solid #121212',
        boxShadow: '6px 6px 0px #121212',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)'
      }}
    >
      {/* Header Stamp */}
      <div
        style={{
          backgroundColor: accentColor,
          padding: '18px 20px',
          borderBottom: '3px solid #121212',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>
            Official Digital ID Card
          </span>
          <h4 style={{ fontSize: '16px', fontWeight: 900, margin: '2px 0 0' }}>{clubName}</h4>
        </div>
        <Badge variant={isExpired ? 'pink' : 'green'}>
          {isExpired ? '⚠️ Expired' : '✓ Active Member'}
        </Badge>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              border: '2.5px solid #121212',
              backgroundColor: '#FFE8D6',
              fontSize: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0px #121212'
            }}
          >
            {member.photo || '🧑‍💻'}
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>{member.name}</h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '2px' }}>
              ID: {member.studentId} • {member.dept}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: '13px',
                  backgroundColor: '#FAF4E8',
                  padding: '2px 8px',
                  border: '1.5px solid #000',
                  borderRadius: '6px'
                }}
              >
                {member.id}
              </span>
              <button
                onClick={handleCopy}
                title="Copy Member ID"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #000',
                  borderRadius: '6px',
                  padding: '3px 6px',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={13} color="#059669" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
          <NeoQRCode code={member.id} size={140} color="#121212" />
        </div>

        {/* Member Details Matrix */}
        <div
          style={{
            backgroundColor: '#FAF5EE',
            border: '2px solid #121212',
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '13px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          <div>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Tier Plan</span>
            <div style={{ fontWeight: 900 }}>{member.type}</div>
          </div>
          <div>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Valid Until</span>
            <div style={{ fontWeight: 900, color: isExpired ? '#DC2626' : '#059669' }}>{member.exp}</div>
          </div>
          <div>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Events Attended</span>
            <div style={{ fontWeight: 900 }}>{member.attendanceCount || 0} Sessions</div>
          </div>
          <div>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Discounts</span>
            <div style={{ fontWeight: 900 }}>Up to 40% Off</div>
          </div>
        </div>

        <p style={{ fontSize: '11px', textAlign: 'center', color: 'var(--ink-muted)', fontWeight: 700 }}>
          ⚡ Present this QR at registration desks for fast-track entry and merch discounts.
        </p>

        {/* WhatsApp Sharing Button for Digital ID */}
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => {
              const url = getWhatsAppShareUrl({
                title: `${member.name}'s ${clubName} Digital ID Card`,
                subtitle: `Tier: ${member.type} • Roll No: ${member.studentId}`,
                refId: member.id
              });
              window.open(url, '_blank');
            }}
            className="neo-btn neo-btn-sm"
            style={{
              width: '100%',
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: '2px solid #121212',
              boxShadow: '2px 2px 0px #121212',
              fontWeight: 900,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            <Share2 size={14} />
            <span>Share Digital ID to WhatsApp</span>
          </button>
        </div>

        {isExpired && onRenew && (
          <div style={{ marginTop: '16px' }}>
            <Button variant="yellow" style={{ width: '100%' }} onClick={onRenew}>
              ⚡ Renew Membership Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Digital Event Pass / Ticket (FR-05)
export const DigitalEventTicket = ({ ticket, event, onCancel }) => {
  const isUsed = ticket.status === 'Attended';
  const isRefunded = ticket.status === 'Refunded';

  return (
    <div
      className="neo-box"
      style={{
        maxWidth: '460px',
        margin: '0 auto',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '3.5px solid #121212',
        boxShadow: '6px 6px 0px #121212',
        background: '#FFFFFF'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--accent-pink)',
          color: '#FFFFFF',
          padding: '16px 20px',
          borderBottom: '3px solid #121212',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFE4E6' }}>
            Official Event Ticket
          </span>
          <h4 style={{ fontSize: '17px', fontWeight: 900, margin: '2px 0 0', color: '#FFFFFF' }}>{ticket.eventTitle}</h4>
        </div>
        <Badge variant={isUsed ? 'green' : isRefunded ? 'black' : 'yellow'}>
          {ticket.status}
        </Badge>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Attendee</div>
            <div style={{ fontSize: '17px', fontWeight: 900 }}>{ticket.attendeeName}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#71717A' }}>{ticket.email}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Seat / Access</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--ink)' }}>{ticket.seat}</div>
            <Badge variant="purple" style={{ marginTop: '4px' }}>
              {ticket.isMember ? 'Member Pass (₹' + ticket.pricePaid + ')' : 'Guest Pass (₹' + ticket.pricePaid + ')'}
            </Badge>
          </div>
        </div>

        {/* QR Scan Area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: '16px 0' }}>
          <NeoQRCode code={ticket.id} size={150} color={isUsed ? '#059669' : '#121212'} />
          {isUsed && (
            <Badge variant="green">
              Scanned at: {ticket.checkInTime || 'Today'}
            </Badge>
          )}
        </div>

        {/* Pass Actions: Calendar & WhatsApp */}
        <div
          style={{
            backgroundColor: '#FAF5EE',
            border: '2px solid #121212',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            ⚡ Instant Pass Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                const gCalUrl = getGoogleCalendarUrl({
                  title: ticket.eventTitle,
                  description: `Event Ticket Pass ${ticket.id} for ${ticket.attendeeName} (Seat: ${ticket.seat})`,
                  location: event?.location || 'Campus Auditorium',
                  date: event?.date,
                  time: event?.time
                });
                window.open(gCalUrl, '_blank');
              }}
              className="neo-btn neo-btn-sm neo-btn-white"
              style={{
                fontSize: '11px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 8px'
              }}
            >
              <CalendarPlus size={13} />
              <span>Google Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadIcsCalendarFile({
                  title: ticket.eventTitle,
                  description: `Event Pass ${ticket.id} for ${ticket.attendeeName} (Seat: ${ticket.seat})`,
                  location: event?.location || 'Campus Auditorium',
                  date: event?.date,
                  time: event?.time,
                  filename: `${ticket.id}-event.ics`
                });
              }}
              className="neo-btn neo-btn-sm neo-btn-white"
              style={{
                fontSize: '11px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 8px'
              }}
            >
              <Download size={13} />
              <span>Download .ICS</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const waUrl = getWhatsAppShareUrl({
                title: `${ticket.eventTitle} Entry Pass`,
                subtitle: `Attendee: ${ticket.attendeeName} • Seat: ${ticket.seat}`,
                refId: ticket.id
              });
              window.open(waUrl, '_blank');
            }}
            className="neo-btn neo-btn-sm"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: '2px solid #121212',
              boxShadow: '2px 2px 0px #121212',
              fontWeight: 900,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            <Share2 size={13} />
            <span>Send Ticket Pass to WhatsApp</span>
          </button>
        </div>

        <div
          style={{
            borderTop: '2px dashed #121212',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 800
          }}
        >
          <div>
            <span style={{ color: 'var(--ink-muted)' }}>Ticket Ref:</span> {ticket.id}
          </div>
          {!isUsed && !isRefunded && onCancel && (
            <Button variant="pink" size="sm" onClick={() => onCancel(ticket.id)}>
              Cancel / Refund
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
