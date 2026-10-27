import { DATE_TIME } from '../constants/dateTime.js';

const DATE_HEAD = /^(\d{4})-(\d{2})-(\d{2})/;
const LOCAL_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;
const WALL_TIME = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

function explicitInstant(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function zonedParts(value) {
  const instant = explicitInstant(value);
  if (!instant) return null;
  const items = new Intl.DateTimeFormat(DATE_TIME.locale, {
    timeZone: DATE_TIME.timeZone,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(instant);
  return Object.fromEntries(items.map(({ type, value: part }) => [type, part]));
}

// For date-only strings and backend LocalDateTime, retain the original calendar day.
export function formatDate(value) {
  if (!value) return '-';
  const text = String(value).trim();
  const local = LOCAL_TIMESTAMP.exec(text) || (DATE_HEAD.exec(text) && !/[T ]/.test(text) ? DATE_HEAD.exec(text) : null);
  if (local) return `${local[3]}/${local[2]}/${local[1]}`;
  const parts = zonedParts(text);
  return parts ? `${parts.day}/${parts.month}/${parts.year}` : '-';
}

// Always display 24-hour HH:mm (never browser-locale AM/PM).
export function formatTime(value) {
  if (!value) return '-';
  const text = String(value).trim();
  const simple = WALL_TIME.exec(text);
  if (simple && Number(simple[1]) < 24 && Number(simple[2]) < 60) return `${simple[1].padStart(2, '0')}:${simple[2]}`;
  const local = LOCAL_TIMESTAMP.exec(text);
  if (local) return `${local[4]}:${local[5]}`;
  const parts = zonedParts(text);
  return parts ? `${parts.hour}:${parts.minute}` : '-';
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = formatDate(value);
  const time = formatTime(value);
  return date === '-' || time === '-' ? '-' : `${date} ${time}`;
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// API date filter values remain ISO calendar dates, regardless of UI formatting.
export function dateKey(value) {
  if (!value) return '';
  const text = String(value).trim();
  const local = LOCAL_TIMESTAMP.exec(text);
  if (local) return `${local[1]}-${local[2]}-${local[3]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parts = zonedParts(text);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : '';
}
