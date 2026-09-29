import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import globalApi, { authStorage } from '../routes/globalApi';
import { canCreateBooking, canManageBookings, canManageRooms, canManageUsers, canViewAllBookings, isReadOnlyViewer } from '../auth/roles';

const AuthContext = createContext(null);
const AUTH_TYPE_KEY = 'meetingRoomAuthenticationType';

const toUiUser = (user) => user ? ({
  id: user.id,
  username: user.username,
  domainAccount: user.domainAccount || '',
  accountSource: user.accountSource || 'SYSTEM',
  email: user.email,
  fullName: user.fullName,
  name: user.fullName,
  department: user.department || '',
  role: user.role,
  active: user.enabled !== false,
  initials: String(user.fullName || user.domainAccount || user.username || 'US').trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase()).join('') || 'US'
}) : null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authenticationType, setAuthenticationType] = useState(() => sessionStorage.getItem(AUTH_TYPE_KEY) || '');
  const [loading, setLoading] = useState(Boolean(authStorage.getToken()));

  const logout = useCallback(() => {
    authStorage.clear();
    sessionStorage.removeItem(AUTH_TYPE_KEY);
    setAuthenticationType('');
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!authStorage.getToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const current = await globalApi.auth.me();
      const mapped = toUiUser(current);
      setUser(mapped);
      return mapped;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => { refreshMe(); }, [refreshMe]);
  useEffect(() => {
    const unauthorized = () => logout();
    window.addEventListener('meeting-room:unauthorized', unauthorized);
    return () => window.removeEventListener('meeting-room:unauthorized', unauthorized);
  }, [logout]);

  const login = useCallback(async (identifier, password, loginType = 'DOMAIN') => {
    try {
      const response = await globalApi.auth.login(identifier, password, loginType);
      authStorage.setToken(response.token);
      const mapped = toUiUser(response.user);
      const authType = response.authenticationType || loginType;
      sessionStorage.setItem(AUTH_TYPE_KEY, authType);
      setAuthenticationType(authType);
      setUser(mapped);
      return { ok: true, user: mapped, authenticationType: authType, domainUser: response.domainUser || null };
    } catch (error) {
      authStorage.clear();
      sessionStorage.removeItem(AUTH_TYPE_KEY);
      setAuthenticationType('');
      setUser(null);
      return { ok: false, message: error?.message || 'Username/email or password is incorrect.' };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshMe,
    authenticationType,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    isViewer: user?.role === 'VIEWER',
    isRoomManager: user?.role === 'ROOM_MANAGER',
    canViewAllBookings: canViewAllBookings(user),
    canManageBookings: canManageBookings(user),
    canManageRooms: canManageRooms(user),
    canManageUsers: canManageUsers(user),
    canCreateBooking: canCreateBooking(user),
    isReadOnly: isReadOnlyViewer(user)
  }), [user, loading, login, logout, refreshMe, authenticationType]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
