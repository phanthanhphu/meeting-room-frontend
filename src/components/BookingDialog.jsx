import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import globalApi from '../routes/globalApi';
import { BOOKING_LIMITS, minutesOf, overlaps } from '../utils/bookingRules';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import bookingBackground from '../assets/booking-background.png';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { EquipmentPills } from './EquipmentDisplay';
import ConfirmDialog from './ConfirmDialog';

const BUSINESS_START = BOOKING_LIMITS.start;
const BUSINESS_END = BOOKING_LIMITS.end;
const nextBookingSlot = () => {
  const now = dayjs();
  let date = now;
  let start = Math.max(9 * 60, Math.ceil((now.hour() * 60 + now.minute() + 1) / 30) * 30);
  if (now.day() === 0 || start > 17 * 60) {
    date = now.add(1, 'day');
    if (date.day() === 0) date = date.add(1, 'day');
    start = 9 * 60;
  }
  const formatMinutes = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  return { date: date.format('YYYY-MM-DD'), startTime: formatMinutes(start), endTime: formatMinutes(start + 60) };
};
const defaultForm = () => ({ title: '', roomId: '', ...nextBookingSlot(), participants: 1, note: '' });

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
  const { equipment, bookings } = useAppData();
  const [availability, setAvailability] = useState({ date: '', rows: [], loading: false, error: '' });
  const [form, setForm] = useState(defaultForm);
  const originalFormRef = useRef(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeRooms = useMemo(() => rooms.filter((room) => room.status === 'ACTIVE'), [rooms]);
  const activeRoomKeys = activeRooms.map((room) => room.id).join('|');
  const selectedRoom = activeRooms.find((room) => room.id === form.roomId);
  const bookedByName = booking?.user || sessionUser?.fullName || sessionUser?.name || '';
  const bookedByAccount = booking?.account || sessionUser?.domainAccount || sessionUser?.username || '';
  const bookedByEmail = booking?.email || sessionUser?.email || '';

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setConfirmDiscard(false);
    const [bookingStart = '09:00', bookingEnd = '10:00'] = String(booking?.time || '').split(' - ');
    const startingForm = booking ? {
      title: booking.title || '', roomId: activeRooms.find((room) => room.id === booking.roomId || room.name === booking.room)?.id || '', date: booking.date || '', startTime: bookingStart, endTime: bookingEnd,
      participants: booking.participants || 1, note: booking.note || ''
    } : {
      ...defaultForm(),
      roomId: activeRooms.find((room) => room.id === defaultRoom || room.name === defaultRoom)?.id || activeRooms[0]?.id || '',
      date: defaultDate || nextBookingSlot().date,
      startTime: defaultStartTime || (!defaultDate ? nextBookingSlot().startTime : '09:00'),
      endTime: defaultEndTime || (!defaultDate ? nextBookingSlot().endTime : '10:00')
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
    globalApi.bookings.calendar(form.date, form.date).then((rows) => {
      if (active) setAvailability({ date: form.date, rows: rows || [], loading: false, error: '' });
    }).catch((error) => {
      if (active) setAvailability({ date: form.date, rows: [], loading: false, error: error.message || 'Unable to check room schedule.' });
    });
    return () => { active = false; };
  }, [open, form.date]);

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const people = Number(form.participants);
  const timeValid = form.startTime && form.endTime && form.startTime < form.endTime;
  const businessHoursValid = form.startTime >= BUSINESS_START && form.endTime <= BUSINESS_END;
  const sundaySelected = Boolean(form.date) && new Date(`${form.date}T00:00:00`).getDay() === 0;
  const capacityValid = !selectedRoom || (people > 0 && Number.isInteger(people) && people <= selectedRoom.capacity);
  const minDate = dayjs().format('YYYY-MM-DD');
  const maxDate = dayjs().add(BOOKING_LIMITS.advanceDays, 'day').format('YYYY-MM-DD');
  const dateValid = Boolean(form.date) && form.date >= minDate && form.date <= maxDate;
  const durationMinutes = minutesOf(form.endTime) - minutesOf(form.startTime);
  const durationValid = timeValid && durationMinutes >= BOOKING_LIMITS.minMinutes && durationMinutes <= BOOKING_LIMITS.maxMinutes;
  const futureValid = Boolean(form.date && form.startTime) && dayjs(`${form.date}T${form.startTime}`).isAfter(dayjs());
  const busyBookings = availability.date === form.date ? availability.rows.filter((row) =>
    row.status === 'APPROVED' && row.room?.id === form.roomId && row.id !== booking?.id
  ) : [];
  const roomConflict = timeValid && busyBookings.some((row) => overlaps(
    minutesOf(form.startTime), minutesOf(form.endTime),
    minutesOf(dayjs(row.startAt).format('HH:mm')), minutesOf(dayjs(row.endAt).format('HH:mm'))
  ));
  const myConflict = Boolean(sessionUser) && timeValid && bookings.some((row) =>
    row.id !== booking?.id && row.userId === sessionUser.id && row.date === form.date &&
    ['PENDING', 'APPROVED'].includes(row.status) && overlaps(
      minutesOf(form.startTime), minutesOf(form.endTime),
      minutesOf(String(row.time).split(' - ')[0]), minutesOf(String(row.time).split(' - ')[1])
    )
  );
  const valid = form.title.trim() && selectedRoom && dateValid && futureValid && timeValid && durationValid &&
    businessHoursValid && !sundaySelected && people > 0 && capacityValid && !roomConflict && !myConflict &&
    !(availability.date === form.date && availability.loading);
  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return <><Dialog open={open} onClose={requestClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
    <Box sx={{ backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.94),rgba(255,255,255,.72)),url(${bookingBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid #E3EAF1' }}>
      <DialogTitle sx={{ pb: .4, fontSize: '1.1rem', fontWeight: 850, color: '#173B63' }}>{booking ? 'Edit Meeting Booking' : 'New Meeting Room Booking'}</DialogTitle>
      <Typography sx={{ px: 3, pb: 1.4, fontSize: '.68rem', color: '#61758B' }}>{booking ? 'Approved booking changes will require approval again.' : 'Create a request and send it to Admin for approval.'}</Typography>
    </Box>
    <DialogContent dividers>
      <Stack spacing={1.5} sx={{ pt: .4 }}>
        {booking?.status === 'APPROVED' && <Alert severity="warning" sx={{ py: .2, fontSize: '.72rem' }}>Editing an approved booking changes it back to PENDING.</Alert>}
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
          <TextField label="Date" type="date" size="small" fullWidth value={form.date} onChange={change('date')} InputLabelProps={{ shrink: true }} inputProps={{ min: minDate, max: maxDate }} error={!dateValid || sundaySelected} helperText={sundaySelected ? 'Sunday is not available for booking.' : !dateValid ? 'Choose a date within the next 90 days.' : ''} />
          <TextField label="Start time" type="time" size="small" fullWidth value={form.startTime} onChange={change('startTime')} InputLabelProps={{ shrink: true }} inputProps={{ min: BUSINESS_START, max: '17:45', step: 900 }} />
          <TextField label="End time" type="time" size="small" fullWidth value={form.endTime} onChange={change('endTime')} InputLabelProps={{ shrink: true }} inputProps={{ min: '07:15', max: BUSINESS_END, step: 900 }} />
        </Stack>
        <TextField label="Participants" type="number" size="small" fullWidth value={form.participants} onChange={change('participants')} error={!capacityValid} helperText={!capacityValid ? `Room capacity is ${selectedRoom?.capacity || 0} people.` : selectedRoom ? `Capacity: ${selectedRoom.capacity} people` : ''} inputProps={{ min: 1, max: selectedRoom?.capacity }} />
        {!timeValid && form.startTime && form.endTime && <Typography sx={{ fontSize: '.68rem', color: '#D32F2F' }}>End time must be later than start time.</Typography>}
        {timeValid && !businessHoursValid && <Typography sx={{ fontSize: '.72rem', color: '#D32F2F' }}>Bookings are allowed only from 07:00 to 18:00.</Typography>}
        {timeValid && !durationValid && <Alert severity="warning" sx={{ py: .2 }}>Duration must be between 15 minutes and 4 hours.</Alert>}
        {dateValid && !futureValid && <Alert severity="warning" sx={{ py: .2 }}>Start time must be in the future.</Alert>}
        {myConflict && <Alert severity="error" sx={{ py: .2 }}>You already have a pending or approved meeting during this time.</Alert>}
        {roomConflict && <Alert severity="error" sx={{ py: .2 }}>This room has an approved meeting in the selected time slot. Choose another time or room.</Alert>}
        {availability.loading && availability.date === form.date && <Typography variant="caption" color="text.secondary">Checking room availability...</Typography>}
        {availability.error && availability.date === form.date && <Alert severity="warning" sx={{ py: .2 }}>Live availability could not be checked. The server will check when you submit.</Alert>}
        {busyBookings.length > 0 && !availability.loading && <Box sx={{ p: 1, bgcolor: '#F7F9FC', borderRadius: 1.5 }}><Typography sx={{ fontSize: '.73rem', fontWeight: 750, color: '#345A81' }}>Approved bookings in this room:</Typography>{busyBookings.map((row) => <Typography key={row.id} sx={{ fontSize: '.7rem', color: '#607890' }}>{dayjs(row.startAt).format('HH:mm')}–{dayjs(row.endAt).format('HH:mm')} · {row.title}</Typography>)}</Box>}
        <Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>Booking hours: Monday–Saturday, 07:00–18:00. Maximum 90 days ahead; 15–240 minutes per meeting.</Typography>
        <TextField label="Purpose / Note" size="small" multiline minRows={3} fullWidth value={form.note} onChange={change('note')} />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 2.4, py: 1.4 }}><Button disabled={saving} onClick={requestClose}>Cancel</Button><Button disabled={!valid || saving} variant="contained" onClick={submit}>{saving ? 'Saving...' : (booking ? 'Save Changes' : 'Submit Booking')}</Button></DialogActions>
  </Dialog>
  <ConfirmDialog open={confirmDiscard} title="Discard changes?" message="Any changes to this booking form will be lost." confirmText="Discard changes" confirmColor="warning" onClose={() => setConfirmDiscard(false)} onConfirm={() => { setConfirmDiscard(false); onClose(); }} />
  </>;
}
