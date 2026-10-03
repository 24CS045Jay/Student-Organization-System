import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/index';
import { NeoQRCode } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { Award, Plus, Download, CheckCircle2, QrCode, Sparkles } from 'lucide-react';

export const CertificatesView = ({ session, activeClub, onDataChange, onToast }) => {
  const [selectedCert, setSelectedCert] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    studentName: 'Student Member',
    studentId: '24CS01',
    eventName: 'Annual Hackathon & Summit',
    type: 'Certificate of Excellence'
  });

  const club = clubService.getClub(activeClub.id);
  const certificates = club.certificates || [];

  const handleGenerate = (e) => {
    e.preventDefault();
    try {
      const newCert = clubService.generateCertificate(activeClub.id, certForm, session);
      setIsGenerateOpen(false);
      setSelectedCert(newCert);
      if (onToast) onToast(`🎖️ Issued ${newCert.id} to ${newCert.studentName}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrintCertificate = (cert) => {
    if (!cert) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print/download the certificate.');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${cert.studentName} - ${cert.id}</title>
        <style>
          @page { size: landscape; margin: 15mm; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #FAF5EE;
            margin: 0;
            padding: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 90vh;
          }
          .cert-container {
            border: 6px solid #121212;
            padding: 50px 60px;
            max-width: 880px;
            width: 100%;
            background: #FFFFFF;
            box-shadow: 10px 10px 0px #121212;
            border-radius: 20px;
            text-align: center;
            box-sizing: border-box;
          }
          .badge {
            display: inline-block;
            background: #121212;
            color: #FFFFFF;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 2px;
            padding: 6px 18px;
            border-radius: 999px;
            margin-bottom: 20px;
          }
          h2 { font-size: 26px; font-weight: 900; color: #7C3AED; margin: 0 0 14px; text-transform: uppercase; }
          p { font-size: 15px; color: #52525B; font-weight: 600; line-height: 1.6; margin: 10px 0; }
          .recipient { font-size: 36px; font-weight: 900; color: #121212; text-decoration: underline; margin: 16px 0; }
          .footer {
            margin-top: 36px;
            border-top: 2px dashed #121212;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .sign-box { text-align: left; }
          .sign-title { font-weight: 900; font-size: 15px; }
          .sign-sub { font-size: 12px; color: #71717A; }
          .hash-box { text-align: right; }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="badge">CAMPUS STUDENT ACTIVITIES • VERIFIED CREDENTIAL</div>
          <h2>${cert.type}</h2>
          <p>This certifies that</p>
          <div class="recipient">${cert.studentName}</div>
          <p>has successfully participated and achieved distinction in <strong>${cert.eventName}</strong> organized by ${activeClub.name}.</p>
          <div class="footer">
            <div class="sign-box">
              <div class="sign-title">Club Executive Directorate</div>
              <div class="sign-sub">Authorized Institutional Signatory</div>
              <div class="sign-sub" style="margin-top:4px;">Credential ID: ${cert.id}</div>
            </div>
            <div class="hash-box">
              <div class="sign-title">Issued: ${cert.issueDate}</div>
              <div class="sign-sub">Cryptographic Token: ${cert.qrCode ? cert.qrCode.substring(0, 22) + '...' : 'VERIFIED'}</div>
              <div class="sign-sub" style="color: #059669; font-weight: 800; margin-top:4px;">✓ Authenticity Verified</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    if (onToast) onToast(`📄 Generating high-res certificate for ${cert.studentName}...`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Verified Digital Certificates Hub (Item L)
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Attendance-verified credentials with instant tamper-proof QR verification for {activeClub.name}.
          </p>
        </div>
        {session.role !== 'student' && (
          <Button variant="yellow" size="sm" onClick={() => setIsGenerateOpen(true)} icon={Plus}>
            Generate Verified Certificate
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {certificates.map((cert) => (
          <Card
            key={cert.id}
            title={cert.type}
            headerBg="var(--accent-purple)"
            headerAction={<Badge variant="green">Verified</Badge>}
          >
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px' }}>{cert.studentName}</h3>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '14px' }}>
                ID: {cert.studentId} • {cert.eventName}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <NeoQRCode code={cert.qrCode} size={110} />
              </div>

              <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--ink-muted)', marginBottom: '16px' }}>
                Ref: {cert.id} • Issued: {cert.issueDate}
              </div>

              <Button variant="black" size="sm" style={{ width: '100%' }} onClick={() => setSelectedCert(cert)} icon={Award}>
                View Certificate Diploma
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Certificate Modal Diploma View */}
      <Modal
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        title="🎓 Verified Certificate Diploma"
        maxWidth="680px"
        headerColor="var(--accent-yellow)"
      >
        {selectedCert && (
          <div
            style={{
              padding: '30px',
              backgroundColor: '#FFFFFF',
              border: '3.5px solid #121212',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '6px 6px 0px #121212',
              position: 'relative'
            }}
          >
            <Badge variant="black" style={{ marginBottom: '14px' }}>
              CAMPUS STUDENT ACTIVITIES • VERIFIED CREDENTIAL
            </Badge>

            <h2 style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'var(--font-heading)', margin: '4px 0 10px' }}>
              {selectedCert.type}
            </h2>

            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
              This certifies that
            </p>

            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#121212', margin: '8px 0' }}>
              {selectedCert.studentName}
            </h1>

            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '440px', margin: '0 auto 16px' }}>
              has successfully participated and achieved distinction in <strong>{selectedCert.eventName}</strong> organized by {activeClub.name}.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '2px dashed #121212', paddingTop: '18px', marginTop: '18px' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>Club Executive Chair</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>Authorized Signatory</div>
              </div>

              <NeoQRCode code={selectedCert.qrCode} size={90} />

              <div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>{selectedCert.issueDate}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>Cryptographic Hash</div>
              </div>
            </div>

            <Button
              variant="yellow"
              style={{ width: '100%', marginTop: '20px' }}
              onClick={() => {
                handlePrintCertificate(selectedCert);
                setSelectedCert(null);
              }}
              icon={Download}
            >
              Download / Print Official Certificate
            </Button>
          </div>
        )}
      </Modal>

      {/* Generate Certificate Drawer */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="🎓 Issue New Verified Certificate"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Student Name *</label>
            <input
              type="text"
              required
              value={certForm.studentName}
              onChange={(e) => setCertForm({ ...certForm, studentName: e.target.value })}
              className="neo-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Student ID Roll No</label>
              <input
                type="text"
                value={certForm.studentId}
                onChange={(e) => setCertForm({ ...certForm, studentId: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Certificate Type</label>
              <select
                value={certForm.type}
                onChange={(e) => setCertForm({ ...certForm, type: e.target.value })}
                className="neo-input neo-select"
              >
                <option value="Certificate of Excellence">Certificate of Excellence</option>
                <option value="Certificate of Completion">Certificate of Completion</option>
                <option value="Volunteer Service Award">Volunteer Service Award</option>
              </select>
            </div>
          </div>

          <div>
            <label className="neo-label">Event / Milestone</label>
            <input
              type="text"
              value={certForm.eventName}
              onChange={(e) => setCertForm({ ...certForm, eventName: e.target.value })}
              className="neo-input"
            />
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '8px' }}>
            Issue & Generate QR Hash Code
          </Button>
        </form>
      </Modal>
    </div>
  );
};
