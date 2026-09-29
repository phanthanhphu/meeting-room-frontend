import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Avatar, Badge, Box, Button, Collapse, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Menu, MenuItem, Stack, Toolbar, Tooltip, Typography, useMediaQuery, Snackbar, Alert
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MenuRounded from '@mui/icons-material/MenuRounded';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import SettingsSuggestOutlined from '@mui/icons-material/SettingsSuggestOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import logoYoungone from '../assets/svg/logos/logo-youngone.png';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

const DRAWER_WIDTH = 236;
const MINI_DRAWER_WIDTH = 68;
const HEADER_HEIGHT = 64;

function notificationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const items = [
  { title: 'Dashboard', path: '/dashboard', icon: DashboardOutlined, section: 'Overview' },
  { title: 'Meeting Rooms', path: '/rooms', icon: MeetingRoomOutlined, section: 'Booking' },
  { title: 'My Bookings', path: '/my-bookings', icon: EventNoteOutlined, section: 'Booking' },
  { title: 'Booking Calendar', path: '/calendar', icon: CalendarMonthOutlined, section: 'Booking' },
  { title: 'Approvals', path: '/approvals', icon: FactCheckOutlined, section: 'Management', roles: ['VIEWER', 'ROOM_MANAGER', 'ADMIN'] },
  { title: 'Room Management', path: '/room-management', icon: SettingsSuggestOutlined, section: 'Management', roles: ['VIEWER', 'ROOM_MANAGER', 'ADMIN'] },
  { title: 'User Management', path: '/users', icon: ManageAccountsOutlined, section: 'Management', roles: ['ADMIN'] },
  { title: 'Reports', path: '/reports', icon: AssessmentOutlined, section: 'Management', roles: ['VIEWER', 'ROOM_MANAGER', 'ADMIN'] }
];

const pageMeta = {
  '/dashboard': ['Dashboard', 'Meeting Room Overview'],
  '/rooms': ['Meeting Rooms', 'Booking Workspace'],
  '/my-bookings': ['My Bookings', 'Booking Workspace'],
  '/calendar': ['Booking Calendar', 'Booking Workspace'],
  '/approvals': ['Approvals', 'Room Management'],
  '/room-management': ['Room Management', 'Room Management'],
  '/users': ['User Management', 'Administration'],
  '/reports': ['Booking Reports', 'Room Management']
};

export default function DashboardLayout() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notification, clearNotification, appNotifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useAppData();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState(!downLG);
  const [managementOpen, setManagementOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerOpen = downLG ? mobileOpen : open;
  const meta = pageMeta[location.pathname] || ['Workspace', 'Meeting Room Booking'];
  const bookingItems = useMemo(() => items.filter((x) => x.section !== 'Management'), []);
  const managementItems = useMemo(() => items.filter((x) => x.section === 'Management' && x.roles?.includes(user?.role)), [user?.role]);

  const navItem = (item) => {
    const Icon = item.icon;
    const selected = location.pathname === item.path;
    return (
      <Tooltip key={item.path} title={!drawerOpen ? item.title : ''} placement="right">
        <ListItemButton
          component={NavLink}
          to={item.path}
          selected={selected}
          onClick={() => downLG && setMobileOpen(false)}
          sx={{
            minHeight: drawerOpen ? 40 : 44,
            px: drawerOpen ? 1.2 : 0.5,
            mx: drawerOpen ? 0.55 : 0.25,
            my: 0.12,
            borderRadius: drawerOpen ? 1.4 : 2,
            justifyContent: drawerOpen ? 'flex-start' : 'center',
            color: selected ? '#183658' : '#61758B',
            border: '1px solid transparent',
            '&:hover': { bgcolor: '#F4F7FA' },
            '&.Mui-selected': {
              bgcolor: drawerOpen ? '#EEF4FF' : 'transparent',
              borderColor: drawerOpen ? '#D7E4FF' : 'transparent',
              '&:hover': { bgcolor: '#EEF4FF' }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: drawerOpen ? 31 : 0, color: selected ? '#3F78FF' : '#61758B', justifyContent: 'center' }}>
            <Icon sx={{ fontSize: drawerOpen ? 19 : 21 }} />
          </ListItemIcon>
          {drawerOpen ? <ListItemText primary={item.title} primaryTypographyProps={{ noWrap: true, fontSize: '0.82rem', fontWeight: selected ? 700 : 650 }} /> : null}
        </ListItemButton>
      </Tooltip>
    );
  };

  const openNotification = async (item) => {
    if (!item.read) await markNotificationRead(item.id);
    setNotificationAnchorEl(null);
    if (item.actionPath) navigate(item.actionPath);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF', backgroundImage: 'linear-gradient(180deg,#FFFFFF 0%,#F8FAFC 100%)' }}>
      <Box sx={{ minHeight: 70, borderBottom: '1px solid #E8EEF5', display: 'flex', alignItems: 'center', px: drawerOpen ? 1.5 : 0, justifyContent: drawerOpen ? 'flex-start' : 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, minWidth: 0 }}>
          <Box component="img" src={logoYoungone} alt="Youngone" sx={{ width: drawerOpen ? 92 : 30, height: 'auto', opacity: 0.92, flexShrink: 0 }} />
          {drawerOpen ? (
            <Typography sx={{ maxWidth: 105, color: '#183658', fontSize: '0.72rem', lineHeight: 1.15, fontWeight: 700 }}>
              Meeting Room System
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: drawerOpen ? 0.75 : 0.45, py: drawerOpen ? 1 : 0.75 }}>
        {drawerOpen ? <Typography sx={{ px: 1.3, pt: 0.5, pb: 0.45, fontSize: '0.64rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.65 }}>Workspace</Typography> : null}
        <List disablePadding>{bookingItems.map(navItem)}</List>

        {managementItems.length ? <>
          <Divider sx={{ my: 0.9, borderColor: '#EDF2F7' }} />
          {drawerOpen ? (
            <ListItemButton onClick={() => setManagementOpen((v) => !v)} sx={{ minHeight: 36, mx: 0.55, px: 1.2, borderRadius: 1.4, color: '#61758B', '&:hover': { bgcolor: '#F4F7FA' } }}>
              <ListItemIcon sx={{ minWidth: 31, color: '#61758B' }}><SettingsSuggestOutlined sx={{ fontSize: 19 }} /></ListItemIcon>
              <ListItemText primary="Management" primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 700 }} />
              {managementOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
            </ListItemButton>
          ) : null}
          <Collapse in={!drawerOpen || managementOpen} timeout="auto" unmountOnExit={false}>
            <List disablePadding>{managementItems.map(navItem)}</List>
          </Collapse>
        </> : null}
      </Box>

      {drawerOpen ? (
        <Box sx={{ px: 1.4, py: 1.1, borderTop: '1px solid #E8EEF5' }}>
          <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 650 }}>Youngone Internal System</Typography>
        </Box>
      ) : null}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', bgcolor: '#F4F7FB' }}>
      {!downLG ? (
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
              overflowX: 'hidden',
              borderRight: '1px solid #E6EDF4',
              transition: theme.transitions.create('width', { duration: 180 }),
              boxShadow: '8px 0 24px rgba(24,54,84,.03)'
            }
          }}
        >{drawer}</Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: '1px solid #E6EDF4', borderTopRightRadius: 18, borderBottomRightRadius: 18 } }}
        >{drawer}</Drawer>
      )}

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          ml: downLG ? 0 : `${open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px`,
          width: downLG ? '100%' : `calc(100% - ${open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px)`,
          bgcolor: alpha('#FFFFFF', 0.98),
          color: '#2D4358',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #E8EEF5',
          boxShadow: '0 1px 0 rgba(15,23,42,.03)',
          transition: theme.transitions.create(['width', 'margin'], { duration: 180 })
        }}
      >
        <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important`, px: { xs: 1, sm: 1.5, lg: 2 }, gap: 1 }}>
          <IconButton onClick={() => downLG ? setMobileOpen(true) : setOpen((v) => !v)} sx={{ width: 36, height: 36, borderRadius: 2.5, color: '#61758B', bgcolor: '#F4F7FA', border: '1px solid #E3EAF2', '&:hover': { bgcolor: '#EEF3F7' } }}>
            <MenuRounded sx={{ fontSize: 20 }} />
          </IconButton>
          <Stack spacing={0.1} sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: '#183658', fontSize: '1rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta[0]}</Typography>
            <Typography sx={{ color: '#71849A', fontSize: '0.76rem', fontWeight: 600 }}>{meta[1]}</Typography>
          </Stack>
          <Tooltip title={unreadNotificationCount > 0 ? `${unreadNotificationCount} unread notification${unreadNotificationCount > 1 ? 's' : ''}` : 'Notifications'}>
            <IconButton
              onClick={(e) => setNotificationAnchorEl(e.currentTarget)}
              sx={{ width: 38, height: 38, borderRadius: 2.5, color: unreadNotificationCount > 0 ? '#245FB8' : '#61758B', bgcolor: unreadNotificationCount > 0 ? '#EEF4FF' : '#F7F9FC', border: '1px solid #E3EAF2', '&:hover': { bgcolor: '#EEF4FF' } }}
            >
              <Badge badgeContent={unreadNotificationCount} max={99} color="error" overlap="circular" sx={{ '& .MuiBadge-badge': { fontSize: '0.62rem', minWidth: 17, height: 17, px: 0.45, fontWeight: 800 } }}>
                <NotificationsNoneOutlined sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={() => setNotificationAnchorEl(null)}
            PaperProps={{ sx: { mt: 0.7, width: { xs: 330, sm: 390 }, maxWidth: 'calc(100vw - 20px)', maxHeight: 480, borderRadius: 2.5, border: '1px solid #E8EEF5', boxShadow: '0 20px 64px rgba(24,54,84,.16)', overflow: 'hidden' } }}
            MenuListProps={{ disablePadding: true }}
          >
            <Box sx={{ px: 1.7, py: 1.25, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #E8EEF5', bgcolor: '#FBFCFE' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#183658' }}>Notifications</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: '#71849A' }}>{unreadNotificationCount ? `${unreadNotificationCount} unread` : 'You are all caught up'}</Typography>
              </Box>
              <Button
                size="small"
                startIcon={<DoneAllRounded sx={{ fontSize: '16px !important' }} />}
                disabled={unreadNotificationCount === 0}
                onClick={(e) => { e.stopPropagation(); markAllNotificationsRead(); }}
                sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 750, minWidth: 0, px: 1 }}
              >Mark all read</Button>
            </Box>
            <Box sx={{ maxHeight: 405, overflowY: 'auto' }}>
              {appNotifications.length === 0 ? (
                <Box sx={{ px: 2, py: 4.5, textAlign: 'center' }}>
                  <NotificationsNoneOutlined sx={{ fontSize: 32, color: '#B4C0CD', mb: 0.7 }} />
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 750, color: '#52677D' }}>No notifications yet</Typography>
                  <Typography sx={{ fontSize: '0.67rem', color: '#8A9AAD', mt: 0.3 }}>Booking and system changes will appear here.</Typography>
                </Box>
              ) : appNotifications.map((item) => (
                <MenuItem
                  key={item.id}
                  onClick={() => openNotification(item)}
                  sx={{ alignItems: 'flex-start', whiteSpace: 'normal', gap: 1, py: 1.15, px: 1.5, borderBottom: '1px solid #F0F3F7', bgcolor: item.read ? '#FFFFFF' : '#F2F7FF', '&:hover': { bgcolor: item.read ? '#F8FAFC' : '#EAF2FF' } }}
                >
                  <Box sx={{ width: 8, pt: 0.7, flexShrink: 0 }}>
                    {!item.read ? <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#3F78FF' }} /> : null}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography sx={{ flex: 1, fontSize: '0.76rem', fontWeight: item.read ? 700 : 820, color: '#183658', lineHeight: 1.3 }}>{item.title}</Typography>
                      <Typography sx={{ fontSize: '0.61rem', color: '#94A3B8', flexShrink: 0 }}>{notificationTime(item.createdAt)}</Typography>
                    </Stack>
                    <Typography sx={{ mt: 0.25, fontSize: '0.69rem', color: '#60758A', lineHeight: 1.4 }}>{item.message}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Box>
          </Menu>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ width: 46, height: 46, p: 0.4, borderRadius: '50%' }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: '#EAF1FF', color: '#3F78FF', border: '2px solid #9EBBFF', fontSize: '0.82rem', fontWeight: 800 }}>{user?.initials || user?.fullName?.slice(0, 2).toUpperCase() || 'U'}</Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { mt: 0.6, minWidth: 220, borderRadius: 2, border: '1px solid #E8EEF5', boxShadow: '0 18px 60px rgba(24,54,84,.14)' } }}>
            <Box sx={{ px: 2, py: 1.3 }}><Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#183658' }}>{user?.fullName || 'User'}</Typography><Typography sx={{ fontSize: '0.7rem', color: '#71849A' }}>{user?.email || ''}</Typography><Typography sx={{ mt: .2, fontSize: '0.64rem', color: user?.role === 'ADMIN' ? '#7C3AED' : '#4680FF', fontWeight: 800 }}>{user?.role || 'USER'}</Typography></Box>
            <Divider />
            <MenuItem onClick={() => { logout(); setAnchorEl(null); navigate('/login', { replace: true }); }} sx={{ fontSize: '0.78rem', gap: 1 }}><LogoutOutlined sx={{ fontSize: 18 }} /> Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Snackbar open={Boolean(notification)} autoHideDuration={3200} onClose={clearNotification} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 6.5 }}>
        <Alert onClose={clearNotification} severity={notification?.severity || 'success'} variant="filled" sx={{ width: '100%', minWidth: 320 }}>
          {notification?.message || ''}
        </Alert>
      </Snackbar>

      <Box component="main" sx={{ flexGrow: 1, width: downLG ? '100%' : `calc(100% - ${open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px)`, p: { xs: 0.55, sm: 0.7, md: 0.85 }, transition: theme.transitions.create('width', { duration: 180 }) }}>
        <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important`, p: 0 }} />
        <Box sx={{ minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1 }}><Outlet /></Box>
          <Box sx={{ px: 0.8, py: 1.2, textAlign: 'center' }}><Typography sx={{ fontSize: '0.66rem', color: '#94A3B8' }}>Meeting Room Booking System</Typography></Box>
        </Box>
      </Box>
    </Box>
  );
}
