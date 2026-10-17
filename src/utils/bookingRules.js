// Frontend mirrors the booking rules in backend BookingRulesProperties.
// Backend validation remains authoritative, especially for concurrent requests.
export const BOOKING_LIMITS = Object.freeze({ start: '07:00', end: '18:00', minMinutes: 15, maxMinutes: 240, advanceDays: 90 });
export const minutesOf = (time) => {
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  return hours * 60 + minutes;
};
export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
export const canChangeBooking = (booking, now = new Date()) => {
  if (!booking || !['PENDING', 'APPROVED'].includes(booking.status)) return false;
  const start = String(booking.time || '').split(' - ')[0];
  return Boolean(booking.date && start) && new Date(`${booking.date}T${start}:00`).getTime() > now.getTime();
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
