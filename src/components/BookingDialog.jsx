import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import bookingBackground from '../assets/booking-background.png';
import { useAuth } from '../context/AuthContext';

const bookableDate = () => {
  const date = new Date();
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date.toLocaleDateString('sv-SE');
};
const BUSINESS_START = '07:00';
const BUSINESS_END = '18:00';
const empty = { title: '', room: '', date: bookableDate(), startTime: '09:00', endTime: '10:00', participants: 1, note: '' };

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
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const activeRooms = useMemo(() => rooms.filter((room) => room.status === 'ACTIVE'), [rooms]);
  const selectedRoom = activeRooms.find((room) => room.name === form.room);
  const bookedByName = booking?.user || sessionUser?.fullName || sessionUser?.name || '';
  const bookedByAccount = booking?.account || sessionUser?.domainAccount || sessionUser?.username || '';
  const bookedByEmail = booking?.email || sessionUser?.email || '';

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    const [bookingStart = '09:00', bookingEnd = '10:00'] = String(booking?.time || '').split(' - ');
    setForm(booking ? {
      title: booking.title || '', room: booking.room || '', date: booking.date || '', startTime: bookingStart, endTime: bookingEnd,
      participants: booking.participants || 1, note: booking.note || ''
    } : {
      ...empty,
      room: defaultRoom || activeRooms[0]?.name || '',
      date: defaultDate || empty.date,
      startTime: defaultStartTime || empty.startTime,
      endTime: defaultEndTime || empty.endTime
    });
  }, [open, booking, defaultRoom, defaultDate, defaultStartTime, defaultEndTime, activeRooms]);

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const people = Number(form.participants);
  const timeValid = form.startTime && form.endTime && form.startTime < form.endTime;
  const businessHoursValid = form.startTime >= BUSINESS_START && form.endTime <= BUSINESS_END;
  const sundaySelected = Boolean(form.date) && new Date(`${form.date}T00:00:00`).getDay() === 0;
  const capacityValid = !selectedRoom || (people > 0 && people <= selectedRoom.capacity);
  const valid = form.title.trim() && form.room && form.date && timeValid && businessHoursValid && !sundaySelected && people > 0 && capacityValid;
  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2.2, overflow: 'hidden' } }}>
    <Box sx={{ backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.94),rgba(255,255,255,.72)),url(${bookingBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid #E3EAF1' }}>
      <DialogTitle sx={{ pb: .4, fontSize: '1rem', fontWeight: 800, color: '#173B63' }}>{booking ? 'Edit Meeting Booking' : 'New Meeting Room Booking'}</DialogTitle>
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
        <TextField label="Room" select size="small" fullWidth value={form.room} onChange={change('room')}>{activeRooms.map((room) => <MenuItem key={room.id} value={room.name}>{room.name} · {room.capacity} people</MenuItem>)}</TextField>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1}>
          <TextField label="Date" type="date" size="small" fullWidth value={form.date} onChange={change('date')} InputLabelProps={{ shrink: true }} inputProps={{ min: bookableDate() }} error={sundaySelected} helperText={sundaySelected ? 'Sunday is not available for booking.' : ''} />
          <TextField label="Start time" type="time" size="small" fullWidth value={form.startTime} onChange={change('startTime')} InputLabelProps={{ shrink: true }} inputProps={{ min: BUSINESS_START, max: '17:45', step: 900 }} />
          <TextField label="End time" type="time" size="small" fullWidth value={form.endTime} onChange={change('endTime')} InputLabelProps={{ shrink: true }} inputProps={{ min: '07:15', max: BUSINESS_END, step: 900 }} />
        </Stack>
        <TextField label="Participants" type="number" size="small" fullWidth value={form.participants} onChange={change('participants')} error={!capacityValid} helperText={!capacityValid ? `Room capacity is ${selectedRoom?.capacity || 0} people.` : selectedRoom ? `Capacity: ${selectedRoom.capacity} people` : ''} inputProps={{ min: 1, max: selectedRoom?.capacity }} />
        {!timeValid && form.startTime && form.endTime && <Typography sx={{ fontSize: '.68rem', color: '#D32F2F' }}>End time must be later than start time.</Typography>}
        {timeValid && !businessHoursValid && <Typography sx={{ fontSize: '.68rem', color: '#D32F2F' }}>Bookings are allowed only from 07:00 to 18:00.</Typography>}
        <Typography sx={{ fontSize: '.66rem', color: '#71849A' }}>Booking hours: Monday–Saturday, 07:00–18:00. Sunday is closed.</Typography>
        <TextField label="Purpose / Note" size="small" multiline minRows={3} fullWidth value={form.note} onChange={change('note')} />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 2.4, py: 1.4 }}><Button onClick={onClose}>Cancel</Button><Button disabled={!valid || saving} variant="contained" onClick={submit}>{saving ? 'Saving...' : (booking ? 'Save Changes' : 'Submit Booking')}</Button></DialogActions>
  </Dialog>;
}
