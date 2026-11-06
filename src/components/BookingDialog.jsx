import TimeSelect from './TimeSelect.jsx';
import { formatTime } from '../utils/date.js';
import { BOOKING_DEFAULTS } from '../constants/booking.js';
import { BOOKING_STATUS, BOOKING_STATUS_GROUPS, ROOM_STATUS } from '../constants/statuses.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import globalApi from '../routes/globalApi';
import { BOOKING_LIMITS, minutesOf, overlaps } from '../utils/bookingRules';
import { bookingDateBounds, firstSelectableBookingDate, isBookableDate, isFutureBookingStart, minimumStartTime, minimumEndTime, nextBookingSlot, timeFromMinutes, bookingDateNotice, bookingStartNotice } from '../utils/bookingDate.js';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import bookingBackground from '../assets/booking-background.png';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { EquipmentPills } from './EquipmentDisplay';
import ConfirmDialog from './ConfirmDialog';
import BookingTimeNotice from './BookingTimeNotice';

const BUSINESS_START = BOOKING_LIMITS.start;
const BUSINESS_END = BOOKING_LIMITS.end;
const defaultForm = () => ({ title: '', roomId: '', ...nextBookingSlot(), participants: BOOKING_DEFAULTS.participants, note: '' });

export default function BookingDialog({
  open,
  onClose,
  onSave,
  rooms = [],
  booking = null,
  defaultRoom = '',
  defaultDate = '',
  defaultStartTime = '',
  defaultEndTime = ''
}) {
  const { user: sessionUser } = useAuth();
  const { equipment } = useAppData();
  const [availability, setAvailability] = useState({ date: '', rows: [], loading: false, error: '' });
  const [form, setForm] = useState(defaultForm);
  const originalFormRef = useRef(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateTouched, setDateTouched] = useState(false);
  const [bookingTimeNotice, setBookingTimeNotice] = useState('');
  const activeRooms = useMemo(() => rooms.filter((room) => room.status === ROOM_STATUS.ACTIVE), [rooms]);
  const activeRoomKeys = activeRooms.map((room) => room.id).join('|');
  const selectedRoom = activeRooms.find((room) => room.id === form.roomId);
  const bookedByName = booking?.user || sessionUser?.fullName || sessionUser?.name || '';
  const bookedByAccount = booking?.account || sessionUser?.domainAccount || sessionUser?.username || '';
  const bookedByEmail = booking?.email || sessionUser?.email || '';

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setConfirmDiscard(false);
    setDateTouched(false);
    setBookingTimeNotice('');
    const [bookingStart = BOOKING_DEFAULTS.startTime, bookingEnd = BOOKING_DEFAULTS.endTime] = String(booking?.time || '').split(' - ');
    // Never carry a historic calendar date or time into a new booking.
    const suggested = nextBookingSlot();
    const safeDefault = !booking && isFutureBookingStart(defaultDate, defaultStartTime)
      ? { date: defaultDate, startTime: defaultStartTime, endTime: defaultEndTime || suggested.endTime }
      : suggested;
    const startingForm = booking ? {
      title: booking.title || '', roomId: activeRooms.find((room) => room.id === booking.roomId || room.name === booking.room)?.id || '', date: booking.date || '', startTime: bookingStart, endTime: bookingEnd,
      participants: booking.participants || 1, note: booking.note || ''
    } : {
      ...defaultForm(),
      roomId: activeRooms.find((room) => room.id === defaultRoom || room.name === defaultRoom)?.id || activeRooms[0]?.id || '',
      ...safeDefault
    };
    originalFormRef.current = JSON.stringify(startingForm);
    setForm(startingForm);
  }, [open, booking?.id, defaultRoom, defaultDate, defaultStartTime, defaultEndTime, activeRoomKeys]);

  const requestClose = () => {
    if (saving) return;
    if (JSON.stringify(form) !== originalFormRef.current) setConfirmDiscard(true);
    else onClose();
  };

  useEffect(() => {
    if (!open || !form.date) return undefined;
    let active = true;
    setAvailability({ date: form.date, rows: [], loading: true, error: '' });
    globalApi.bookings.occupied(form.date, booking?.id || '').then((rows) => {
      if (active) setAvailability({ date: form.date, rows: rows || [], loading: false, error: '' });
    }).catch((error) => {
      if (active) setAvailability({ date: form.date, rows: [], loading: false, error: error.message || 'Unable to check room schedule.' });
    });
    return () => { active = false; };
  }, [open, form.date, booking?.id]);

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const changeDate = (event) => {
    const date = event.target.value;
    setDateTouched(true);
    // Keep dates clickable: show a friendly popup instead of native disabled days or an inline error.
    const notice = date ? bookingDateNotice(date) : '';
    if (notice) { setBookingTimeNotice(notice); return; }
    const suggested = nextBookingSlot();
    setForm((current) => {
      if (!isBookableDate(date)) return { ...current, date };
      const earliest = minimumStartTime(date);
      const startTime = date === suggested.date && current.startTime < earliest ? suggested.startTime :
        current.startTime < earliest ? earliest : current.startTime;
      const safeStart = startTime > BOOKING_DEFAULTS.latestStartTime ? BOOKING_DEFAULTS.startTime : startTime;
      const endTime = current.endTime <= safeStart ? timeFromMinutes(Math.min(minutesOf(safeStart) + BOOKING_DEFAULTS.slotMinutes, minutesOf(BUSINESS_END))) : current.endTime;
      return { ...current, date, startTime: safeStart, endTime };
    });
  };
  const changeStart = (event) => {
    const startTime = event.target.value;
    const notice = bookingStartNotice(form.date, startTime);
    if (notice) { setBookingTimeNotice(notice); return; }
    setForm((current) => ({
      ...current, startTime,
      endTime: current.endTime <= startTime
        ? timeFromMinutes(Math.min(minutesOf(startTime) + BOOKING_DEFAULTS.slotMinutes, minutesOf(BUSINESS_END)))
        : current.endTime
    }));
  };
  const people = Number(form.participants);
  const timeValid = form.startTime && form.endTime && form.startTime < form.endTime;
  const businessHoursValid = form.startTime >= BUSINESS_START && form.endTime <= BUSINESS_END;
  const sundaySelected = Boolean(form.date) && new Date(`${form.date}T00:00:00`).getDay() === 0;
  const capacityValid = !selectedRoom || (people > 0 && Number.isInteger(people) && people <= selectedRoom.capacity);
  const { max: maxDate } = bookingDateBounds();
  const minDate = booking ? bookingDateBounds().min : firstSelectableBookingDate();
  const dateValid = isBookableDate(form.date) && (Boolean(booking) || form.date >= minDate);
  const durationMinutes = minutesOf(form.endTime) - minutesOf(form.startTime);
  const durationValid = timeValid && durationMinutes >= BOOKING_LIMITS.minMinutes && durationMinutes <= BOOKING_LIMITS.maxMinutes;
  const futureValid = isFutureBookingStart(form.date, form.startTime);
  // Show all business-hour choices; clicking a past start time explains why it cannot be booked.
  const minStartTime = BUSINESS_START;
  const minEndTime = form.startTime ? minimumEndTime(form.startTime) : BOOKING_DEFAULTS.earliestEndTime;
  const busyBookings = availability.date === form.date ? availability.rows.filter((row) =>
    BOOKING_STATUS_GROUPS.BLOCKING_ROOM.includes(row.status) && row.roomId === form.roomId
  ) : [];
  const roomConflict = timeValid && busyBookings.some((row) => overlaps(
    minutesOf(form.startTime), minutesOf(form.endTime),
    minutesOf(formatTime(row.startAt)), minutesOf(formatTime(row.endAt))
  ));
  const valid = (!booking || booking.status === BOOKING_STATUS.PENDING) && form.title.trim() && selectedRoom && dateValid && futureValid && timeValid && durationValid &&
    businessHoursValid && !sundaySelected && people > 0 && capacityValid && !roomConflict &&
    !(availability.date === form.date && availability.loading);
  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return <><Dialog open={open} onClose={requestClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
    <Box sx={{ backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.94),rgba(255,255,255,.72)),url(${bookingBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid #E3EAF1' }}>
      <DialogTitle sx={{ pb: .4, fontSize: '1.1rem', fontWeight: 850, color: '#173B63' }}>{booking ? 'Edit Meeting Booking' : 'New Meeting Room Booking'}</DialogTitle>
      <Typography sx={{ px: 3, pb: 1.4, fontSize: '.68rem', color: '#61758B' }}>{booking ? 'Only pending booking requests can be edited.' : 'Create a request and send it to Admin for approval.'}</Typography>
    </Box>
    <DialogContent dividers>
      <Stack spacing={1.5} sx={{ pt: .4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1}>
          <TextField label="Booked by" size="small" fullWidth value={bookedByName} InputProps={{ readOnly: true }} />
          <TextField label="Domain / account" size="small" fullWidth value={bookedByAccount || bookedByEmail} InputProps={{ readOnly: true }} />
        </Stack>
        <Typography sx={{ mt: -1, fontSize: '.64rem', color: '#71849A' }}>The booking owner is taken from the authenticated account and cannot be edited.</Typography>
        <TextField label="Meeting title" size="small" fullWidth value={form.title} onChange={change('title')} />
        <TextField label="Meeting room" select size="small" fullWidth value={form.roomId} onChange={change('roomId')}>{activeRooms.map((room) => <MenuItem key={room.id} value={room.id}>{room.name} · {room.capacity} seats · {room.location}</MenuItem>)}</TextField>
        <Box sx={{ borderRadius: 2.3, p: 1.6, bgcolor: '#F5F8FE', border: '1px solid #E1EAF6' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '.75rem', color: '#224A78' }}>Equipment in this room</Typography><Typography sx={{ fontSize: '.69rem', color: '#8296B0' }}>{selectedRoom ? `${selectedRoom.capacity} seats` : 'Choose a room'}</Typography></Stack>
          <EquipmentPills ids={selectedRoom?.equipmentIds} equipment={equipment} limit={0} emptyLabel={selectedRoom ? 'No equipment assigned to this room' : 'Select a meeting room to see its equipment'} />
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1}>
          <TextField label="Date" type="date" size="small" fullWidth value={form.date} onChange={changeDate} InputLabelProps={{ shrink: true }} error={dateTouched && !dateValid} helperText={dateTouched && !dateValid ? (sundaySelected ? 'Sunday is not available for booking.' : `Choose a date from ${minDate} to ${maxDate}.`) : ''} />
          <TimeSelect label="Start time" size="small" fullWidth value={form.startTime} onChange={changeStart} min={minStartTime} max={BOOKING_DEFAULTS.latestStartTime} preserveCurrentValue={Boolean(booking)} />
          <TimeSelect label="End time" size="small" fullWidth value={form.endTime} onChange={change('endTime')} min={minEndTime} max={BUSINESS_END} preserveCurrentValue={Boolean(booking)} />
        </Stack>
        <TextField label="Participants" type="number" size="small" fullWidth value={form.participants} onChange={change('participants')} error={!capacityValid} helperText={!capacityValid ? `Room capacity is ${selectedRoom?.capacity || 0} people.` : selectedRoom ? `Capacity: ${selectedRoom.capacity} people` : ''} inputProps={{ min: 1, max: selectedRoom?.capacity }} />
        {!timeValid && form.startTime && form.endTime && <Typography sx={{ fontSize: '.68rem', color: '#D32F2F' }}>End time must be later than start time.</Typography>}
        {timeValid && !businessHoursValid && <Typography sx={{ fontSize: '.72rem', color: '#D32F2F' }}>Bookings are allowed only from 07:00 to 18:00.</Typography>}
        {timeValid && !durationValid && <Alert severity="warning" sx={{ py: .2 }}>Duration must be between 15 minutes and 11 hours (full working day).</Alert>}
        {dateValid && !futureValid && <Alert severity="warning" sx={{ py: .2 }}>Choose a future start time.</Alert>}
        {roomConflict && <Alert severity="error" sx={{ py: .2 }}>This room already has a pending or approved booking in the selected time slot. Choose another time or room.</Alert>}
        {availability.loading && availability.date === form.date && <Typography variant="caption" color="text.secondary">Checking room availability...</Typography>}
        {availability.error && availability.date === form.date && <Alert severity="warning" sx={{ py: .2 }}>Live availability could not be checked. The server will check when you submit.</Alert>}
        {busyBookings.length > 0 && !availability.loading && <Box sx={{ p: 1, bgcolor: '#F7F9FC', borderRadius: 1.5 }}><Typography sx={{ fontSize: '.73rem', fontWeight: 750, color: '#345A81' }}>Reserved / pending time slots in this room:</Typography>{busyBookings.map((row, i) => <Typography key={`${row.roomId}-${row.startAt}-${i}`} sx={{ fontSize: '.7rem', color: '#607890' }}>{formatTime(row.startAt)}–{formatTime(row.endAt)} · {row.status === BOOKING_STATUS.PENDING ? 'Pending approval' : 'Approved'}</Typography>)}</Box>}
        <Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>Booking hours: Monday–Saturday, 07:00–18:00. Maximum 90 days ahead; 15 minutes–11 hours per meeting (full day: 07:00–18:00).</Typography>
        <TextField label="Purpose / Note" size="small" multiline minRows={3} fullWidth value={form.note} onChange={change('note')} />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 2.4, py: 1.4 }}><Button disabled={saving} onClick={requestClose}>Cancel</Button><Button disabled={!valid || saving} variant="contained" onClick={submit}>{saving ? 'Saving...' : (booking ? 'Save Changes' : 'Submit Booking')}</Button></DialogActions>
  </Dialog>
  <BookingTimeNotice message={bookingTimeNotice} onClose={() => setBookingTimeNotice('')} />
  <ConfirmDialog open={confirmDiscard} title="Discard changes?" message="Any changes to this booking form will be lost." confirmText="Discard changes" confirmColor="warning" onClose={() => setConfirmDiscard(false)} onConfirm={() => { setConfirmDiscard(false); onClose(); }} />
  </>;
}
