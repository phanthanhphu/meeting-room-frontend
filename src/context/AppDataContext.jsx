import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import globalApi, { APP_EVENT_WS_URL } from '../routes/globalApi';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);

const mapRoom = (room) => ({
  id: room.id,
  code: room.code,
  name: room.name,
  location: room.location,
  capacity: room.capacity,
  description: room.description || '',
  facilities: room.amenities || '',
  status: room.status === 'AVAILABLE' ? 'ACTIVE' : room.status
});

const roomPayload = (room) => ({
  code: String(room.code || '').trim(),
  name: String(room.name || '').trim(),
  location: String(room.location || '').trim(),
  capacity: Number(room.capacity || 0),
  description: room.description || '',
  amenities: room.facilities || '',
  status: room.status === 'ACTIVE' ? 'AVAILABLE' : room.status
});

const mapUser = (user) => ({
  id: user.id,
  username: user.username,
  domainAccount: user.domainAccount || '',
  accountSource: user.accountSource || 'SYSTEM',
  name: user.fullName,
  fullName: user.fullName,
  email: user.email,
  department: user.department || '',
  role: user.role,
  active: user.enabled !== false
});

const mapBooking = (booking) => {
  const start = dayjs(booking.startAt);
  const end = dayjs(booking.endAt);
  return {
    id: booking.id,
    title: booking.title,
    userId: booking.createdBy?.id || '',
    user: booking.createdBy?.fullName || '',
    account: booking.bookedByAccount || booking.createdBy?.domainAccount || booking.createdBy?.username || '',
    email: booking.bookedByEmail || booking.createdBy?.email || '',
    department: booking.createdBy?.department || '',
    roomId: booking.room?.id || '',
    room: booking.room?.name || '',
    roomCode: booking.room?.code || '',
    date: start.format('YYYY-MM-DD'),
    time: `${start.format('HH:mm')} - ${end.format('HH:mm')}`,
    participants: booking.attendeeCount,
    status: booking.status,
    note: booking.purpose || '',
    rejectReason: booking.adminNote || '',
    approvedBy: booking.approvedBy?.fullName || '',
    approvedAt: booking.approvedAt || null,
    rejectedAt: booking.rejectedAt || null,
    cancelledAt: booking.cancelledAt || null,
    createdAt: booking.createdAt || null,
    updatedAt: booking.updatedAt || null
  };
};

function mergeBookings(...groups) {
  const map = new Map();
  groups.flat().filter(Boolean).forEach((item) => map.set(item.id, item));
  return [...map.values()].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

function bookingPayload(form, rooms) {
  const room = rooms.find((item) => item.id === form.roomId || item.name === form.room);
  if (!room) throw new Error('Please select a valid meeting room.');
  return {
    roomId: room.id,
    title: String(form.title || '').trim(),
    purpose: form.note || '',
    attendeeCount: Number(form.participants || 1),
    startAt: `${form.date}T${form.startTime}:00`,
    endAt: `${form.date}T${form.endTime}:00`
  };
}

export function AppDataProvider({ children }) {
  const { user: sessionUser, isAdmin, canViewAllBookings, canManageBookings, canManageRooms, canCreateBooking, isReadOnly, refreshMe } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [appNotifications, setAppNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const notify = useCallback((message, severity = 'success') => setNotification({ id: Date.now(), message, severity }), []);
  const clearNotification = useCallback(() => setNotification(null), []);
  const fail = useCallback((error, fallback = 'Operation failed.') => {
    notify(error?.message || fallback, 'error');
    return false;
  }, [notify]);

  const refreshNotifications = useCallback(async () => {
    if (!sessionUser) { setAppNotifications([]); setUnreadNotificationCount(0); return []; }
    const [rows, count] = await Promise.all([globalApi.notifications.list(), globalApi.notifications.unreadCount()]);
    setAppNotifications(rows || []);
    setUnreadNotificationCount(Number(count?.count || 0));
    return rows || [];
  }, [sessionUser]);

  const markNotificationRead = useCallback(async (id) => {
    if (!id) return false;
    try {
      const target = appNotifications.find((row) => row.id === id);
      if (target?.read) return target;
      const updated = await globalApi.notifications.markRead(id);
      setAppNotifications((current) => current.map((row) => row.id === id ? updated : row));
      setUnreadNotificationCount((current) => Math.max(0, current - 1));
      return updated;
    } catch (error) { return fail(error, 'Unable to update notification.'); }
  }, [appNotifications, fail]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await globalApi.notifications.markAllRead();
      setAppNotifications((current) => current.map((row) => ({ ...row, read: true, readAt: row.readAt || new Date().toISOString() })));
      setUnreadNotificationCount(0);
      return true;
    } catch (error) { return fail(error, 'Unable to update notifications.'); }
  }, [fail]);

  const refreshRooms = useCallback(async () => {
    if (!sessionUser) return [];
    const rows = (await globalApi.rooms.list()).map(mapRoom);
    setRooms(rows);
    return rows;
  }, [sessionUser]);

  const refreshUsers = useCallback(async () => {
    if (!sessionUser || !isAdmin) { setUsers([]); return []; }
    const rows = (await globalApi.admin.users.list()).map(mapUser);
    setUsers(rows);
    return rows;
  }, [sessionUser, isAdmin]);

  const refreshBookings = useCallback(async () => {
    if (!sessionUser) { setBookings([]); return []; }
    if (canViewAllBookings) {
      const rows = (await globalApi.admin.bookings.all()).map(mapBooking);
      setBookings(rows);
      return rows;
    }
    const mine = (await globalApi.bookings.mine()).map(mapBooking);
    const from = dayjs().startOf('day').format('YYYY-MM-DD');
    const to = dayjs().add(31, 'day').format('YYYY-MM-DD');
    const calendar = (await globalApi.bookings.calendar(from, to)).map(mapBooking);
    const rows = mergeBookings(mine, calendar);
    setBookings(rows);
    return rows;
  }, [sessionUser, canViewAllBookings]);

  const refreshCalendar = useCallback(async (from, to) => {
    if (!sessionUser) return [];
    try {
      if (canViewAllBookings) return refreshBookings();
      const calendar = (await globalApi.bookings.calendar(from, to)).map(mapBooking);
      setBookings((current) => mergeBookings(current.filter((row) => row.userId === sessionUser.id), calendar));
      return calendar;
    } catch (error) {
      fail(error, 'Unable to load booking calendar.');
      return [];
    }
  }, [sessionUser, canViewAllBookings, refreshBookings, fail]);

  const refreshAll = useCallback(async () => {
    if (!sessionUser) { setRooms([]); setBookings([]); setUsers([]); setAppNotifications([]); setUnreadNotificationCount(0); return; }
    setLoading(true);
    try {
      await Promise.all([refreshRooms(), refreshBookings(), isAdmin ? refreshUsers() : Promise.resolve([]), refreshNotifications()]);
    } catch (error) {
      fail(error, 'Unable to load meeting room data.');
    } finally {
      setLoading(false);
    }
  }, [sessionUser, isAdmin, refreshRooms, refreshBookings, refreshUsers, refreshNotifications, fail]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Same event pattern as the sample project: backend broadcasts lightweight data-change events.
  // Data itself is still fetched through secured REST endpoints. Polling remains as a fallback.
  useEffect(() => {
    if (!sessionUser) return undefined;
    let socket;
    try {
      socket = new WebSocket(APP_EVENT_WS_URL);
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data || '{}');
          if (payload.type === 'BOOKING_CHANGED') refreshBookings().catch(() => {});
          if (payload.type === 'ROOM_CHANGED') refreshRooms().catch(() => {});
          if (payload.type === 'NOTIFICATION_CHANGED') refreshNotifications().catch(() => {});
          if (payload.type === 'USER_CHANGED') {
            refreshMe().catch(() => {});
            if (isAdmin) refreshUsers().catch(() => {});
          }
        } catch { /* ignore malformed event */ }
      };
    } catch { /* fallback polling below */ }
    const timer = window.setInterval(() => { refreshBookings().catch(() => {}); refreshNotifications().catch(() => {}); }, 15000);
    return () => {
      window.clearInterval(timer);
      if (socket && socket.readyState <= 1) socket.close();
    };
  }, [sessionUser, isAdmin, refreshBookings, refreshRooms, refreshUsers, refreshNotifications, refreshMe]);

  const isOwner = useCallback((row) => Boolean(sessionUser) && row?.userId === sessionUser.id, [sessionUser]);
  const canManageBooking = useCallback((row) => Boolean(sessionUser) && !isReadOnly && (canManageBookings || isOwner(row)), [sessionUser, isReadOnly, canManageBookings, isOwner]);

  const addBooking = useCallback(async (form) => {
    if (!canCreateBooking) return fail(new Error('This account is read-only and cannot create bookings.'));
    try {
      const created = mapBooking(await globalApi.bookings.create(bookingPayload(form, rooms)));
      setBookings((current) => mergeBookings(created, current));
      notify('Booking request submitted to Admin for approval.');
      return created;
    } catch (error) { return fail(error, 'Unable to create booking.'); }
  }, [canCreateBooking, rooms, notify, fail]);

  const updateBooking = useCallback(async (id, form) => {
    if (isReadOnly) return fail(new Error('This account is read-only and cannot update bookings.'));
    try {
      const updated = mapBooking(await globalApi.bookings.update(id, bookingPayload(form, rooms)));
      setBookings((current) => current.map((row) => row.id === id ? updated : row));
      notify(updated.status === 'PENDING' ? 'Booking saved. Approved bookings return to Pending after changes.' : 'Booking updated successfully.');
      return updated;
    } catch (error) { return fail(error, 'Unable to update booking.'); }
  }, [isReadOnly, rooms, notify, fail]);

  const cancelBooking = useCallback(async (id) => {
    if (isReadOnly) return fail(new Error('This account is read-only and cannot cancel bookings.'));
    try {
      const response = canManageBookings ? await globalApi.admin.bookings.cancel(id) : await globalApi.bookings.cancel(id);
      const updated = mapBooking(response);
      if (updated.status !== 'CANCELLED') {
        throw new Error('Cancel request completed but booking status was not updated to CANCELLED.');
      }

      // Update immediately so every component using the shared booking state sees CANCELLED.
      setBookings((current) => current.map((row) => row.id === id ? updated : row));

      // Verify the exact booking from MongoDB again. This avoids a stale list/calendar state
      // making the UI look APPROVED/PENDING after a successful cancel.
      const persisted = mapBooking(await globalApi.bookings.get(id));
      if (persisted.status !== 'CANCELLED') {
        throw new Error(`Booking status is ${persisted.status} after cancel. Expected CANCELLED.`);
      }
      setBookings((current) => current.map((row) => row.id === id ? persisted : row));

      // Synchronize My Bookings / Approvals / Dashboard in the background. Calendar will
      // intentionally stop showing the cancelled event because it is no longer active.
      refreshBookings().catch(() => {});
      notify('Booking cancelled. Status updated to CANCELLED.');
      return persisted;
    } catch (error) { return fail(error, 'Unable to cancel booking.'); }
  }, [isReadOnly, canManageBookings, refreshBookings, notify, fail]);

  const deleteBooking = useCallback(async (id) => {
    if (isReadOnly) return fail(new Error('This account is read-only and cannot delete bookings.'));
    try {
      if (canManageBookings) await globalApi.admin.bookings.delete(id); else await globalApi.bookings.delete(id);
      setBookings((current) => current.filter((row) => row.id !== id));
      notify('Booking deleted.');
      return true;
    } catch (error) { return fail(error, 'Unable to delete booking.'); }
  }, [isReadOnly, canManageBookings, notify, fail]);

  const approveBooking = useCallback(async (id) => {
    if (!canManageBookings) return fail(new Error('Room Manager or Admin permission is required.'));
    try {
      const updated = mapBooking(await globalApi.admin.bookings.approve(id));
      setBookings((current) => current.map((row) => row.id === id ? updated : row));
      notify('Booking approved successfully.');
      return updated;
    } catch (error) { return fail(error, 'Unable to approve booking.'); }
  }, [canManageBookings, notify, fail]);

  const rejectBooking = useCallback(async (id, reason) => {
    if (!canManageBookings) return fail(new Error('Room Manager or Admin permission is required.'));
    try {
      const updated = mapBooking(await globalApi.admin.bookings.reject(id, reason));
      setBookings((current) => current.map((row) => row.id === id ? updated : row));
      notify('Booking rejected.');
      return updated;
    } catch (error) { return fail(error, 'Unable to reject booking.'); }
  }, [canManageBookings, notify, fail]);

  const addRoom = useCallback(async (form) => {
    if (!canManageRooms) return fail(new Error('Room Manager or Admin permission is required.'));
    try {
      const created = mapRoom(await globalApi.rooms.create(roomPayload(form)));
      setRooms((current) => [created, ...current]);
      notify('Meeting room added.');
      return created;
    } catch (error) { return fail(error, 'Unable to add room.'); }
  }, [canManageRooms, notify, fail]);

  const updateRoom = useCallback(async (id, form) => {
    if (!canManageRooms) return fail(new Error('Room Manager or Admin permission is required.'));
    try {
      const updated = mapRoom(await globalApi.rooms.update(id, roomPayload(form)));
      setRooms((current) => current.map((room) => room.id === id ? updated : room));
      notify('Meeting room updated.');
      return updated;
    } catch (error) { return fail(error, 'Unable to update room.'); }
  }, [canManageRooms, notify, fail]);

  const deleteRoom = useCallback(async (id) => {
    if (!canManageRooms) return fail(new Error('Room Manager or Admin permission is required.'));
    try {
      await globalApi.rooms.delete(id);
      setRooms((current) => current.filter((room) => room.id !== id));
      notify('Meeting room deleted.');
      return true;
    } catch (error) { return fail(error, 'Unable to delete room.'); }
  }, [canManageRooms, notify, fail]);

  const addUser = useCallback(async (form) => {
    if (!isAdmin) throw new Error('Admin permission is required.');
    try {
      const created = mapUser(await globalApi.admin.users.create({
        username: String(form.username || '').trim(),
        email: String(form.email || '').trim(),
        fullName: String(form.name || form.fullName || '').trim(),
        department: String(form.department || '').trim(),
        password: form.password,
        role: form.role || 'USER',
        enabled: form.active !== false
      }));
      setUsers((current) => [created, ...current]);
      notify('User created successfully.');
      return created;
    } catch (error) {
      notify(error?.message || 'Unable to create user.', 'error');
      throw error;
    }
  }, [isAdmin, notify]);

  const updateUser = useCallback(async (id, form) => {
    if (!isAdmin) throw new Error('Admin permission is required.');
    try {
      const updated = mapUser(await globalApi.admin.users.update(id, {
        email: String(form.email || '').trim(),
        fullName: String(form.name || form.fullName || '').trim(),
        department: String(form.department || '').trim(),
        role: form.role,
        enabled: form.active !== false
      }));
      setUsers((current) => current.map((user) => user.id === id ? updated : user));
      notify('User profile updated.');
      return updated;
    } catch (error) {
      notify(error?.message || 'Unable to update user.', 'error');
      throw error;
    }
  }, [isAdmin, notify]);

  const toggleUser = useCallback(async (id) => {
    if (!isAdmin) return fail(new Error('Admin permission is required.'));
    const target = users.find((item) => item.id === id);
    if (!target) return false;
    try {
      const updated = mapUser(await globalApi.admin.users.setEnabled(id, !target.active));
      setUsers((current) => current.map((user) => user.id === id ? updated : user));
      notify(updated.active ? 'User enabled.' : 'User disabled.');
      return updated;
    } catch (error) { return fail(error, 'Unable to change account status.'); }
  }, [isAdmin, users, notify, fail]);

  const resetUserPassword = useCallback(async (id) => {
    if (!isAdmin) throw new Error('Admin permission is required.');
    try {
      const response = await globalApi.admin.users.resetPassword(id);
      notify('Password reset completed. The new password is active immediately.');
      return response.temporaryPassword;
    } catch (error) {
      notify(error?.message || 'Unable to reset password.', 'error');
      throw error;
    }
  }, [isAdmin, notify]);

  const deleteUser = useCallback(async (id) => {
    if (!isAdmin) return fail(new Error('Admin permission is required.'));
    try {
      await globalApi.admin.users.delete(id);
      setUsers((current) => current.filter((user) => user.id !== id));
      notify('User deleted.');
      return true;
    } catch (error) { return fail(error, 'Unable to delete user.'); }
  }, [isAdmin, notify, fail]);

  const value = useMemo(() => ({
    bookings, rooms, users, notification, clearNotification, showNotification: notify, loading,
    appNotifications, unreadNotificationCount, refreshNotifications, markNotificationRead, markAllNotificationsRead,
    refreshAll, refreshBookings, refreshCalendar, isOwner, canManageBooking,
    addBooking, updateBooking, cancelBooking, deleteBooking, approveBooking, rejectBooking,
    addRoom, updateRoom, deleteRoom,
    addUser, updateUser, deleteUser, toggleUser, resetUserPassword
  }), [bookings, rooms, users, notification, clearNotification, notify, loading, appNotifications, unreadNotificationCount,
    refreshNotifications, markNotificationRead, markAllNotificationsRead, refreshAll, refreshBookings, refreshCalendar,
    isOwner, canManageBooking, addBooking, updateBooking, cancelBooking, deleteBooking, approveBooking, rejectBooking,
    addRoom, updateRoom, deleteRoom, addUser, updateUser, deleteUser, toggleUser, resetUserPassword]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
