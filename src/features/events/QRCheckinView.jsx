import React, { useState } from 'react';
import { Card, Button, Badge, Stepper } from '../../components/ui/index';
import { NeoQRCode } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { QrCode, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, Camera } from 'lucide-react';

export const QRCheckinView = ({ session, activeClub, onToast }) => {
  const [ticketQuery, setTicketQuery] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [checkInResult, setCheckInResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);

  const steps = ['Scan Code', 'Validate Tenant', 'Duplicate Guard', 'Mark Attended'];

  const handleProcessScan = (code) => {
    const target = code || ticketQuery;
    if (!target) return;

    setActiveStep(1);
    setTimeout(() => {
      setActiveStep(2);
      setTimeout(() => {
        const res = clubService.validateAndCheckInTicket(activeClub.id, target, session);
        setCheckInResult(res);
        setActiveStep(res.status === 'ATTENDED_SUCCESS' ? 3 : 2);

        if (res.status === 'ATTENDED_SUCCESS' && onToast) {
          onToast(`✅ Verified: ${res.ticket.attendeeName} (${res.ticket.seat})`);
        }
      }, 300);
    }, 250);
  };

  const handlePresetTest = (code) => {
    setTicketQuery(code);
    handleProcessScan(code);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <Badge variant="pink">FR-05 & FR-06 Gate Check-in Desk</Badge>
        <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '8px 0 4px' }}>
          Door QR Check-in & Scanner Simulator
        </h1>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          High-speed gate verification with anti-passback duplicate guards and multi-tenant validation for {activeClub.name}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Simulated Camera Viewfinder & Manual Input */}
        <Card title="📷 Camera Viewfinder & Scanner" headerBg="var(--accent-yellow)">
          <div
            style={{
              position: 'relative',
              height: '240px',
              backgroundColor: '#121212',
              borderRadius: '16px',
              border: '2.5px solid #000',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '16px'
            }}
          >
            {/* Viewfinder Reticle Frame */}
            <div
              style={{
                width: '160px',
                height: '160px',
                border: '3px solid var(--accent-green)',
                borderRadius: '16px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Laser scanline animation */}
              <div
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: 'var(--accent-pink)',
                  boxShadow: '0 0 8px var(--accent-pink)',
                  animation: 'pulseGlow 1.5s infinite alternate'
                }}
              />
              <QrCode size={48} color="rgba(255,255,255,0.4)" />
            </div>

            <div style={{ position: 'absolute', bottom: '12px', left: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)' }}>
              ● SCANNER ACTIVE • 60 FPS
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter or paste ticket barcode..."
              value={ticketQuery}
              onChange={(e) => setTicketQuery(e.target.value)}
              className="neo-input"
              style={{ fontWeight: 800 }}
            />
            <Button variant="black" onClick={() => handleProcessScan()}>
              Check-In
            </Button>
          </div>

          {/* Preset Buttons for Demo Scenarios */}
          <div style={{ borderTop: '2px dashed #121212', marginTop: '16px', paddingTop: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Test Demo Check-in Scenarios:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              <Button variant="green" size="sm" onClick={() => handlePresetTest('TKT-TC-9801')}>
                ✓ Valid Ticket (TC-9801)
              </Button>
              <Button variant="pink" size="sm" onClick={() => handlePresetTest('TKT-TC-9802')}>
                ⚠️ Duplicate / Already Used (TC-9802)
              </Button>
              <Button variant="purple" size="sm" onClick={() => handlePresetTest('TKT-CC-401')}>
                🚫 Wrong Club (CC-401 Cultural)
              </Button>
              <Button variant="white" size="sm" onClick={() => handlePresetTest('TKT-INVALID-99')}>
                ✕ Invalid Code
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Column: Validation Pipeline Stepper & Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="⚡ Validation Pipeline Stepper" headerBg="var(--accent-pink)">
            <Stepper steps={steps} activeIndex={activeStep} />
          </Card>

          {/* Result Card */}
          {checkInResult && (
            <div
              className="neo-box"
              style={{
                padding: '20px',
                border: '3.5px solid #121212',
                boxShadow: '6px 6px 0px #121212',
                backgroundColor:
                  checkInResult.status === 'ATTENDED_SUCCESS'
                    ? '#DCFCE7'
                    : checkInResult.status === 'ALREADY_USED'
                    ? '#FEF3C7'
                    : checkInResult.status === 'WRONG_CLUB'
                    ? '#E0E7FF'
                    : '#FEE2E2',
                animation: 'slideUp 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>
                  {checkInResult.status === 'ATTENDED_SUCCESS' && '🎉'}
                  {checkInResult.status === 'ALREADY_USED' && '⚠️'}
                  {checkInResult.status === 'WRONG_CLUB' && '🏢'}
                  {checkInResult.status === 'INVALID' && '⛔'}
                </span>
                <div>
                  <Badge
                    variant={
                      checkInResult.status === 'ATTENDED_SUCCESS'
                        ? 'green'
                        : checkInResult.status === 'ALREADY_USED'
                        ? 'yellow'
                        : 'pink'
                    }
                  >
                    {checkInResult.status}
                  </Badge>
                  <h4 style={{ fontSize: '16px', fontWeight: 900, margin: '4px 0 0' }}>
                    {checkInResult.message}
                  </h4>
                </div>
              </div>

              {checkInResult.ticket && (
                <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #000', borderRadius: '12px', padding: '12px', fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Attendee</span>
                    <div style={{ fontWeight: 900 }}>{checkInResult.ticket.attendeeName}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Seat / Pass</span>
                    <div style={{ fontWeight: 900 }}>{checkInResult.ticket.seat}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Event</span>
                    <div style={{ fontWeight: 900 }}>{checkInResult.ticket.eventTitle}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Ticket Ref</span>
                    <div style={{ fontWeight: 900, fontFamily: 'monospace' }}>{checkInResult.ticket.id}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
