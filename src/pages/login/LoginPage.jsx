import React,{useState} from 'react';
import {Alert,Box,Button,Card,CardContent,CircularProgress,TextField,Typography} from '@mui/material';
import {MeetingRoomOutlined} from '@mui/icons-material';
import {Navigate,useNavigate} from 'react-router-dom';
import {useAuth} from '../../auth/AuthContext';
import {errorMessage} from '../../api/client';
export default function LoginPage(){
 const {user,login}=useAuth();const navigate=useNavigate();const [form,setForm]=useState({username:'admin',password:'admin123'});const [error,setError]=useState('');const [loading,setLoading]=useState(false);
 if(user)return <Navigate to="/dashboard" replace/>;
 const submit=async e=>{e.preventDefault();setError('');setLoading(true);try{await login(form.username,form.password);navigate('/dashboard');}catch(e){setError(errorMessage(e));}finally{setLoading(false)}};
 return <Box sx={{minHeight:'100vh',display:'grid',placeItems:'center',p:2,background:'radial-gradient(circle at 15% 20%,rgba(22,119,255,.35),transparent 28%),radial-gradient(circle at 80% 80%,rgba(19,168,168,.28),transparent 28%),linear-gradient(135deg,#0b1f33,#173b5e)'}}>
  <Card sx={{width:'100%',maxWidth:430,border:0,boxShadow:'0 28px 80px rgba(0,0,0,.25)'}}><CardContent sx={{p:{xs:3,md:5}}}><Box sx={{display:'flex',alignItems:'center',gap:1.5,mb:4}}><Box sx={{width:48,height:48,borderRadius:2,bgcolor:'primary.main',color:'#fff',display:'grid',placeItems:'center'}}><MeetingRoomOutlined/></Box><Box><Typography variant="h5">Meeting Room</Typography><Typography color="text.secondary" fontSize={13}>Booking & Approval System</Typography></Box></Box>
  {error&&<Alert severity="error" sx={{mb:2}}>{error}</Alert>}<Box component="form" onSubmit={submit}><TextField fullWidth label="Username / Email" margin="normal" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/><TextField fullWidth label="Password" type="password" margin="normal" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><Button fullWidth size="large" type="submit" variant="contained" sx={{mt:3,height:48}} disabled={loading}>{loading?<CircularProgress size={22} color="inherit"/>:'Sign in'}</Button></Box><Box sx={{mt:3,p:2,bgcolor:'#f8fafc',borderRadius:2}}><Typography variant="caption" color="text.secondary">Demo: admin / admin123 &nbsp; | &nbsp; user / user123</Typography></Box></CardContent></Card>
 </Box>}
