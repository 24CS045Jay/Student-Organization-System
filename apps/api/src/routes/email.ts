import { Router } from 'express';
import { sendEmail } from '../services/emailService';

export const emailRouter = Router();

/**
 * 1. General Email Dispatch
 */
emailRouter.post('/send', async (req, res) => {
  const { to, subject, html, text } = req.body;
  if (!to || !subject) {
    return res.status(400).json({ success: false, error: 'Recipient "to" and "subject" are required.' });
  }

  const result = await sendEmail(to, subject, html || `<p>${text || subject}</p>`);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

/**
 * 2. Requirement 6: Test Route to verify email sending to a user-provided address
 * POST /api/v1/email/test
 * Body: { "to": "user@example.com" }
 */
emailRouter.post('/test', async (req, res) => {
  const { to } = req.body;
  if (!to) {
    return res.status(400).json({ success: false, error: 'Please provide recipient email address in "to".' });
  }

  const subject = '🚀 ClubSphere Email API Test';
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #121212; border-radius: 8px; background-color: #faf5ee;">
      <h2 style="color: #2563eb; margin-top: 0;">ClubSphere Real-Time Email API is Working!</h2>
      <p>Hello,</p>
      <p>This is a verification test sent via your configured Email API (Resend).</p>
      <div style="background-color: #ffffff; padding: 16px; border: 1px solid #e5e7eb; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Recipient:</strong> ${to}</p>
        <p style="margin: 0;"><strong>Sent At:</strong> ${new Date().toISOString()}</p>
        <p style="margin: 0;"><strong>Status:</strong> Authenticated & Delivered</p>
      </div>
      <p style="color: #6b7280; font-size: 13px;">If you see this email, your API key and sender configuration are operational.</p>
    </div>
  `;

  const result = await sendEmail(to, subject, htmlBody);
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json({ success: true, message: `Test email successfully sent to ${to}`, id: result.id });
});

/**
 * 3. Requirement 5 - Event Trigger: New Member Registration Credentials
 */
emailRouter.post('/register-credentials', async (req, res) => {
  const { to, memberName, clubName, clubEmail, initialPassword, role } = req.body;
  if (!to || !clubEmail) {
    return res.status(400).json({ success: false, error: 'Recipient "to" and "clubEmail" required.' });
  }

  const subject = `🎉 Welcome to ${clubName || 'the Club'}! Your Official Login Credentials`;
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; background-color: #FAF5EE; border: 2px solid #000; border-radius: 8px;">
      <h2>Welcome ${memberName || 'Member'}!</h2>
      <p>Your institutional club account for <strong>${clubName || 'ClubSphere'}</strong> has been created.</p>
      <div style="background-color: #FFF; padding: 15px; border: 2px solid #000; border-radius: 6px; margin: 15px 0;">
        <p><strong>Official Club Login Email:</strong> <code style="color: #2563EB; font-size: 16px;">${clubEmail}</code></p>
        <p><strong>Initial Password:</strong> <code>${initialPassword}</code></p>
        <p><strong>Role:</strong> ${(role || 'Member').toUpperCase()}</p>
      </div>
      <p>You can now sign in to the portal using these official credentials.</p>
    </div>
  `;

  const result = await sendEmail(to, subject, htmlBody);
  return res.json(result);
});

/**
 * 4. Requirement 5 - Event Trigger: Password Reset / Credential Recovery
 */
emailRouter.post('/password-reset', async (req, res) => {
  const { to, memberName, clubEmail, currentPassword, resetLink } = req.body;
  if (!to) {
    return res.status(400).json({ success: false, error: 'Recipient "to" required.' });
  }

  const subject = '🔐 ClubSphere Credentials & Password Recovery';
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; background-color: #FAF5EE; border: 2px solid #000; border-radius: 8px;">
      <h2>Hello ${memberName || 'there'},</h2>
      <p>Here are your official ClubSphere account details:</p>
      <div style="background-color: #FFF; padding: 15px; border: 2px solid #000; border-radius: 6px; margin: 15px 0;">
        <p><strong>Assigned Club Email:</strong> <code style="color: #2563EB; font-size: 16px;">${clubEmail || to}</code></p>
        ${currentPassword ? `<p><strong>Password:</strong> <code>${currentPassword}</code></p>` : ''}
        ${resetLink ? `<p><a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>` : ''}
      </div>
      <p>If you did not request this email, you can safely disregard it.</p>
    </div>
  `;

  const result = await sendEmail(to, subject, htmlBody);
  return res.json(result);
});

/**
 * 5. Requirement 5 - Event Trigger: Event Ticket Booking & QR Pass
 */
emailRouter.post('/ticket-confirmation', async (req, res) => {
  const { to, attendeeName, eventTitle, ticketId, seat, price } = req.body;
  if (!to || !eventTitle) {
    return res.status(400).json({ success: false, error: 'Missing required ticket details.' });
  }

  const subject = `🎟️ Confirmed: Your Pass for ${eventTitle} (${ticketId || 'PASS'})`;
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; padding: 20px; background-color: #FDF8F0; color: #121212; border: 2px solid #000; border-radius: 8px;">
      <h2 style="color: #FF70A6; margin-top: 0;">ClubSphere Event Ticket Pass</h2>
      <p>Hello <strong>${attendeeName || 'Attendee'}</strong>,</p>
      <p>Your registration for <strong>${eventTitle}</strong> is confirmed!</p>
      <div style="background: white; border: 2px solid black; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Ticket ID:</strong> ${ticketId || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Assigned Seat / Access:</strong> ${seat || 'General Admission'}</p>
        <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${price || 0}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> Confirmed & Verified</p>
      </div>
      <p>Present your digital pass or QR barcode at the registration desk for instantaneous check-in.</p>
    </div>
  `;

  const result = await sendEmail(to, subject, htmlBody);
  return res.json(result);
});
