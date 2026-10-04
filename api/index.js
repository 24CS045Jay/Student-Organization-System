import { Resend } from 'resend';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-org-id, x-org-role'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = req.url || '';

  // 1. Health check & Root Gateway Info
  if (url === '/api' || url === '/api/' || url === '/api/health' || url.includes('/health')) {
    return res.status(200).json({
      status: 'online',
      service: 'ClubSphere Campus OS — Serverless Gateway',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString()
    });
  }

  // 2. Resend Email Dispatch
  if (url.includes('/email/send') || url.includes('/email')) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { to, subject, html, text } = req.body || {};
    const apiKey = process.env.EMAIL_API_KEY || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM || process.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (!apiKey || apiKey === 'your_key_here') {
      return res.status(400).json({ success: false, error: 'Valid EMAIL_API_KEY is not configured in Vercel environment variables.' });
    }

    try {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: fromAddress.includes('<') ? fromAddress : `ClubSphere <${fromAddress}>`,
        to: Array.isArray(to) ? to : [to],
        subject: subject || 'ClubSphere Campus Notification',
        html: html || `<p>${text || subject}</p>`
      });

      return res.status(200).json({ success: true, id: result.data?.id || result.id });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 3. Fallback Response
  return res.status(200).json({
    name: 'ClubSphere API Serverless Gateway',
    status: 'online',
    timestamp: new Date().toISOString()
  });
}
