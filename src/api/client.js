// Share the existing NATF request/authentication pipeline with every page.
// In particular, globalApi attaches the JWT stored in `meetingRoomAuthToken`
// and dispatches the same session-expired event for genuine HTTP 401 responses.
import { request } from '../routes/globalApi';

const send = async (method, path, payload) => {
  const options = { method };
  if (payload !== undefined) options.body = JSON.stringify(payload);
  const data = await request(`/api${path}`, options);
  // Keep the { data } response contract used by EmailManagementPage.
  return { data };
};

const api = {
  get: (path) => send('GET', path),
  post: (path, payload) => send('POST', path, payload),
  put: (path, payload) => send('PUT', path, payload),
  patch: (path, payload) => send('PATCH', path, payload),
  delete: (path) => send('DELETE', path),
};

export const errorMessage = (error) => error?.message || 'An unexpected error occurred.';
export default api;
