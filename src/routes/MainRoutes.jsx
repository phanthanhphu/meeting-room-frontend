import { Navigate, Route } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import DashboardPage from '../pages/DashboardPage';
import RoomsPage from '../pages/RoomsPage';
import MyBookingsPage from '../pages/MyBookingsPage';
import CalendarPage from '../pages/CalendarPage';
import ApprovalsPage from '../pages/ApprovalsPage';
import RoomManagementPage from '../pages/RoomManagementPage';
import UserManagementPage from '../pages/UserManagementPage';
import ReportsPage from '../pages/ReportsPage';
import { RequireAdmin, RequireAuth, RequireRoles } from '../components/RequireRole';

export default function MainRoutes() {
  return <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
    <Route index element={<Navigate to="/dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="rooms" element={<RoomsPage />} />
    <Route path="my-bookings" element={<MyBookingsPage />} />
    <Route path="calendar" element={<CalendarPage />} />
    <Route path="approvals" element={<RequireRoles roles={['VIEWER', 'ROOM_MANAGER', 'ADMIN']}><ApprovalsPage /></RequireRoles>} />
    <Route path="room-management" element={<RequireRoles roles={['VIEWER', 'ROOM_MANAGER', 'ADMIN']}><RoomManagementPage /></RequireRoles>} />
    <Route path="users" element={<RequireAdmin><UserManagementPage /></RequireAdmin>} />
    <Route path="reports" element={<RequireRoles roles={['VIEWER', 'ROOM_MANAGER', 'ADMIN']}><ReportsPage /></RequireRoles>} />
  </Route>;
}
