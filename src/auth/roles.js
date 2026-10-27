import { ROLES, ROLE_OPTIONS } from '../constants/access.js';
export { ROLES, ROLE_OPTIONS } from '../constants/access.js';

export const hasRole = (user, ...roles) => Boolean(user?.role && roles.includes(user.role));
export const canViewAllBookings = (user) => hasRole(user, ROLES.VIEWER, ROLES.ROOM_MANAGER, ROLES.ADMIN);
export const canManageBookings = (user) => hasRole(user, ROLES.ROOM_MANAGER, ROLES.ADMIN);
export const canManageRooms = (user) => hasRole(user, ROLES.ROOM_MANAGER, ROLES.ADMIN);
export const canManageUsers = (user) => hasRole(user, ROLES.ADMIN);
export const canCreateBooking = (user) => hasRole(user, ROLES.USER, ROLES.ROOM_MANAGER, ROLES.ADMIN);
export const isReadOnlyViewer = (user) => hasRole(user, ROLES.VIEWER);
