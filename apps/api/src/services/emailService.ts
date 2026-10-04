import fs from 'fs';
import path from 'path';

/**
 * Safely resolves an environment variable from process.env or the root .env file
 * Never logs or prints secrets.
 */
function getEnvVar(name: string): string {
  if (process.env[name]) {
    return process.env[name]!.trim();
  }
  try {
    const envPath = path.resolve(__dirname, '../../../../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const regex = new RegExp(`^${name}=["']?([^"'\\r\\n]+)["']?`, 'm');
      const match = content.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {
    // Fail silently without leaking filesystem or secret info
  }
  return '';
}

export interface SendEmailResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Reusable function to send real-time transactional/broadcast emails via Email API (Resend)
 * - Reads EMAIL_API_KEY and EMAIL_FROM strictly from environment variables
 * - Never prints or leaks secrets/API keys
 * - Immediate execution with safe error logging
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  htmlBody: string
): Promise<SendEmailResponse> {
  const apiKey = getEnvVar('EMAIL_API_KEY') || getEnvVar('VITE_RESEND_API_KEY');
  const fromAddress = getEnvVar('EMAIL_FROM') || 'onboarding@resend.dev';

  if (!apiKey || apiKey === 'your_key_here' || apiKey === 're_12345678') {
    const safeMsg = 'Email dispatch skipped: Valid EMAIL_API_KEY is not configured in .env';
    console.warn(`[EmailService] ${safeMsg}`);
    return { success: false, error: safeMsg };
  }

  const recipients = Array.isArray(to) ? to : [to];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress.includes('<') ? fromAddress : `ClubSphere <${fromAddress}>`,
        to: recipients,
        subject,
        html: htmlBody
      })
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Safe logging: log status and sanitized message, never header or token
      const safeErrorMsg = data?.message || `HTTP ${response.status} ${response.statusText}`;
      console.error(`[EmailService] Failed to deliver email to recipient(s). Reason: ${safeErrorMsg}`);
      return { success: false, error: safeErrorMsg };
    }

    console.log(`[EmailService] Email delivered successfully. Resend Message ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    // Safe catch: never log request headers
    const safeErrorMsg = err?.message || 'Network error communicating with Email API provider';
    console.error(`[EmailService] Exception during email delivery: ${safeErrorMsg}`);
    return { success: false, error: safeErrorMsg };
  }
}
