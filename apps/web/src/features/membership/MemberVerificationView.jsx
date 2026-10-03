import React, { useState, useRef } from 'react';
import { Card, Button, Badge } from '../../components/ui/index';
import { NeoQRCode } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { decodeInAppQR } from '../../services/neoMatrixService.js';
import { QrCode, Search, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Building, RefreshCw, Upload } from 'lucide-react';

export const MemberVerificationView = ({ session, activeClub, onToast }) => {
  const [queryId, setQueryId] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleVerify = (idToVerify) => {
    const target = idToVerify || queryId;
    if (!target) return;
    const res = clubService.verifyMember(activeClub.id, target);
    setResult(res);
    if (res.status === 'ACTIVE' && onToast) onToast(`✅ Verified Active Member: ${res.member.name}`);
    if (res.status === 'WRONG_CLUB' && onToast) onToast(`⚠️ Blocked Cross-Club Member from ${res.clubName}`);
  };

  const handleQuickTest = (code) => {
    setQueryId(code);
    handleVerify(code);
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
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = decodeInAppQR(imageData);

          if (decoded && decoded.code) {
            setQueryId(decoded.code);
            handleVerify(decoded.code);
          } else {
            alert('Could not decode QR code from this image. Please ensure the QR is clear and well lit.');
          }
        } catch (err) {
          alert('Error processing image: ' + err.message);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <Badge variant="yellow">FR-02 & NFR-03 Verification Gate</Badge>
        <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '8px 0 4px' }}>
          Real-time Member Credential Verification
        </h1>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          Scan digital QR codes or enter Student ID to check eligibility, membership validity, and enforce multi-tenant isolation for <strong>{activeClub.name}</strong>.
        </p>
      </div>

      {/* Lookup Bar */}
      <Card title="🔍 Scanner & Member ID Lookup" headerBg="var(--accent-yellow)">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Scan QR or enter ID (e.g. TC-001, CC-001, 21IT089)..."
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerify();
            }}
            className="neo-input"
            style={{ fontSize: '16px', fontWeight: 800 }}
          />
          <Button variant="black" onClick={() => handleVerify()}>
            Verify
          </Button>
          <Button variant="white" onClick={() => fileInputRef.current?.click()} icon={Upload}>
            Upload QR
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>

        {/* Quick Test Presets for Demo Reviewers */}
        <div style={{ borderTop: '2px dashed #121212', paddingTop: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            Quick Demo Validation Presets:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <Button variant="green" size="sm" onClick={() => handleQuickTest('TC-001')}>
              ✓ Active Member (TC-001)
            </Button>
            <Button variant="pink" size="sm" onClick={() => handleQuickTest('TC-003')}>
              ⚠️ Expired Member (TC-003)
            </Button>
            <Button variant="purple" size="sm" onClick={() => handleQuickTest('CC-001')}>
              🚫 Cross-Club Test (CC-001 Cultural)
            </Button>
            <Button variant="white" size="sm" onClick={() => handleQuickTest('XYZ-999')}>
              ✕ Invalid ID (XYZ-999)
            </Button>
          </div>
        </div>
      </Card>

      {/* Verification Result Output */}
      {result && (
        <div
          className="neo-box"
          style={{
            padding: '24px',
            border: '3.5px solid #121212',
            boxShadow: '6px 6px 0px #121212',
            backgroundColor:
              result.status === 'ACTIVE'
                ? '#DCFCE7'
                : result.status === 'WRONG_CLUB'
                ? '#E0E7FF'
                : result.status === 'EXPIRED'
                ? '#FEF3C7'
                : '#FEE2E2',
            animation: 'slideUp 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                border: '2.5px solid #000',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                boxShadow: '3px 3px 0px #000'
              }}
            >
              {result.status === 'ACTIVE' && '✅'}
              {result.status === 'WRONG_CLUB' && '🏢'}
              {result.status === 'EXPIRED' && '⏰'}
              {result.status === 'INVALID' && '❌'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <Badge
                  variant={
                    result.status === 'ACTIVE'
                      ? 'green'
                      : result.status === 'WRONG_CLUB'
                      ? 'purple'
                      : result.status === 'EXPIRED'
                      ? 'yellow'
                      : 'pink'
                  }
                >
                  {result.status}
                </Badge>
                <span style={{ fontSize: '13px', fontWeight: 900 }}>
                  {result.status === 'ACTIVE' && 'Access Granted'}
                  {result.status === 'WRONG_CLUB' && 'Tenant Isolation Rejection'}
                  {result.status === 'EXPIRED' && 'Action Required: Renewal'}
                  {result.status === 'INVALID' && 'Record Not Found'}
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
                {result.message}
              </h3>
            </div>
          </div>

          {result.member && (
            <div
              style={{
                marginTop: '18px',
                padding: '14px',
                backgroundColor: '#FFFFFF',
                border: '2px solid #000',
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                fontSize: '13px'
              }}
            >
              <div>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Member Name</span>
                <div style={{ fontWeight: 900 }}>{result.member.name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Roll & Dept</span>
                <div style={{ fontWeight: 900 }}>{result.member.studentId} • {result.member.dept}</div>
              </div>
              <div>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Tier Plan</span>
                <div style={{ fontWeight: 900 }}>{result.member.type}</div>
              </div>
              <div>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Expiration Date</span>
                <div style={{ fontWeight: 900 }}>{result.member.exp}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
