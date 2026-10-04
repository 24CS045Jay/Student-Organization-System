export const apiClient = {
  baseUrl: import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/api/v1' : 'http://localhost:3000/api/v1'),
  
  async request(endpoint, options = {}) {
    // Attempt to get token from local storage session
    let token = '';
    try {
      const session = JSON.parse(localStorage.getItem('clubsphere_session') || '{}');
      // For now, we simulate a token using the user's role and orgId
      if (session.orgId && session.role) {
        token = `${session.role}:${session.orgId}`; 
      }
    } catch(e) {}

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'x-org-id': (() => {
        try {
          const session = JSON.parse(localStorage.getItem('clubsphere_session') || '{}');
          return session.orgId || 'tech';
        } catch(e) { return 'tech'; }
      })(),
      'x-org-role': (() => {
        try {
          const session = JSON.parse(localStorage.getItem('clubsphere_session') || '{}');
          return session.role || 'student';
        } catch(e) { return 'student'; }
      })(),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  },

  get(endpoint, options) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  post(endpoint, body, options) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options });
  }
};
