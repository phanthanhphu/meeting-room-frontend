import { ROOM_STATUS } from './statuses.js';
import { BOOKING_DEFAULTS } from './booking.js';

export const ALL_FILTER_VALUE = 'ALL';
export const ROOM_FILTER_DEFAULTS = Object.freeze({
  query: '', location: ALL_FILTER_VALUE, status: ROOM_STATUS.ACTIVE,
  deviceId: ALL_FILTER_VALUE, minCapacity: ''
});
export const ROOM_SLOT_DEFAULTS = Object.freeze({
  startTime: BOOKING_DEFAULTS.startTime, endTime: BOOKING_DEFAULTS.endTime
});
export const ROOM_FORM_DEFAULTS = Object.freeze({
  code: '', name: '', location: '', capacity: 4,
  equipmentIds: [], description: '', status: ROOM_STATUS.ACTIVE
});
