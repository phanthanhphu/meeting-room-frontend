import { BOOKING_LIMITS, BOOKING_DEFAULTS } from './booking.js';

// Geometry must be shared by hour labels, booking blocks, and click positioning.
// More vertical room for compact booking cards, while keeping the same time-to-position scale.
export const HOUR_HEIGHT = 72;
export const START_HOUR = Number(BOOKING_LIMITS.start.slice(0, 2));
export const END_HOUR = Number(BOOKING_LIMITS.end.slice(0, 2));
export const BOTTOM_GUTTER = 24; // Keeps the 18:00 label clear of the bottom border.
export const CALENDAR_DAYS = 6; // Monday through Saturday.
export const SNAP_MINUTES = BOOKING_DEFAULTS.snapMinutes;
export const TIMELINE_HEIGHT = HOUR_HEIGHT * (END_HOUR - START_HOUR);
export const HOURS = Object.freeze(Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index));
