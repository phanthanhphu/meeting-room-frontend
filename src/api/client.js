import axios from 'axios';
import { RUNTIME_NETWORK } from '../config/network.js';

const api = axios.create({
  baseURL: RUNTIME_NETWORK.apiUrl,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('meeting_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('meeting_token');
      localStorage.removeItem('meeting_user');
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) => err.response?.data?.message || err.message || 'Có lỗi xảy ra';
export default api;
