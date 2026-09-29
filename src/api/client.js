import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:8080/api',timeout:15000});
api.interceptors.request.use((config)=>{const token=localStorage.getItem('meeting_token');if(token) config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(r=>r,err=>{if(err.response?.status===401){localStorage.removeItem('meeting_token');localStorage.removeItem('meeting_user');if(location.pathname!=='/login') location.href='/login';}return Promise.reject(err);});
export const errorMessage=(err)=>err.response?.data?.message||err.message||'Có lỗi xảy ra';
export default api;
