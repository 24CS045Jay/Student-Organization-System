#!/usr/bin/env node
/**
 * Test script for Real-Time Email API integration (Resend)
 * Usage: node scripts/test-email.js <recipient_email>
 * Example: node scripts/test-email.js user@example.com
 */

const fs = require('fs');
const path = require('path');

function getEnvVar(name) {
  if (process.env[name]) return process.env[name].trim();
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const regex = new RegExp(`^${name}=["']?([^"'\\r\\n]+)["']?`, 'm');
      const match = content.match(regex);
      if (match && match[1]) return match[1].trim();
    }
  } catch {}
  return '';
}

async function runTest() {
  const recipient = process.argv[2];

  if (!recipient || !recipient.includes('@')) {
    console.error('Usage: node scripts/test-email.js <recipient_email>');
    console.error('Example: node scripts/test-email.js user@example.com');
    process.exit(1);
  }

  const apiKey = getEnvVar('EMAIL_API_KEY') || getEnvVar('VITE_RESEND_API_KEY');
  const fromEmail = getEnvVar('EMAIL_FROM') || 'onboarding@resend.dev';

  if (!apiKey || apiKey === 'your_key_here' || apiKey === 're_12345678') {
    console.error('❌ Error: EMAIL_API_KEY is not configured in your local .env file.');
    console.error('Please open .env and set EMAIL_API_KEY="re_your_actual_key_here"');
    process.exit(1);
  }

  console.log(`📡 Sending test email to: ${recipient}...`);
  console.log(`📨 From sender: ${fromEmail}`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail.includes('<') ? fromEmail : `ClubSphere <${fromEmail}>`,
        to: [recipient],
        subject: '🧪 ClubSphere Email API Test Delivery',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 2px solid #111; border-radius: 8px; background: #fff;">
            <h2 style="color: #2563eb;">✅ Real-Time Email API Test Successful!</h2>
            <p>Your email API service is properly configured and sending emails in real-time.</p>
            <div style="background: #f3f4f6; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipient}</p>
              <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Sent via ClubSphere Email Service.</p>
          </div>
        `
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`❌ Dispatch Failed: ${data.message || 'Provider rejected request'}`);
      process.exit(1);
    }

    console.log(`✅ Success! Email delivered to ${recipient}.`);
    console.log(`🆔 Provider Message ID: ${data.id}`);
  } catch (err) {
    console.error(`❌ Exception: ${err.message || 'Network failure'}`);
    process.exit(1);
  }
}

runTest();
