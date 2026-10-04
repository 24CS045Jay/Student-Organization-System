import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge, Stepper, ProgressBar } from '../../components/ui/index';
import { NeoQRCode } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import jsQR from 'jsqr';
import { decodeInAppQR } from '../../services/neoMatrixService.js';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Camera,
  Video,
  VideoOff,
  History,
  Upload,
  Volume2,
  VolumeX,
  UserCheck,
  Calendar,
  Zap,
  Users
} from 'lucide-react';

// Web Audio API Chime Synthesizer
const playChime = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Crisp high double chime: 587Hz (D5) -> 880Hz (A5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Low warning buzz: 180Hz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    // Audio context may be restricted by browser before user interaction
  }
};

export const QRCheckinView = ({ session, activeClub, onToast }) => {
  const [ticketQuery, setTicketQuery] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [checkInResult, setCheckInResult] = useState(null);
  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active Club Events & Selected Event Filter (Default ALL to auto-detect any valid ticket)
  const clubEvents = clubService.getEvents(activeClub?.id) || [];
  const [selectedEventId, setSelectedEventId] = useState('ALL');

  // Trigger state for re-rendering live stats and logs
  const [refreshKey, setRefreshKey] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningLockRef = useRef(false);
  const fileInputRef = useRef(null);
  const barcodeDetectorRef = useRef(null);

  const steps = ['Scan Code', 'Validate Tenant', 'Duplicate Guard', 'Mark Attended'];

  // Current Club Tickets & Real-time Live Metrics
  const clubTickets = clubService.getTickets(activeClub?.id) || [];
  const filteredTickets = selectedEventId === 'ALL'
    ? clubTickets
    : clubTickets.filter(t => t.eventId === selectedEventId);

  const totalRegistered = filteredTickets.length;
  const attendedCount = filteredTickets.filter(t => t.status === 'Attended').length;
  const turnoutPercent = totalRegistered > 0 ? Math.round((attendedCount / totalRegistered) * 100) : 0;

  // Selected event metadata
  const currentEvent = clubEvents.find(e => e.id === selectedEventId) || clubEvents[0];

  // Webcam stream management
  useEffect(() => {
    if (useLiveCamera) {
      navigator.mediaDevices?.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera stream error:', err);
          alert('Could not access live webcam. Reverting to manual scanner / image upload.');
          setUseLiveCamera(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [useLiveCamera]);

  // Live video frame barcode detection with high precision & multi-resolution
  useEffect(() => {
    let animId = null;
    let isCancelled = false;
    let lastScanTime = 0;
    const canvas = document.createElement('canvas');
    const cropCanvas = document.createElement('canvas');

    const scanFrame = async () => {
      if (isCancelled) return;

      const video = videoRef.current;
      const now = performance.now();

      // Scan every ~90ms to keep video at silky 60fps and low CPU
      if (video && video.readyState >= 2 && !scanningLockRef.current && (now - lastScanTime >= 90)) {
        lastScanTime = now;
        try {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            let foundCode = null;

            // Technique 1: Hardware BarcodeDetector (Chrome / Edge / Android)
            if ('BarcodeDetector' in window) {
              try {
                if (!barcodeDetectorRef.current) {
                  barcodeDetectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
                }
                const barcodes = await barcodeDetectorRef.current.detect(video);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  foundCode = barcodes[0].rawValue;
                }
              } catch (e) {
                // fall back to jsQR
              }
            }

            // Technique 2: Center Viewfinder crop using jsQR (focus sweet spot where pink laser scans)
            if (!foundCode) {
              const minDim = Math.min(video.videoWidth, video.videoHeight);
              const cropDim = Math.floor(minDim * 0.70);
              const cropX = Math.floor((video.videoWidth - cropDim) / 2);
              const cropY = Math.floor((video.videoHeight - cropDim) / 2);
              cropCanvas.width = 380;
              cropCanvas.height = 380;
              const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
              if (cropCtx) {
                cropCtx.drawImage(video, cropX, cropY, cropDim, cropDim, 0, 0, 380, 380);
                const cropData = cropCtx.getImageData(0, 0, 380, 380);
                const decoded = decodeInAppQR(cropData);
                if (decoded && decoded.code) {
                  foundCode = decoded.code;
                }
              }
            }

            // Technique 3: Scaled full frame with jsQR (if pass is held off-center)
            if (!foundCode) {
              const scale = Math.min(1, 600 / Math.max(video.videoWidth, video.videoHeight));
              canvas.width = Math.floor(video.videoWidth * scale);
              canvas.height = Math.floor(video.videoHeight * scale);
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const decoded = decodeInAppQR(fullData);
                if (decoded && decoded.code) {
                  foundCode = decoded.code;
                }
              }
            }

            if (foundCode && !scanningLockRef.current) {
              scanningLockRef.current = true;
              handleProcessScan(foundCode);
              setTimeout(() => {
                scanningLockRef.current = false;
              }, 2500); // 2.5s cooldown before next check-in
            }
          }
        } catch (err) {
          // ignore frame read error
        }
      }

      if (!isCancelled && useLiveCamera) {
        animId = requestAnimationFrame(scanFrame);
      }
    };

    if (useLiveCamera) {
      animId = requestAnimationFrame(scanFrame);
    }

    return () => {
      isCancelled = true;
      if (animId) cancelAnimationFrame(animId);
    };
  }, [useLiveCamera, selectedEventId]);

  const handleProcessScan = (code) => {
    let target = (code || ticketQuery).trim();
    if (!target || isProcessing) return;

    // If payload is a URL (e.g. ?verify=TKT-TC-9801)
    if (target.includes('?') || target.includes('verify=') || target.includes('ticket=') || target.includes('code=')) {
      try {
        const urlStr = (target.startsWith('http://') || target.startsWith('https://')) ? target : `http://localhost/${target.replace(/^\//, '')}`;
        const u = new URL(urlStr);
        const p = u.searchParams.get('verify') || u.searchParams.get('ticket') || u.searchParams.get('code') || u.searchParams.get('id');
        if (p) target = p.trim();
      } catch (e) {
        const m = target.match(/[?&](?:verify|ticket|code|id)=([^&#]+)/i);
        if (m && m[1]) target = decodeURIComponent(m[1]).trim();
      }
    }

    // Sanitize any wrapper tokens or whitespace
    target = target
      .replace(/^CLUBSPHERE:(PASS|TICKET|MEMBER|CERT):/i, '')
      .replace(/^CS-APP:\/\/[^/]+\//i, '')
      .replace(/["']/g, '')
      .trim();

    setIsProcessing(true);
    setActiveStep(1);

    setTimeout(() => {
      setActiveStep(2);
      setTimeout(() => {
        const res = clubService.validateAndCheckInTicket(
          activeClub.id,
          target,
          session,
          selectedEventId === 'ALL' ? null : selectedEventId
        );

        setCheckInResult(res);
        setIsProcessing(false);

        const isSuccess = res.status === 'ATTENDED_SUCCESS';
        setActiveStep(isSuccess ? 3 : 2);

        if (isSuccess) {
          if (soundEnabled) playChime('success');
          if (onToast) onToast(res.message);
          setTicketQuery('');
        } else {
          if (soundEnabled) playChime('error');
        }

        // Trigger reactive update across UI
        setRefreshKey(k => k + 1);
      }, 250);
    }, 200);
  };

  const handlePresetTest = (code) => {
    setTicketQuery(code);
    handleProcessScan(code);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const processWithJsQR = () => {
            // 1. Try original
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let decoded = decodeInAppQR(imgData);

            // 2. Try scaled 600px
            if (!decoded && (img.width > 700 || img.height > 700)) {
              const scale = Math.min(600 / img.width, 600 / img.height);
              canvas.width = Math.round(img.width * scale);
              canvas.height = Math.round(img.height * scale);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              decoded = decodeInAppQR(imgData);
            }

            // 3. Try scaled 400px
            if (!decoded) {
              const scale = Math.min(400 / img.width, 400 / img.height);
              canvas.width = Math.round(img.width * scale);
              canvas.height = Math.round(img.height * scale);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              decoded = decodeInAppQR(imgData);
            }

            if (decoded && decoded.code) {
              handleProcessScan(decoded.code);
            } else {
              alert('No valid ClubSphere pass detected in this photo. Please make sure the QR image is clearly visible.');
            }
          };

          // Try native BarcodeDetector if available
          if ('BarcodeDetector' in window) {
            try {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              detector.detect(img).then(barcodes => {
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleProcessScan(barcodes[0].rawValue);
                } else {
                  processWithJsQR();
                }
              }).catch(() => processWithJsQR());
              return;
            } catch (err) {
              processWithJsQR();
            }
          } else {
            processWithJsQR();
          }
        } catch (err) {
          alert('Error processing QR image: ' + err.message);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQuickAdmit = (memberId) => {
    try {
      const res = clubService.quickAdmitMember(
        activeClub.id,
        selectedEventId === 'ALL' ? clubEvents[0]?.id : selectedEventId,
        memberId,
        session
      );
      setCheckInResult(res);
      setActiveStep(3);
      if (soundEnabled) playChime('success');
      if (onToast) onToast(res.message);
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert(e.message);
    }
  };

  // Recent attendance list sorted by latest check-in
  const liveAttendedList = clubTickets
    .filter(t => t.status === 'Attended')
    .slice(0, 10);

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Badge variant="pink">FR-05 & FR-06 Gate Check-in Desk</Badge>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '8px 0 4px' }}>
            Instant QR Event Check-in
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Confirm arrival for registered members, prevent duplicate pass-sharing, and stream live attendance for <strong>{activeClub.name}</strong>.
          </p>
        </div>

        {/* Audio Toggle & Sound Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="neo-box neo-box-interactive"
            style={{
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              backgroundColor: soundEnabled ? '#DCFCE7' : '#F4F4F5'
            }}
          >
            {soundEnabled ? <Volume2 size={16} color="#059669" /> : <VolumeX size={16} color="#71717A" />}
            {soundEnabled ? 'Chime ON' : 'Muted'}
          </button>
        </div>
      </div>

      {/* Event Selection & Live Turnout Gauge */}
      <Card title="🎯 Active Gate Event & Real-time Turnout" headerBg="var(--accent-blue)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>
              Select Event Venue Desk
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="neo-input"
              style={{ fontWeight: 800, fontSize: '14px', width: '100%', cursor: 'pointer' }}
            >
              <option value="ALL">All Club Events (Auto-Detect Ticket)</option>
              {clubEvents.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.date})
                </option>
              ))}
            </select>
            {currentEvent && (
              <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '6px', fontWeight: 700 }}>
                📍 {currentEvent.location} • 🕒 {currentEvent.time || 'Door Open'}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                Arrival Progress
              </span>
              <Badge variant="green">{turnoutPercent}% Checked-In</Badge>
            </div>
            <ProgressBar value={turnoutPercent} max={100} height="12px" color="var(--accent-green)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', fontWeight: 800 }}>
              <span>{attendedCount} Arrived</span>
              <span style={{ color: 'var(--ink-muted)' }}>{totalRegistered} Registered Total</span>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Viewfinder & Scanner Controls */}
        <Card title="📷 Camera Viewfinder & Barcode Scanner" headerBg="var(--accent-yellow)">
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
            {useLiveCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : null}

            {/* Viewfinder Reticle Frame */}
            <div
              style={{
                width: '180px',
                height: '180px',
                border: '3px solid var(--accent-green)',
                borderRadius: '16px',
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none'
              }}
            >
              {/* Sweeping Neon Pink Laser Line (Real Up & Down Motion) */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '3.5px',
                  backgroundColor: '#FF2A85',
                  boxShadow: '0 0 12px 3px #FF2A85, 0 0 24px 6px rgba(255, 42, 133, 0.85)',
                  animation: 'laserSweep 2.2s ease-in-out infinite',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              >
                {/* Luminous light curtain trail */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '-18px',
                    height: '36px',
                    background: 'linear-gradient(180deg, rgba(255,42,133,0) 0%, rgba(255,42,133,0.3) 50%, rgba(255,42,133,0) 100%)',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {!useLiveCamera && <QrCode size={52} color="rgba(255,255,255,0.35)" />}
            </div>

            <div style={{ position: 'absolute', bottom: '12px', left: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)' }}>
              ● {useLiveCamera ? 'LIVE HARDWARE SCANNER ACTIVE' : 'OPTICAL VIEW READY'} • 60 FPS
            </div>

            <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setUseLiveCamera(!useLiveCamera)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: useLiveCamera ? '#EF4444' : '#121212',
                  color: '#fff',
                  border: '2px solid #fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                {useLiveCamera ? <VideoOff size={14} /> : <Video size={14} />}
                {useLiveCamera ? 'Stop Camera' : 'Live Camera'}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload QR photo or screenshot"
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#121212',
                  color: '#fff',
                  border: '2px solid #fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Upload size={14} />
                Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Scan QR or enter Ticket / Member ID (e.g. TKT-TC-9801, TC-001, 24CS001)..."
              value={ticketQuery}
              onChange={(e) => setTicketQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProcessScan();
              }}
              className="neo-input"
              style={{ fontWeight: 800, fontSize: '14px' }}
            />
            <Button variant="black" onClick={() => handleProcessScan()}>
              Check-In
            </Button>
          </div>

          {/* Preset Buttons for Demo Scenarios */}
          <div style={{ borderTop: '2px dashed #121212', marginTop: '16px', paddingTop: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Instant Test Presets:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              <Button variant="green" size="sm" onClick={() => handlePresetTest('TKT-TC-9801')}>
                ✓ Demo Pass (TKT-TC-9801)
              </Button>
              <Button variant="yellow" size="sm" onClick={() => handlePresetTest('TC-001')}>
                ✓ Member Pass (TC-001)
              </Button>
              <Button variant="blue" size="sm" onClick={() => handlePresetTest('24CS001')}>
                ✓ Student Roll (24CS001)
              </Button>
              <Button variant="pink" size="sm" onClick={() => handlePresetTest('TKT-TC-9802')}>
                ⚠️ Duplicate Guard (TC-9802)
              </Button>
              <Button variant="purple" size="sm" onClick={() => handlePresetTest('TKT-CC-401')}>
                🚫 Wrong Club (Cultural CC-401)
              </Button>
            </div>

            {/* Dynamic Real Booked Tickets */}
            {clubTickets.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #D1D5DB' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                  🎟️ Your Active Club Tickets ({clubTickets.length}):
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {clubTickets.slice(0, 4).map(tkt => (
                    <Button key={tkt.id} variant="white" size="sm" onClick={() => handlePresetTest(tkt.id)}>
                      {tkt.id} ({tkt.attendeeName})
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Validation Pipeline Stepper & Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="⚡ Validation Pipeline" headerBg="var(--accent-pink)">
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
                    : checkInResult.status === 'NOT_REGISTERED'
                    ? '#FEF9C3'
                    : checkInResult.status === 'WRONG_EVENT'
                    ? '#FEF9C3'
                    : checkInResult.status === 'WRONG_CLUB'
                    ? '#E0E7FF'
                    : '#FEE2E2',
                animation: 'slideUp 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>
                  {checkInResult.status === 'ATTENDED_SUCCESS' && '🎉'}
                  {checkInResult.status === 'ALREADY_USED' && '⚠️'}
                  {checkInResult.status === 'NOT_REGISTERED' && '📋'}
                  {checkInResult.status === 'WRONG_EVENT' && '⚠️'}
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
                        : checkInResult.status === 'NOT_REGISTERED'
                        ? 'yellow'
                        : checkInResult.status === 'WRONG_EVENT'
                        ? 'yellow'
                        : checkInResult.status === 'WRONG_CLUB'
                        ? 'purple'
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

              {/* Verified Ticket Information */}
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

              {/* Wrong Event Switch Filter Button */}
              {checkInResult.status === 'WRONG_EVENT' && checkInResult.ticket && (
                <div style={{ marginTop: '12px' }}>
                  <Button
                    variant="yellow"
                    style={{ width: '100%' }}
                    onClick={() => {
                      setSelectedEventId('ALL');
                      handleProcessScan(checkInResult.ticket.id);
                    }}
                  >
                    🔄 Switch Filter to "All Events" & Check In Now
                  </Button>
                </div>
              )}

              {/* Unregistered Member Walk-in Quick Admit Prompt */}
              {checkInResult.status === 'NOT_REGISTERED' && checkInResult.member && (
                <div style={{ marginTop: '12px' }}>
                  <Button
                    variant="yellow"
                    style={{ width: '100%' }}
                    onClick={() => handleQuickAdmit(checkInResult.member.id)}
                  >
                    ⚡ Quick Register & Admit ({checkInResult.member.name})
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Live Recent Check-in Feed */}
          <Card title="📋 Live Door Check-in Feed" headerBg="var(--accent-purple)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {liveAttendedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ink-muted)', fontSize: '13px', fontWeight: 700 }}>
                  No check-ins yet today. Scan tickets to see live attendance.
                </div>
              ) : (
                liveAttendedList.map((tkt, idx) => (
                  <div
                    key={tkt.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: '#FAF5EE',
                      border: '2px solid #000',
                      borderRadius: '10px',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 900 }}>{tkt.attendeeName}</span>
                      <span style={{ color: 'var(--ink-muted)', marginLeft: '6px' }}>({tkt.seat || 'General'})</span>
                      <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#666' }}>
                        {tkt.id} • {tkt.checkInTime || 'Just now'}
                      </div>
                    </div>
                    <Badge variant={tkt.isMember ? 'purple' : 'green'}>
                      {tkt.isMember ? 'Member' : 'Guest'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
