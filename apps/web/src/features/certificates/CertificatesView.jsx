import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/index';
import { NeoQRCode } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { Award, Plus, Download, CheckCircle2, QrCode, Sparkles, Trash2 } from 'lucide-react';

export const CertificatesView = ({ session, activeClub, onDataChange, onToast }) => {
  const [selectedCert, setSelectedCert] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const club = clubService.getClub(activeClub.id);
  const certificates = club.certificates || [];
  const members = club.members || [];
  const events = club.events || [];

  const [certForm, setCertForm] = useState({
    memberId: '',
    studentName: '',
    studentId: '',
    eventId: '',
    eventName: '',
    type: 'Certificate of Excellence'
  });

  const handleOpenGenerate = () => {
    const firstMember = members[0];
    const firstEvent = events[0];
    setCertForm({
      memberId: firstMember?.id || '',
      studentName: firstMember?.name || '',
      studentId: firstMember?.studentId || '24CS01',
      eventId: firstEvent?.id || '',
      eventName: firstEvent?.title || 'Annual Club Hackathon & Workshop',
      type: 'Certificate of Excellence'
    });
    setIsGenerateOpen(true);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!certForm.studentName.trim() || !certForm.eventName.trim()) {
      alert('Please provide the recipient name and event/milestone.');
      return;
    }
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

  const handleDeleteCert = (cert) => {
    if (!window.confirm(`Revoke / Delete certificate ${cert.id} issued to ${cert.studentName}?`)) return;
    try {
      clubService.deleteCertificate(activeClub.id, cert.id, session);
      if (onToast) onToast(`🗑️ Revoked certificate ${cert.id}`);
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
          <p>has successfully achieved distinction and verified participation in<br><strong>${cert.eventName}</strong></p>
          <div class="footer">
            <div class="sign-box">
              <div class="sign-title">${activeClub.name} Executive Board</div>
              <div class="sign-sub">Issued Date: ${cert.issueDate}</div>
            </div>
            <div class="hash-box">
              <div class="sign-title">Certificate ID: ${cert.id}</div>
              <div class="sign-sub">SHA-256 Authenticated</div>
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
          <Button variant="yellow" size="sm" onClick={handleOpenGenerate} icon={Plus}>
            Generate Verified Certificate
          </Button>
        )}
      </div>

      {certificates.length === 0 ? (
        <Card title="No Certificates Issued Yet" headerBg="var(--accent-purple)">
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                fontSize: '44px',
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                backgroundColor: '#EDE9FE',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000'
              }}
            >
              🎓
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0' }}>
              Zero Issued Credentials
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '420px' }}>
              Issue cryptographically verifiable certificates to event attendees, workshop winners, and core volunteers with instant scannable QR verification.
            </p>
            <Button variant="yellow" onClick={handleOpenGenerate} icon={Plus}>
              Issue First Certificate
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {certificates.map((cert) => (
            <Card
              key={cert.id}
              title={cert.type}
              headerBg="var(--accent-purple)"
              headerAction={
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Badge variant="green">Verified</Badge>
                  <Button
                    variant="white"
                    size="sm"
                    onClick={() => handleDeleteCert(cert)}
                    icon={Trash2}
                    title="Revoke Certificate"
                  />
                </div>
              }
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
      )}

      {/* Certificate Modal Diploma View */}
      <Modal
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        title="Official Verified Credential Diploma"
        headerColor="var(--accent-purple)"
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

      {/* Generate Certificate Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="🎓 Issue New Verified Certificate"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Select Student Recipient</label>
            {members.length > 0 && (
              <select
                value={certForm.memberId}
                onChange={(e) => {
                  const m = members.find(mem => mem.id === e.target.value);
                  setCertForm({
                    ...certForm,
                    memberId: e.target.value,
                    studentName: m ? m.name : certForm.studentName,
                    studentId: m ? m.studentId : certForm.studentId
                  });
                }}
                className="neo-input neo-select"
                style={{ marginBottom: '6px' }}
              >
                <option value="">Custom Recipient / Type Below</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.studentId} • {m.dept})
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              required
              placeholder="e.g. Neil Patel"
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
                placeholder="24CS01"
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
                <option value="Workshop Distinction">Workshop Distinction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="neo-label">Event / Milestone Achievement</label>
            {events.length > 0 && (
              <select
                value={certForm.eventId}
                onChange={(e) => {
                  const ev = events.find(event => event.id === e.target.value);
                  setCertForm({
                    ...certForm,
                    eventId: e.target.value,
                    eventName: ev ? ev.title : certForm.eventName
                  });
                }}
                className="neo-input neo-select"
                style={{ marginBottom: '6px' }}
              >
                <option value="">Custom Event / Type Below</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              required
              placeholder="e.g. Annual Web3 & AI Hackathon"
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
