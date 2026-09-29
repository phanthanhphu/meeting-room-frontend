import React from 'react';
import { Navigate,Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
export function RequireAuth(){const {user}=useAuth();return user?<Outlet/>:<Navigate to="/login" replace/>;}
export function RequireAdmin(){const {user,isAdmin}=useAuth();if(!user)return <Navigate to="/login" replace/>;return isAdmin?<Outlet/>:<Navigate to="/dashboard" replace/>;}
