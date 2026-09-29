import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem,
  Stack, TextField, Tooltip, Typography
} from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import MainCard from '../components/MainCard';
import PageHeader from '../components/PageHeader';
import BookingDialog from '../components/BookingDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusChip from '../components/StatusChip';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';

const HOUR_HEIGHT = 52;
const START_HOUR = 7;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);

const statusStyle = {
  APPROVED: { bg: '#E9F8F2', border: '#2CA87F', text: '#176B50' },
  PENDING: { bg: '#FFF5E6', border: '#E58A00', text: '#8A5700' },
  REJECTED: { bg: '#FFEDEF', border: '#DC2626', text: '#9F1D28' },
  CANCELLED: { bg: '#F2F5F7', border: '#7A8A99', text: '#536A80' }
};

const minutesOf = (time) => {
  const [h = 0, m = 0] = String(time || '00:00').split(':').map(Number);
  return h * 60 + m;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const mondayOf = (date) => date.subtract((date.day() + 6) % 7, 'day').startOf('day');
const nextBookableDay = (date = dayjs()) => date.day() === 0 ? date.add(1, 'day') : date;

export default function CalendarPage() {
  const { user, canViewAllBookings, canManageBookings, canCreateBooking, isReadOnly } = useAuth();
  const { bookings, rooms, isOwner, addBooking, updateBooking, cancelBooking, deleteBooking, approveBooking, rejectBooking, refreshCalendar } = useAppData();
  const [weekStart, setWeekStart] = useState(() => mondayOf(dayjs()));
  const [roomFilter, setRoomFilter] = useState('');
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [createState, setCreateState] = useState(null);

  const days = useMemo(() => Array.from({ length: 6 }, (_, index) => weekStart.add(index, 'day')), [weekStart]);
  const fromDate = days[0].format('YYYY-MM-DD');
  const toDate = days[days.length - 1].format('YYYY-MM-DD');

  useEffect(() => { refreshCalendar(fromDate, toDate); }, [fromDate, toDate, refreshCalendar]);

  const visibleBookings = useMemo(() => bookings.filter((row) => {
    if (row.date < fromDate || row.date > toDate) return false;
    if (roomFilter && row.room !== roomFilter) return false;
    if (canViewAllBookings) return ['PENDING', 'APPROVED'].includes(row.status);
    return row.status === 'APPROVED' || (row.status === 'PENDING' && (row.userId ? row.userId === user?.id : row.user === user?.fullName));
  }), [bookings, fromDate, toDate, roomFilter, canViewAllBookings, user]);

  const openFromGrid = (date, event) => {
    if (!canCreateBooking) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const y = clamp(event.clientY - rect.top, 0, HOUR_HEIGHT * (END_HOUR - START_HOUR));
    const roundedMinutes = Math.round((y / HOUR_HEIGHT * 60) / 30) * 30;
    const totalMinutes = Math.min(START_HOUR * 60 + roundedMinutes, END_HOUR * 60 - 30);
    const startHour = Math.floor(totalMinutes / 60);
    const startMinute = totalMinutes % 60;
    const endMinutes = Math.min(totalMinutes + 60, END_HOUR * 60);
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setCreateState({ date: date.format('YYYY-MM-DD'), startTime: fmt(startHour, startMinute), endTime: fmt(endHour, endMinute), room: roomFilter || '' });
  };

  const canEdit = (row) => !isReadOnly && (canManageBookings || isOwner(row)) && ['PENDING', 'APPROVED'].includes(row.status);
  const canCancel = (row) => !isReadOnly && (canManageBookings || isOwner(row)) && ['PENDING', 'APPROVED'].includes(row.status);
  const canDelete = (row) => !isReadOnly && (canManageBookings || isOwner(row)) && ['REJECTED', 'CANCELLED'].includes(row.status);

  const showEdit = (row) => { setViewTarget(null); setEditTarget(row); };
  const showCancel = (row) => { setViewTarget(null); setCancelTarget(row); };
  const showReject = (row) => { setViewTarget(null); setRejectTarget(row); setRejectReason(''); };

  return <Box sx={{ p: .55 }}>
    <PageHeader
      title="Booking Calendar"
      subtitle={canViewAllBookings ? 'Global calendar: approved and pending requests' : 'Weekly meeting room schedule'}
      actions={canCreateBooking ? <Button size="small" variant="contained" startIcon={<AddOutlined />} onClick={() => { const date = nextBookableDay(); setCreateState({ date: date.format('YYYY-MM-DD'), startTime: '09:00', endTime: '10:00', room: '' }); }}>New Booking</Button> : null}
    />
    <MainCard content={false}>
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'center' }} spacing={1} sx={{ px: 1.4, py: 1, borderBottom: '1px solid #E8EEF5' }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Previous week"><IconButton size="small" onClick={() => setWeekStart((value) => value.subtract(7, 'day'))}><ChevronLeft /></IconButton></Tooltip>
          <Tooltip title="Next week"><IconButton size="small" onClick={() => setWeekStart((value) => value.add(7, 'day'))}><ChevronRight /></IconButton></Tooltip>
          <Button size="small" variant="outlined" startIcon={<TodayOutlined />} onClick={() => setWeekStart(mondayOf(dayjs()))}>Today</Button>
          <Typography sx={{ ml: .6, fontSize: '.8rem', fontWeight: 750, color: '#314A65' }}>{days[0].format('DD MMM')} - {days[5].format('DD MMM YYYY')}</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={.65} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField select size="small" label="Room" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} sx={{ minWidth: 185, '& .MuiOutlinedInput-root': { height: 36 } }}>
            <MenuItem value="">All rooms</MenuItem>{rooms.map((room) => <MenuItem key={room.id} value={room.name}>{room.name}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={.45}>
            <Chip label="Approved" size="small" sx={{ bgcolor: '#EAF8F2', color: '#107D4F', fontWeight: 700 }} />
            {canViewAllBookings && <Chip label="Pending" size="small" sx={{ bgcolor: '#FFF7E8', color: '#B56B00', fontWeight: 700 }} />}
          </Stack>
        </Stack>
      </Stack>

      <Box sx={{ overflowX: 'auto', border: '1px solid #E1E8F0', borderRadius: 1.5, overflowY: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '72px repeat(6, minmax(165px,1fr))', minWidth: 1120, bgcolor: '#fff' }}>
          <Box sx={{ minHeight: 54, borderRight: '1px solid #E1E8F0', borderBottom: '1px solid #E1E8F0', bgcolor: '#FAFBFD' }} />
          {days.map((date, dayIndex) => <Box key={date.format('YYYY-MM-DD')} sx={{ minHeight: 54, py: .85, textAlign: 'center', borderRight: dayIndex === days.length - 1 ? 'none' : '1px solid #E1E8F0', borderBottom: '1px solid #E1E8F0', bgcolor: '#FAFBFD' }}>
            <Typography sx={{ fontSize: '.68rem', color: '#71849A', fontWeight: 700 }}>{date.format('ddd')}</Typography>
            <Typography sx={{ mt: .15, fontSize: '.9rem', color: '#173B63', fontWeight: 800 }}>{date.format('DD')}</Typography>
          </Box>)}

          <Box
            sx={{
              position: 'relative',
              height: HOUR_HEIGHT * (END_HOUR - START_HOUR),
              borderRight: '1px solid #E1E8F0',
              bgcolor: '#fff',
              backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 51px, #EDF2F7 51px, #EDF2F7 52px)'
            }}
          >
            {HOURS.map((hour, index) => {
              const isFirst = index === 0;
              const isLast = index === HOURS.length - 1;
              return <Typography
                key={hour}
                sx={{
                  position: 'absolute',
                  top: isFirst ? 6 : isLast ? 'auto' : index * HOUR_HEIGHT + 4,
                  bottom: isLast ? 4 : 'auto',
                  right: 9,
                  px: .35,
                  lineHeight: 1.2,
                  fontSize: '.66rem',
                  color: '#71849A',
                  bgcolor: '#fff',
                  zIndex: 1
                }}
              >{String(hour).padStart(2, '0')}:00</Typography>;
            })}
          </Box>

          {days.map((date, dayIndex) => {
            const iso = date.format('YYYY-MM-DD');
            const rows = visibleBookings.filter((row) => row.date === iso);
            return <Box key={iso} onClick={canCreateBooking ? (event) => openFromGrid(date, event) : undefined} sx={{ position: 'relative', height: HOUR_HEIGHT * (END_HOUR - START_HOUR), cursor: canCreateBooking ? 'crosshair' : 'default', borderRight: dayIndex === days.length - 1 ? 'none' : '1px solid #E1E8F0', backgroundColor: '#fff', backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 51px, #EDF2F7 51px, #EDF2F7 52px)' }}>
              {rows.map((row) => {
                const [start, end] = String(row.time).split(' - ');
                const startMinutes = minutesOf(start) - START_HOUR * 60;
                const duration = Math.max(30, minutesOf(end) - minutesOf(start));
                const top = clamp(startMinutes / 60 * HOUR_HEIGHT, 0, HOUR_HEIGHT * (END_HOUR - START_HOUR) - 26);
                const height = clamp(duration / 60 * HOUR_HEIGHT, 28, HOUR_HEIGHT * 3);
                const style = statusStyle[row.status] || statusStyle.APPROVED;
                return <Tooltip key={row.id} title="Click to view actions">
                  <Box
                    onClick={(event) => { event.stopPropagation(); setViewTarget(row); }}
                    sx={{ position: 'absolute', left: 5, right: 5, top, height, bgcolor: style.bg, borderLeft: `3px solid ${style.border}`, borderRadius: 1.1, px: .8, py: .55, overflow: 'hidden', cursor: 'pointer', zIndex: 2, '&:hover': { boxShadow: '0 4px 14px rgba(23,59,99,.16)', transform: 'translateY(-1px)' } }}
                  >
                    <Typography sx={{ fontSize: '.69rem', fontWeight: 800, color: style.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.title}</Typography>
                    <Typography sx={{ mt: .12, fontSize: '.61rem', color: '#61758B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.room}</Typography>
                    {height > 48 && <Typography sx={{ mt: .1, fontSize: '.58rem', color: '#71849A' }}>{start} - {end} · {row.user}</Typography>}
                  </Box>
                </Tooltip>;
              })}
            </Box>;
          })}
        </Box>
      </Box>
    </MainCard>

    <BookingDialog
      open={Boolean(createState)}
      onClose={() => setCreateState(null)}
      onSave={async (form) => { if (await addBooking(form)) setCreateState(null); }}
      rooms={rooms}
      defaultRoom={createState?.room || ''}
      defaultDate={createState?.date || ''}
      defaultStartTime={createState?.startTime || ''}
      defaultEndTime={createState?.endTime || ''}
    />
    <BookingDialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} booking={editTarget} rooms={rooms} onSave={async (form) => { if (await updateBooking(editTarget.id, form)) setEditTarget(null); }} />

    <Dialog open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Booking Details & Actions</DialogTitle>
      <DialogContent dividers>{viewTarget && <Stack spacing={.8}>
        {(!canManageBookings && (!isOwner(viewTarget) || isReadOnly)) && <Alert severity="info" sx={{ py: .15, fontSize: '.7rem' }}>{isReadOnly ? 'This account is read-only.' : 'This meeting belongs to another user. It is view-only.'}</Alert>}
        {[
          ['Booking ID', viewTarget.id], ['Meeting', viewTarget.title], ['Booked By', viewTarget.user], ['Department', viewTarget.department],
          ['Room', viewTarget.room], ['Date', formatDate(viewTarget.date)], ['Time', viewTarget.time], ['People', viewTarget.participants]
        ].map(([label, value]) => <Stack key={label} direction="row" justifyContent="space-between" spacing={2}><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>{label}</Typography><Typography sx={{ fontSize: '.72rem', color: '#314A65', fontWeight: 700, textAlign: 'right' }}>{value}</Typography></Stack>)}
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>Status</Typography><StatusChip value={viewTarget.status} /></Stack>
        {viewTarget.rejectReason && <Stack direction="row" justifyContent="space-between" spacing={2}><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>Reject reason</Typography><Typography sx={{ fontSize: '.72rem', color: '#B42318', fontWeight: 700, textAlign: 'right' }}>{viewTarget.rejectReason}</Typography></Stack>}
      </Stack>}</DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: .5 }}>
        <Button onClick={() => setViewTarget(null)}>Close</Button>
        {viewTarget && canEdit(viewTarget) && ['PENDING', 'APPROVED'].includes(viewTarget.status) && <Button startIcon={<EditOutlined />} variant="outlined" onClick={() => showEdit(viewTarget)}>Edit</Button>}
        {viewTarget && canCancel(viewTarget) && ['PENDING', 'APPROVED'].includes(viewTarget.status) && <Button startIcon={<CancelOutlined />} color="warning" variant="outlined" onClick={() => showCancel(viewTarget)}>Cancel</Button>}
        {viewTarget && canDelete(viewTarget) && ['REJECTED', 'CANCELLED'].includes(viewTarget.status) && <Button startIcon={<DeleteOutlineOutlined />} color="error" variant="outlined" onClick={() => { setDeleteTarget(viewTarget); setViewTarget(null); }}>Delete</Button>}
        {canManageBookings && viewTarget?.status === 'PENDING' && <Button startIcon={<CloseOutlined />} color="error" variant="outlined" onClick={() => showReject(viewTarget)}>Reject</Button>}
        {canManageBookings && viewTarget?.status === 'PENDING' && <Button startIcon={<CheckOutlined />} color="success" variant="contained" onClick={async () => { if (await approveBooking(viewTarget.id)) setViewTarget(null); }}>Approve</Button>}
      </DialogActions>
    </Dialog>

    <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Reject Booking</DialogTitle>
      <DialogContent><Typography sx={{ mb: 1, fontSize: '.72rem', color: '#61758B' }}>{rejectTarget ? `${rejectTarget.id} - ${rejectTarget.title}` : ''}</Typography><TextField autoFocus label="Reject reason" multiline minRows={3} fullWidth value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></DialogContent>
      <DialogActions><Button onClick={() => setRejectTarget(null)}>Cancel</Button><Button color="error" variant="contained" disabled={!rejectReason.trim()} onClick={async () => { if (await rejectBooking(rejectTarget.id, rejectReason)) { setRejectTarget(null); setRejectReason(''); } }}>Reject</Button></DialogActions>
    </Dialog>

    <ConfirmDialog open={Boolean(cancelTarget)} title="Cancel Booking" message={cancelTarget ? `Cancel ${cancelTarget.id} - ${cancelTarget.title}?` : ''} confirmText="Cancel Booking" confirmColor="warning" onClose={() => setCancelTarget(null)} onConfirm={async () => { if (await cancelBooking(cancelTarget.id)) setCancelTarget(null); }} />
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete Booking" message={deleteTarget ? `Delete ${deleteTarget.id}? This action cannot be undone.` : ''} confirmText="Delete" onClose={() => setDeleteTarget(null)} onConfirm={async () => { if (await deleteBooking(deleteTarget.id)) setDeleteTarget(null); }} />
  </Box>;
}
