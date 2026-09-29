import React,{createContext,useContext,useMemo,useState} from 'react';
import api from '../api/client';
const AuthContext=createContext(null);
export function AuthProvider({children}){
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('meeting_user'))}catch{return null}});
  const login=async(username,password)=>{const {data}=await api.post('/auth/login',{username,password});localStorage.setItem('meeting_token',data.token);localStorage.setItem('meeting_user',JSON.stringify(data.user));setUser(data.user);return data.user;};
  const logout=()=>{localStorage.removeItem('meeting_token');localStorage.removeItem('meeting_user');setUser(null);};
  const value=useMemo(()=>({user,login,logout,isAdmin:user?.role==='ADMIN'}),[user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
