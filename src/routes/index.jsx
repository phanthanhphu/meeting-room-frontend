import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import MainRoutes from './MainRoutes';

export default function AppRoutes() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    {MainRoutes()}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
