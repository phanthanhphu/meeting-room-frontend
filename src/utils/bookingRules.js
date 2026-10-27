import { BOOKING_STATUS, BOOKING_STATUS_GROUPS } from '../constants/statuses.js';
import { dateKey, formatTime } from './date.js';
// Frontend mirrors the booking rules in backend BookingRulesProperties.
// Backend validation remains authoritative, especially for concurrent requests.
export { BOOKING_LIMITS } from '../constants/booking.js';
export const minutesOf = (time) => {
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
};
export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
export const isFutureBooking = (booking, now = new Date()) => {
  if (!booking) return false;
  const start = String(booking.time || '').split(' - ')[0];
  // Compare in the configured meeting-room time zone, not the workstation zone.
  const currentIso = now.toISOString();
  return Boolean(booking.date && start) && `${booking.date}T${start}` > `${dateKey(currentIso)}T${formatTime(currentIso)}`;
};
export const canChangeBooking = (booking, now = new Date()) =>
  Boolean(booking && BOOKING_STATUS_GROUPS.EDITABLE.includes(booking.status) && isFutureBooking(booking, now));

export const canCancelBooking = (booking, { isManager = false, isOwner = false } = {}, now = new Date()) => {
  if (!booking || !isFutureBooking(booking, now)) return false;
  if (booking.status === BOOKING_STATUS.APPROVED) return isManager;
  return booking.status === BOOKING_STATUS.PENDING && (isManager || isOwner);
};
export function calculateDayLayout(bookings) {
  // Interval partitioning: overlapping meetings are adjacent instead of stacked.
  const items = [...bookings].sort((a, b) => minutesOf(a.time.split(' - ')[0]) - minutesOf(b.time.split(' - ')[0]) || a.id.localeCompare(b.id));
  const result = [];
  let group = [];
  let maxEnd = -1;
  const flush = () => {
    const ends = [];
    const placed = group.map((item) => {
      const [start, end] = item.time.split(' - ');
      const startMinute = minutesOf(start);
      let column = ends.findIndex((endMinute) => endMinute <= startMinute);
      if (column < 0) { column = ends.length; ends.push(minutesOf(end)); }
      else ends[column] = minutesOf(end);
      return { ...item, column };
    });
    placed.forEach((item) => result.push({ ...item, columns: ends.length }));
    group = []; maxEnd = -1;
  };
  items.forEach((item) => {
    const [start, end] = item.time.split(' - ');
    if (group.length && minutesOf(start) >= maxEnd) flush();
    group.push(item);
    maxEnd = Math.max(maxEnd, minutesOf(end));
  });
  if (group.length) flush();
  return result;
}
