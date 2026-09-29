import { RUNTIME_NETWORK } from '../config/network.js';

export const API_BASE_URL = RUNTIME_NETWORK.apiBaseUrl;
export const APP_EVENT_WS_URL = RUNTIME_NETWORK.appEventWsUrl;
const TOKEN_KEY = 'meetingRoomAuthToken';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = authStorage.getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    authStorage.clear();
    window.dispatchEvent(new CustomEvent('meeting-room:unauthorized'));
  }

  if (!response.ok) {
    let payload = null;
    try { payload = await response.json(); } catch { /* no json body */ }
    const detailText = Array.isArray(payload?.details) && payload.details.length ? `: ${payload.details.join('; ')}` : '';
    const error = new Error(`${payload?.message || `Request failed (${response.status})`}${detailText}`);
    error.status = response.status;
    error.code = payload?.code || 'HTTP_ERROR';
    error.details = payload?.details || [];
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const jsonBody = (value) => JSON.stringify(value);

export const globalApi = {
  auth: {
    login: (identifier, password, loginType = 'DOMAIN') => request('/api/auth/login', { method: 'POST', body: jsonBody({ loginType, identifier, username: identifier, password }) }),
    me: () => request('/api/auth/me')
  },
  rooms: {
    list: () => request('/api/rooms'),
    create: (payload) => request('/api/rooms', { method: 'POST', body: jsonBody(payload) }),
    update: (id, payload) => request(`/api/rooms/${id}`, { method: 'PUT', body: jsonBody(payload) }),
    delete: (id) => request(`/api/rooms/${id}`, { method: 'DELETE' })
  },
  bookings: {
    mine: () => request('/api/bookings/mine'),
    get: (id) => request(`/api/bookings/${id}`),
    calendar: (from, to) => request(`/api/bookings/calendar/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    create: (payload) => request('/api/bookings', { method: 'POST', body: jsonBody(payload) }),
    update: (id, payload) => request(`/api/bookings/${id}`, { method: 'PUT', body: jsonBody(payload) }),
    cancel: (id) => request(`/api/bookings/${id}/cancel`, { method: 'PATCH' }),
    delete: (id) => request(`/api/bookings/${id}`, { method: 'DELETE' }),
    history: (id) => request(`/api/bookings/${id}/history`)
  },
  admin: {
    bookings: {
      all: () => request('/api/admin/bookings'),
      pending: () => request('/api/admin/bookings/pending'),
      approve: (id) => request(`/api/admin/bookings/${id}/approve`, { method: 'PATCH' }),
      reject: (id, reason) => request(`/api/admin/bookings/${id}/reject`, { method: 'PATCH', body: jsonBody({ reason }) }),
      cancel: (id) => request(`/api/admin/bookings/${id}/cancel`, { method: 'PATCH' }),
      delete: (id) => request(`/api/admin/bookings/${id}`, { method: 'DELETE' }),
      report: ({ from = '', to = '', roomId = '', userId = '', status = '' } = {}) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (roomId) params.set('roomId', roomId);
        if (userId) params.set('userId', userId);
        if (status) params.set('status', status);
        return request(`/api/admin/bookings/report?${params.toString()}`);
      }
    },
    users: {
      list: () => request('/api/admin/users'),
      create: (payload) => request('/api/admin/users', { method: 'POST', body: jsonBody(payload) }),
      update: (id, payload) => request(`/api/admin/users/${id}`, { method: 'PUT', body: jsonBody(payload) }),
      setEnabled: (id, enabled) => request(`/api/admin/users/${id}/enabled`, { method: 'PATCH', body: jsonBody({ enabled }) }),
      resetPassword: (id) => request(`/api/admin/users/${id}/reset-password`, { method: 'POST' }),
      delete: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' })
    }
  },
  notifications: {
    list: () => request('/api/notifications'),
    unreadCount: () => request('/api/notifications/unread-count'),
    markRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/api/notifications/read-all', { method: 'PATCH' })
  },
  dashboard: {
    summary: () => request('/api/dashboard/summary')
  }
};

export default globalApi;
