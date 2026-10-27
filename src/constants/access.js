// Centralized roles and UI access groups. Backend authorization remains authoritative.
export const ROLES = Object.freeze({
  USER: 'USER', VIEWER: 'VIEWER', ROOM_MANAGER: 'ROOM_MANAGER', ADMIN: 'ADMIN'
});

export const ROLE_OPTIONS = Object.freeze([
  { value: ROLES.USER, label: 'USER - Normal User' },
  { value: ROLES.VIEWER, label: 'VIEWER - View All (Read Only)' },
  { value: ROLES.ROOM_MANAGER, label: 'ROOM_MANAGER - Room Manager' },
  { value: ROLES.ADMIN, label: 'ADMIN - Full Access' }
]);

export const ACCESS_ROLES = Object.freeze({
  DASHBOARD: Object.freeze([ROLES.ADMIN, ROLES.ROOM_MANAGER]),
  MANAGEMENT: Object.freeze([ROLES.VIEWER, ROLES.ROOM_MANAGER, ROLES.ADMIN]),
  USERS: Object.freeze([ROLES.ADMIN])
});
