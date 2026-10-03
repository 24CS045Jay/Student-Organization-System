import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { inr } from '../../mock/db';
import { Gift, Plus, FileText, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

export const DonationsView = ({ session, activeClub, onDataChange, onToast }) => {
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState(null);

  const club = clubService.getClub(activeClub.id);
  const donations = club.donations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
          Donations Hub & 80G Tax Receipts (Item K)
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          Alumni contributions, campaign drives, and automated tax exemption receipts for {activeClub.name}.
        </p>
      </div>

      <div className="neo-table-container">
        <table className="neo-table">
          <thead>
            <tr>
              <th>Receipt Ref</th>
              <th>Donor Supporter</th>
              <th>Target Campaign</th>
              <th>Donation Amount</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((don) => (
              <tr key={don.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 900 }}>{don.receiptNo}</td>
                <td>
                  <div style={{ fontWeight: 900 }}>{don.donorName}</div>
                  {don.anonymous && <Badge variant="purple">Anonymous Wall</Badge>}
                </td>
                <td style={{ fontWeight: 800 }}>{don.campaign}</td>
                <td style={{ fontWeight: 900, color: '#059669', fontSize: '15px' }}>{inr(don.amount)}</td>
                <td>{don.date}</td>
                <td>
                  <Button variant="yellow" size="sm" onClick={() => setSelectedDonationForReceipt(don)} icon={FileText}>
                    Generate 80G Receipt
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedDonationForReceipt)}
        onClose={() => setSelectedDonationForReceipt(null)}
        title="📄 Official 80G Tax Exemption Receipt"
        headerColor="var(--accent-green)"
      >
        {selectedDonationForReceipt && (
          <div style={{ backgroundColor: '#FAF5EE', border: '2.5px solid #000', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0 }}>{activeClub.name}</h3>
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>Campus Student Activities Directorate</span>
              </div>
              <Badge variant="green">Receipt: {selectedDonationForReceipt.receiptNo}</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
              <div><strong>Donor:</strong> {selectedDonationForReceipt.donorName}</div>
              <div><strong>Amount Received:</strong> <span style={{ color: '#059669', fontWeight: 900 }}>{inr(selectedDonationForReceipt.amount)}</span></div>
              <div><strong>Campaign:</strong> {selectedDonationForReceipt.campaign}</div>
              <div><strong>Transaction Date:</strong> {selectedDonationForReceipt.date}</div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700, textAlign: 'center' }}>
              ⚡ Valid for Tax Exemption under Section 80G of the Income Tax Act.
            </p>

            <Button
              variant="black"
              style={{ width: '100%', marginTop: '14px' }}
              onClick={() => {
                setSelectedDonationForReceipt(null);
                if (onToast) onToast('📄 80G Tax Receipt PDF downloaded.');
              }}
            >
              Download PDF Copy
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
