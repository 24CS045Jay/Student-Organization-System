// ==============================================================================
// Notification Service: In-App Alerts, Unread Badges & Broadcasts (Phase 5)
// ==============================================================================

const STORAGE_KEY = 'clubsphere_notifications_store';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    orgId: 'club-tech',
    type: 'announcement',
    title: '📢 Hackathon Registrations Open',
    body: 'Early bird registration is now live for all technical club members.',
    read: false,
    timestamp: '10m ago'
  },
  {
    id: 'notif-2',
    orgId: 'club-tech',
    type: 'ticket',
    title: '🎟️ Pass Confirmed: AI Workshop',
    body: 'Your VIP pass #TKT-TC-9102 has been generated and stamped.',
    read: false,
    timestamp: '1h ago'
  }
];

class NotificationService {
  constructor() {
    this.listeners = new Set();
    this.notifications = this.loadNotifications();
  }

  loadNotifications() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
      this.notify();
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }

  getNotifications(orgId) {
    if (!orgId) return this.notifications;
    return this.notifications.filter(n => !n.orgId || n.orgId === orgId);
  }

  getUnreadCount(orgId) {
    return this.getNotifications(orgId).filter(n => !n.read).length;
  }

  addNotification({ orgId, type = 'announcement', title, body }) {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orgId,
      type,
      title,
      body,
      read: false,
      timestamp: 'Just now'
    };
    this.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  markAllAsRead(orgId) {
    this.notifications = this.notifications.map(n => {
      if (!orgId || n.orgId === orgId) {
        return { ...n, read: true };
      }
      return n;
    });
    this.save();
  }

  markAsRead(id) {
    const item = this.notifications.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.save();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.notifications);
    }
  }
}

export const notificationService = new NotificationService();
