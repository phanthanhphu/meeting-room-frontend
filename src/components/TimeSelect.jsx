import { MenuItem, TextField } from '@mui/material';
import { BOOKING_LIMITS } from '../constants/booking.js';
import { DATE_TIME } from '../constants/dateTime.js';
import { minutesOf } from '../utils/bookingRules.js';
import { formatTime } from '../utils/date.js';

// Native time inputs can display 12-hour values depending on OS/browser locale.
// An explicit 24-hour select keeps booking times consistent across workstations.
const availableTimes = Object.freeze(Array.from({ length: (minutesOf(BOOKING_LIMITS.end) - minutesOf(BOOKING_LIMITS.start)) / DATE_TIME.timeStepMinutes + 1 }, (_, i) => {
  const total = minutesOf(BOOKING_LIMITS.start) + i * DATE_TIME.timeStepMinutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}));

export default function TimeSelect({ label, value, onChange, min = BOOKING_LIMITS.start, max = BOOKING_LIMITS.end, ...props }) {
  const options = availableTimes.filter((time) => time >= min && time <= max);
  // Preserve an existing, off-grid time rather than silently changing the record.
  const selected = options.includes(value) ? options : [...options, value].filter(Boolean).sort();
  return <TextField select label={label} value={value || ''} onChange={onChange} {...props}>
    {selected.map((time) => <MenuItem key={time} value={time}>{formatTime(time)}</MenuItem>)}
  </TextField>;
}
