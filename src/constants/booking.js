// This frontend copy must stay synchronized with backend app.booking settings.
export const BOOKING_LIMITS = Object.freeze({
  start: '07:00', end: '18:00', minMinutes: 15, maxMinutes: 240, advanceDays: 90
});

export const BOOKING_DEFAULTS = Object.freeze({
  startTime: '09:00', endTime: '10:00', participants: 1,
  snapMinutes: 30, slotMinutes: 60, timeInputStepSeconds: 900,
  latestStartTime: '17:45', earliestEndTime: '07:15'
});
