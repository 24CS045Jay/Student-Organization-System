import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/index';
import { NeoQRCode } from '../../components/ui/QRCodeCard';
import { clubService } from '../../services/clubService';
import { Award, Plus, Download, CheckCircle2, QrCode, Sparkles } from 'lucide-react';

export const CertificatesView = ({ session, activeClub, onDataChange, onToast }) => {
  const [selectedCert, setSelectedCert] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    studentName: 'Diya Patel',
    studentId: '22CE045',
    eventName: 'CHARUSAT 24h Hackathon 2026',
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
              CHARUSAT UNIVERSITY • OFFICIAL CREDENTIAL
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
                setSelectedCert(null);
                if (onToast) onToast('📄 Certificate PDF downloaded.');
              }}
              icon={Download}
            >
              Download Printable Certificate
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
