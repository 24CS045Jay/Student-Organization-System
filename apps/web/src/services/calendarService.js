// Calendar & Social Sharing Utilities for ClubSphere Events & Passes

/**
 * Format Date to ISO without hyphens/colons for calendar exports (YYYYMMDDTHHmmssZ)
 */
export const formatCalendarTime = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate Google Calendar Web URL
 */
export const getGoogleCalendarUrl = ({ title, description, location, date, time }) => {
  // Combine date and time
  let startDateTime = new Date();
  if (date) {
    const combinedStr = time ? `${date} ${time}` : date;
    const parsed = new Date(combinedStr);
    if (!isNaN(parsed.getTime())) {
      startDateTime = parsed;
    }
  }

  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
  const startStr = formatCalendarTime(startDateTime);
  const endStr = formatCalendarTime(endDateTime);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Campus Club Event',
    details: `${description || 'ClubSphere Campus Event'}\n\nVerified Campus Event Pass: ${window.location.origin}`,
    location: location || 'Campus Main Auditorium',
    dates: `${startStr}/${endStr}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Download universal .ics calendar file
 */
export const downloadIcsCalendarFile = ({ title, description, location, date, time, filename }) => {
  let startDateTime = new Date();
  if (date) {
    const combinedStr = time ? `${date} ${time}` : date;
    const parsed = new Date(combinedStr);
    if (!isNaN(parsed.getTime())) {
      startDateTime = parsed;
    }
  }

  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
  const startStr = formatCalendarTime(startDateTime);
  const endStr = formatCalendarTime(endDateTime);

  const cleanTitle = (title || 'ClubSphere Event').replace(/[,;\\]/g, ' ');
  const cleanDesc = (description || 'Campus Event').replace(/\n/g, '\\n').replace(/[,;\\]/g, ' ');
  const cleanLoc = (location || 'Campus Auditorium').replace(/[,;\\]/g, ' ');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClubSphere Campus OS//Student Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:clubsphere-${Date.now()}@campus.edu`,
    `DTSTAMP:${formatCalendarTime(new Date())}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${cleanLoc}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `${cleanTitle.toLowerCase().replace(/\s+/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Generate WhatsApp Share Link for Passes, Tickets, and Certificates
 */
export const getWhatsAppShareUrl = ({ title, subtitle, refId, url }) => {
  const verifyLink = url || (typeof window !== 'undefined' ? `${window.location.origin}/?verify=${encodeURIComponent(refId || '')}` : '');
  
  const message = `🎟️ *ClubSphere Pass / Verified Credential*\n\n` +
    `📌 *${title || 'Campus Pass'}*\n` +
    (subtitle ? `ℹ️ ${subtitle}\n` : '') +
    (refId ? `🆔 Reference ID: \`${refId}\`\n` : '') +
    `\n⚡ *Verify & Check-in online:* \n${verifyLink}`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
};

/**
 * Generate LinkedIn Share Link for Certificates
 */
export const getLinkedInShareUrl = ({ title, summary, url }) => {
  const params = new URLSearchParams({
    url: url || window.location.href,
    title: title || 'Official Campus Certificate',
    summary: summary || 'Earned distinction through ClubSphere Campus Organization'
  });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
};
