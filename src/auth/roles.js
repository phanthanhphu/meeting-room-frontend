export const ROLES = {
  USER: 'USER',
  VIEWER: 'VIEWER',
  ROOM_MANAGER: 'ROOM_MANAGER',
  ADMIN: 'ADMIN'
};

export const ROLE_OPTIONS = [
  { value: ROLES.USER, label: 'USER - Normal User' },
  { value: ROLES.VIEWER, label: 'VIEWER - View All (Read Only)' },
  { value: ROLES.ROOM_MANAGER, label: 'ROOM_MANAGER - Room Manager' },
  { value: ROLES.ADMIN, label: 'ADMIN - Full Access' }
];

export const hasRole = (user, ...roles) => Boolean(user?.role && roles.includes(user.role));
export const canViewAllBookings = (user) => hasRole(user, ROLES.VIEWER, ROLES.ROOM_MANAGER, ROLES.ADMIN);
export const canManageBookings = (user) => hasRole(user, ROLES.ROOM_MANAGER, ROLES.ADMIN);
export const canManageRooms = (user) => hasRole(user, ROLES.ROOM_MANAGER, ROLES.ADMIN);
export const canManageUsers = (user) => hasRole(user, ROLES.ADMIN);
export const canCreateBooking = (user) => hasRole(user, ROLES.USER, ROLES.ROOM_MANAGER, ROLES.ADMIN);
export const isReadOnlyViewer = (user) => hasRole(user, ROLES.VIEWER);
