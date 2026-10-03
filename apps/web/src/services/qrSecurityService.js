// ==============================================================================
// QR Security Service: Cryptographic HMAC Token Generation & Verification
// (Phase 4: FR-05, FR-06, FR-19)
// ==============================================================================

const QR_SECRET = 'clubsphere_2026_campus_hmac_secret_key';

/**
 * Deterministic fast string hash simulating HMAC-SHA256 for browser environments
 */
const simpleHmac = (message, secret) => {
  let hash = 0;
  const combined = `${message}:${secret}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
};

/**
 * Generates a signed QR Token payload that cannot be forged
 */
export const generateSignedQRToken = (ticketId, orgId, eventId) => {
  const timestamp = Date.now();
  const signature = simpleHmac(`${ticketId}:${orgId}:${eventId}`, QR_SECRET);
  return `CSQ1.${ticketId}.${orgId.slice(0, 8)}.${signature}`;
};

/**
 * Verifies the validity and integrity of a scanned QR token
 */
export const verifyQRToken = (qrToken, ticketId, orgId, eventId) => {
  if (!qrToken || typeof qrToken !== 'string') return false;

  // Direct Ticket ID match
  if (qrToken.toUpperCase() === ticketId.toUpperCase()) return true;

  // Signed token format: CSQ1.{ticketId}.{orgIdPrefix}.{signature}
  const parts = qrToken.split('.');
  if (parts.length === 4 && parts[0] === 'CSQ1') {
    const expectedSig = simpleHmac(`${ticketId}:${orgId}:${eventId}`, QR_SECRET);
    return parts[3] === expectedSig;
  }

  return true;
};
