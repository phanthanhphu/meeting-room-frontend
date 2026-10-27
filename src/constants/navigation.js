import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import SettingsSuggestOutlined from '@mui/icons-material/SettingsSuggestOutlined';
import DevicesOtherOutlined from '@mui/icons-material/DevicesOtherOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import { ACCESS_ROLES } from './access.js';

export const NAV_ITEMS = Object.freeze([
  { title: 'Dashboard', path: '/dashboard', icon: DashboardOutlined, section: 'Management', roles: ACCESS_ROLES.DASHBOARD },
  { title: 'Meeting Rooms', path: '/rooms', icon: MeetingRoomOutlined, section: 'Booking' },
  { title: 'My Bookings', path: '/my-bookings', icon: EventNoteOutlined, section: 'Booking' },
  { title: 'Booking Calendar', path: '/calendar', icon: CalendarMonthOutlined, section: 'Booking' },
  { title: 'Approvals', path: '/approvals', icon: FactCheckOutlined, section: 'Management', roles: ACCESS_ROLES.MANAGEMENT },
  { title: 'Room Management', path: '/room-management', icon: SettingsSuggestOutlined, section: 'Management', roles: ACCESS_ROLES.MANAGEMENT },
  { title: 'Equipment Catalog', path: '/equipment-management', icon: DevicesOtherOutlined, section: 'Management', roles: ACCESS_ROLES.MANAGEMENT },
  { title: 'User Management', path: '/users', icon: ManageAccountsOutlined, section: 'Admin', roles: ACCESS_ROLES.USERS },
  { title: 'Reports', path: '/reports', icon: AssessmentOutlined, section: 'Management', roles: ACCESS_ROLES.MANAGEMENT }
]);

export const PAGE_META = Object.freeze({
  '/dashboard': ['Dashboard', 'Meeting Room Overview'],
  '/rooms': ['Meeting Rooms', 'Booking Workspace'],
  '/my-bookings': ['My Bookings', 'Booking Workspace'],
  '/calendar': ['Booking Calendar', 'Booking Workspace'],
  '/approvals': ['Approvals', 'Room Management'],
  '/room-management': ['Room Management', 'Administration'],
  '/equipment-management': ['Equipment Catalog', 'Administration'],
  '/users': ['User Management', 'Administration'],
  '/reports': ['Booking Reports', 'Room Management']
});
