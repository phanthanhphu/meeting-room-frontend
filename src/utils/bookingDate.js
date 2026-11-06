// Shared calendar/form guard. Use local wall-clock dates (the same convention as BookingService).
import dayjs from 'dayjs';
import { BOOKING_DEFAULTS } from '../constants/booking.js';
import { BOOKING_LIMITS, minutesOf } from './bookingRules.js';

export const bookingDateBounds = (now = dayjs()) => ({
  min: now.format('YYYY-MM-DD'),
  max: now.add(BOOKING_LIMITS.advanceDays, 'day').format('YYYY-MM-DD')
});

// Once all start times today have elapsed, tomorrow (or Monday) becomes the first selectable day.
export const firstSelectableBookingDate = (now = dayjs()) => nextBookingSlot(now).date;

export const isBookableDate = (date, now = dayjs()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  const candidate = dayjs(date);
  const { min, max } = bookingDateBounds(now);
  return candidate.isValid() && candidate.format('YYYY-MM-DD') === date && date >= min && date <= max && candidate.day() !== 0;
};

export const isFutureBookingStart = (date, time, now = dayjs()) =>
  isBookableDate(date, now) && /^\d{2}:\d{2}$/.test(time || '') &&
  dayjs(`${date}T${time}`).isAfter(now);

export const timeFromMinutes = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const minimumStartTime = (date, now = dayjs()) => {
  if (date !== now.format('YYYY-MM-DD')) return BOOKING_LIMITS.start;
  const minutes = Math.ceil((now.hour() * 60 + now.minute() + 1) / 15) * 15;
  return timeFromMinutes(Math.max(minutesOf(BOOKING_LIMITS.start), minutes));
};

export const minimumEndTime = (startTime) =>
  timeFromMinutes(Math.min(minutesOf(BOOKING_LIMITS.end), minutesOf(startTime) + BOOKING_LIMITS.minMinutes));

// 'New Booking' always opens on a selectable future slot, even from a historic calendar week
// or when the current day's booking hours are over.
export const nextBookingSlot = (now = dayjs()) => {
  let day = now;
  let startMinutes = Math.max(minutesOf(BOOKING_DEFAULTS.startTime), minutesOf(minimumStartTime(day.format('YYYY-MM-DD'), now)));
  if (day.day() === 0 || startMinutes > minutesOf(BOOKING_DEFAULTS.latestStartTime)) {
    day = day.add(1, 'day');
    if (day.day() === 0) day = day.add(1, 'day');
    startMinutes = minutesOf(BOOKING_DEFAULTS.startTime);
  }
  const endMinutes = Math.min(startMinutes + BOOKING_DEFAULTS.slotMinutes, minutesOf(BOOKING_LIMITS.end));
  return { date: day.format('YYYY-MM-DD'), startTime: timeFromMinutes(startMinutes), endTime: timeFromMinutes(endMinutes) };
};

// User-facing English feedback for invalid selections; date/time choices remain clickable.
export const bookingDateNotice = (date, now = dayjs()) => {
  if (!date) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Please choose a valid booking date.';
  const candidate = dayjs(date);
  if (!candidate.isValid() || candidate.format('YYYY-MM-DD') !== date) return 'Please choose a valid booking date.';
  const { min, max } = bookingDateBounds(now);
  if (date < min) return 'This date has already passed. Please select today or a future date.';
  if (date > max) return `Bookings can be made up to ${BOOKING_LIMITS.advanceDays} days in advance.`;
  if (candidate.day() === 0) return 'Meeting rooms cannot be booked on Sundays. Please choose Monday through Saturday.';
  if (date === min && minimumStartTime(date, now) > BOOKING_DEFAULTS.latestStartTime) {
    return 'Booking hours for today have ended. Please select another day.';
  }
  return '';
};

export const bookingStartNotice = (date, time, now = dayjs()) => {
  const dateNotice = bookingDateNotice(date, now);
  if (dateNotice) return dateNotice;
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return 'Please choose a valid start time.';
  if (!isFutureBookingStart(date, time, now)) return 'This time has already passed. Please select a future start time.';
  return '';
};
