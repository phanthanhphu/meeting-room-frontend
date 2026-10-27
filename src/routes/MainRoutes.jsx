import { ACCESS_ROLES, ROLES } from '../constants/access.js';
import { Navigate, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';
import DashboardPage from '../pages/DashboardPage';
import RoomsPage from '../pages/RoomsPage';
import MyBookingsPage from '../pages/MyBookingsPage';
import CalendarPage from '../pages/CalendarPage';
import ApprovalsPage from '../pages/ApprovalsPage';
import RoomManagementPage from '../pages/RoomManagementPage';
import EquipmentManagementPage from '../pages/EquipmentManagementPage';
import UserManagementPage from '../pages/UserManagementPage';
import ReportsPage from '../pages/ReportsPage';
import { RequireAdmin, RequireAuth, RequireRoles } from '../components/RequireRole';

function LandingRoute() {
  const { user } = useAuth();
  return <Navigate to={user?.role === ROLES.ADMIN ? '/dashboard' : '/rooms'} replace />;
}

export default function MainRoutes() {
  return <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
    <Route index element={<LandingRoute />} />
    <Route path="dashboard" element={<RequireRoles roles={ACCESS_ROLES.DASHBOARD}><DashboardPage /></RequireRoles>} />
    <Route path="rooms" element={<RoomsPage />} />
    <Route path="my-bookings" element={<MyBookingsPage />} />
    <Route path="calendar" element={<CalendarPage />} />
    <Route path="approvals" element={<RequireRoles roles={ACCESS_ROLES.MANAGEMENT}><ApprovalsPage /></RequireRoles>} />
    <Route path="room-management" element={<RequireRoles roles={ACCESS_ROLES.MANAGEMENT}><RoomManagementPage /></RequireRoles>} />
    <Route path="equipment-management" element={<RequireRoles roles={ACCESS_ROLES.MANAGEMENT}><EquipmentManagementPage /></RequireRoles>} />
    <Route path="users" element={<RequireAdmin><UserManagementPage /></RequireAdmin>} />
    <Route path="reports" element={<RequireRoles roles={ACCESS_ROLES.MANAGEMENT}><ReportsPage /></RequireRoles>} />
  </Route>;
}
