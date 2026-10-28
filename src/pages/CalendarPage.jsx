import { HOUR_HEIGHT, START_HOUR, END_HOUR, BOTTOM_GUTTER, TIMELINE_HEIGHT, HOURS, CALENDAR_DAYS, SNAP_MINUTES } from '../constants/calendar.js';
import { CALENDAR_STATUS_COLORS as statusStyle, BOOKING_STATUS, BOOKING_STATUS_GROUPS } from '../constants/statuses.js';
import { BOOKING_DEFAULTS, BOOKING_LIMITS } from '../constants/booking.js';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';
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
import FilterToolbar from '../components/FilterToolbar';
import BookingDialog from '../components/BookingDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusChip from '../components/StatusChip';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';
import { canChangeBooking, canCancelBooking, calculateDayLayout, minutesOf } from '../utils/bookingRules';
import BookingHistory from '../components/BookingHistory';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const mondayOf = (date) => date.subtract((date.day() + 6) % 7, 'day').startOf('day');
const nextBookableDay = (date = dayjs()) => date.day() === 0 ? date.add(1, 'day') : date;

// Tooltip is rendered in a Popper portal so short events never clip booking details.
function BookingHoverDetails({ booking }) {
  const details = [
    ['Room', booking.room],
    ['Date', formatDate(booking.date)],
    ['Time', booking.time],
    ['Booked by', booking.user],
    ['Department', booking.department],
    ['People', booking.participants],
    ['Status', booking.status]
  ];
  if (booking.note) details.push(['Purpose', booking.note]);

  return <Box sx={{ minWidth: 230, maxWidth: 340, p: .5 }}>
    <Typography sx={{ fontSize: '.84rem', fontWeight: 800, color: '#173B63', mb: .85, overflowWrap: 'anywhere' }}>
      {booking.title}
    </Typography>
    <Stack spacing={.55}>
      {details.map(([label, value]) => <Stack key={label} direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ flexShrink: 0, fontSize: '.7rem', color: '#71849A' }}>{label}</Typography>
        <Typography sx={{ fontSize: '.7rem', fontWeight: 700, color: '#314A65', textAlign: 'right', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
          {value ?? '-'}
        </Typography>
      </Stack>)}
    </Stack>
    <Typography sx={{ mt: .85, pt: .75, borderTop: '1px solid #E8EEF5', fontSize: '.64rem', color: '#71849A' }}>
      Click to view details and actions
    </Typography>
  </Box>;
}

export default function CalendarPage() {
  const { user, canViewAllBookings, canManageBookings, canCreateBooking, isReadOnly } = useAuth();
  const { search } = useLocation();
  const navigation = useMemo(() => {
    const params = new URLSearchParams(search);
    const rawDate = params.get('date') || '';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && dayjs(rawDate).isValid() && dayjs(rawDate).format('YYYY-MM-DD') === rawDate ? rawDate : '';
    return { date, roomId: params.get('roomId') || '', bookingId: params.get('bookingId') || '' };
  }, [search]);
  const { bookings, rooms, isOwner, addBooking, updateBooking, cancelBooking, deleteBooking, approveBooking, rejectBooking, refreshCalendar, resetCalendarRange } = useAppData();
  const [weekStart, setWeekStart] = useState(() => mondayOf(navigation.date ? dayjs(navigation.date) : dayjs()));
  const [roomFilter, setRoomFilter] = useState(() => navigation.roomId);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [createState, setCreateState] = useState(null);

  // Also respond when navigation parameters change while the calendar route stays mounted.
  useEffect(() => {
    if (navigation.date) setWeekStart(mondayOf(dayjs(navigation.date)));
    if (navigation.roomId) setRoomFilter(navigation.roomId);
  }, [navigation.date, navigation.roomId]);

  const days = useMemo(() => Array.from({ length: CALENDAR_DAYS }, (_, index) => weekStart.add(index, 'day')), [weekStart]);
  const fromDate = days[0].format('YYYY-MM-DD');
  const toDate = days[days.length - 1].format('YYYY-MM-DD');

  useEffect(() => { refreshCalendar(fromDate, toDate); }, [fromDate, toDate, refreshCalendar]);
  useEffect(() => () => resetCalendarRange(), [resetCalendarRange]);

  const focusedBooking = navigation.bookingId ? bookings.find((row) => row.id === navigation.bookingId) : null;

  const visibleBookings = useMemo(() => bookings.filter((row) => {
    if (row.date < fromDate || row.date > toDate) return false;
    if (roomFilter && row.roomId !== roomFilter) return false;
    if (canViewAllBookings) return BOOKING_STATUS_GROUPS.CALENDAR_MANAGERS.includes(row.status);
    return BOOKING_STATUS_GROUPS.CALENDAR_PUBLIC.includes(row.status) || (row.status === BOOKING_STATUS.PENDING && (row.userId ? row.userId === user?.id : row.user === user?.fullName));
  }), [bookings, fromDate, toDate, roomFilter, canViewAllBookings, user]);

  const openFromGrid = (date, event) => {
    if (!canCreateBooking) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    if (clickY < 0 || clickY >= TIMELINE_HEIGHT) return; // Bottom gutter is not a bookable time slot.
    const y = clamp(clickY, 0, TIMELINE_HEIGHT);
    const roundedMinutes = Math.round((y / HOUR_HEIGHT * 60) / SNAP_MINUTES) * SNAP_MINUTES;
    const totalMinutes = Math.min(START_HOUR * 60 + roundedMinutes, END_HOUR * 60 - SNAP_MINUTES);
    const startHour = Math.floor(totalMinutes / 60);
    const startMinute = totalMinutes % 60;
    const endMinutes = Math.min(totalMinutes + BOOKING_DEFAULTS.slotMinutes, END_HOUR * 60);
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    const fmt = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setCreateState({ date: date.format('YYYY-MM-DD'), startTime: fmt(startHour, startMinute), endTime: fmt(endHour, endMinute), room: roomFilter || '' });
  };

  const canEdit = (row) => !isReadOnly && (canManageBookings || isOwner(row)) && canChangeBooking(row);
  const canCancel = (row) => !isReadOnly && canCancelBooking(row, { isManager: canManageBookings, isOwner: isOwner(row) });
  const canDelete = (row) => !isReadOnly && (canManageBookings || isOwner(row)) && BOOKING_STATUS_GROUPS.DELETABLE.includes(row.status);

  const showEdit = (row) => { setViewTarget(null); setEditTarget(row); };
  const showCancel = (row) => { setViewTarget(null); setCancelTarget(row); };
  const showReject = (row) => { setViewTarget(null); setRejectTarget(row); setRejectReason(''); };

  return <Box sx={{ p: .55 }}>
    <PageHeader
      title="Booking Calendar"
      subtitle={canViewAllBookings ? 'Global calendar: approved and pending requests' : 'Weekly meeting room schedule'}
      actions={canCreateBooking ? <Button size="small" variant="contained" startIcon={<AddOutlined />} onClick={() => { const date = nextBookableDay(); setCreateState({ date: date.format('YYYY-MM-DD'), startTime: BOOKING_DEFAULTS.startTime, endTime: BOOKING_DEFAULTS.endTime, room: '' }); }}>New Booking</Button> : null}
    />
    {focusedBooking && <Alert severity="success" sx={{ mb: 1.3 }}>
      Booking request saved: {focusedBooking.title} · {formatDate(focusedBooking.date)} · {focusedBooking.time}. Status: {focusedBooking.status === BOOKING_STATUS.PENDING ? 'Pending Admin approval' : focusedBooking.status}.
    </Alert>}
    <MainCard content={false}>
      <FilterToolbar sx={{ px: 1.4, py: 1.15, borderBottom: '1px solid #E8EEF5' }}
        actions={<>
          <Tooltip title="Previous week"><IconButton size="small" aria-label="Previous week" onClick={() => setWeekStart((value) => value.subtract(7, 'day'))}><ChevronLeft /></IconButton></Tooltip>
          <Tooltip title="Next week"><IconButton size="small" aria-label="Next week" onClick={() => setWeekStart((value) => value.add(7, 'day'))}><ChevronRight /></IconButton></Tooltip>
          <Button size="small" variant="outlined" startIcon={<TodayOutlined />} onClick={() => setWeekStart(mondayOf(dayjs()))}>Today</Button>
          <Typography sx={{ ml: .6, fontSize: '.8rem', fontWeight: 750, color: '#314A65' }}>{days[0].format('DD MMM')} - {days[5].format('DD MMM YYYY')}</Typography>
        </>}>
        <TextField select size="small" label="Room" value={rooms.some((room) => room.id === roomFilter) ? roomFilter : ''} onChange={(e) => setRoomFilter(e.target.value)} sx={{ minWidth: 185, '& .MuiOutlinedInput-root': { height: 36 } }}>
          <MenuItem value="">All rooms</MenuItem>{rooms.map((room) => <MenuItem key={room.id} value={room.id}>{room.name}</MenuItem>)}
        </TextField>
        <Stack direction="row" spacing={.45} alignItems="center">
          <Chip label="Completed" size="small" sx={{ bgcolor: '#EDF4FF', color: '#235FBC', fontWeight: 700 }} /><Chip label="Approved" size="small" sx={{ bgcolor: '#EAF8F2', color: '#107D4F', fontWeight: 700 }} />
          {canViewAllBookings && <Chip label="Pending" size="small" sx={{ bgcolor: '#FFF7E8', color: '#B56B00', fontWeight: 700 }} />}
        </Stack>
      </FilterToolbar>

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
              height: TIMELINE_HEIGHT + BOTTOM_GUTTER,
              borderRight: '1px solid #E1E8F0',
              bgcolor: '#fff',
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_HEIGHT - 1}px, #EDF2F7 ${HOUR_HEIGHT - 1}px, #EDF2F7 ${HOUR_HEIGHT}px)`
            }}
          >
            {HOURS.map((hour, index) => {
              return <Typography
                key={hour}
                sx={{
                  position: 'absolute',
                  top: index * HOUR_HEIGHT + 4,
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
            const rows = calculateDayLayout(visibleBookings.filter((row) => row.date === iso));
            return <Box key={iso} onClick={canCreateBooking ? (event) => openFromGrid(date, event) : undefined} sx={{ position: 'relative', height: TIMELINE_HEIGHT + BOTTOM_GUTTER, cursor: canCreateBooking ? 'crosshair' : 'default', borderRight: dayIndex === days.length - 1 ? 'none' : '1px solid #E1E8F0', backgroundColor: '#fff', backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_HEIGHT - 1}px, #EDF2F7 ${HOUR_HEIGHT - 1}px, #EDF2F7 ${HOUR_HEIGHT}px)` }}>
              {rows.map((row) => {
                const [start, end] = String(row.time).split(' - ');
                const startMinutes = minutesOf(start) - START_HOUR * 60;
                // Respect the actual booking duration (including 15-minute slots), avoiding
                // visual overlap with a following booking in the same room.
                const duration = Math.max(BOOKING_LIMITS.minMinutes, minutesOf(end) - minutesOf(start));
                const height = clamp(duration / 60 * HOUR_HEIGHT, BOOKING_LIMITS.minMinutes / 60 * HOUR_HEIGHT, HOUR_HEIGHT * 3);
                const top = clamp(startMinutes / 60 * HOUR_HEIGHT, 0, TIMELINE_HEIGHT - height);
                const style = statusStyle[row.status] || statusStyle.APPROVED;
                return <Tooltip
                  key={row.id}
                  title={<BookingHoverDetails booking={row} />}
                  placement="top"
                  arrow
                  enterDelay={0}
                  enterNextDelay={0}
                  disableInteractive
                  componentsProps={{
                    tooltip: { sx: { bgcolor: '#FFFFFF', color: '#314A65', maxWidth: 380, border: '1px solid #E1E8F0', boxShadow: '0 8px 28px rgba(23,59,99,.18)', borderRadius: 1.5 } },
                    arrow: { sx: { color: '#FFFFFF', '&::before': { border: '1px solid #E1E8F0' } } }
                  }}
                >
                  <Box
                    onClick={(event) => { event.stopPropagation(); setViewTarget(row); }}
                    role="button" tabIndex={0} aria-label={`View ${row.title}, ${row.room}, ${start} to ${end}`}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); setViewTarget(row); } }}
                    sx={{ position: 'absolute', outline: navigation.bookingId === row.id ? '2px solid #2563EB' : 'none', outlineOffset: navigation.bookingId === row.id ? 1 : 0, left: `calc(${(row.column / row.columns) * 100}% + 3px)`, width: `calc(${100 / row.columns}% - 6px)`, top, height, bgcolor: style.bg, borderLeft: `3px solid ${style.border}`, borderRadius: 1.1, px: .65, py: height < 26 ? .2 : .4, overflow: 'hidden', cursor: 'pointer', zIndex: 2, '&:hover': { boxShadow: '0 4px 14px rgba(23,59,99,.16)', transform: 'translateY(-1px)', zIndex: 3 } }}
                  >
                    <Typography sx={{ fontSize: '.69rem', fontWeight: 800, lineHeight: 1.2, color: style.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.title}</Typography>
                    {height >= 32 && <Typography sx={{ mt: .2, fontSize: '.6rem', lineHeight: 1.2, color: '#61758B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{start} - {end}</Typography>}
                    {height >= 50 && <Typography sx={{ mt: .2, fontSize: '.61rem', lineHeight: 1.2, color: '#61758B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.room}</Typography>}
                    {height >= 69 && <Typography sx={{ mt: .2, fontSize: '.58rem', lineHeight: 1.2, color: '#71849A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.user}</Typography>}
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
          ['Meeting', viewTarget.title], ['Booked By', viewTarget.user], ['Department', viewTarget.department],
          ['Room', viewTarget.room], ['Date', formatDate(viewTarget.date)], ['Time', viewTarget.time], ['People', viewTarget.participants]
        ].map(([label, value]) => <Stack key={label} direction="row" justifyContent="space-between" spacing={2}><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>{label}</Typography><Typography sx={{ fontSize: '.72rem', color: '#314A65', fontWeight: 700, textAlign: 'right' }}>{value}</Typography></Stack>)}
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>Status</Typography><StatusChip value={viewTarget.status} /></Stack>
        {viewTarget.status === BOOKING_STATUS.APPROVED && <Alert severity="info" sx={{ py: .15, fontSize: '.7rem' }}>Approved bookings cannot be edited. Only Admin or Room Manager can cancel them.</Alert>}
        {(isOwner(viewTarget) || canManageBookings) && <BookingHistory bookingId={viewTarget.id} />}
        {viewTarget.rejectReason && <Stack direction="row" justifyContent="space-between" spacing={2}><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>Reject reason</Typography><Typography sx={{ fontSize: '.72rem', color: '#B42318', fontWeight: 700, textAlign: 'right' }}>{viewTarget.rejectReason}</Typography></Stack>}
      </Stack>}</DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: .5 }}>
        <Button onClick={() => setViewTarget(null)}>Close</Button>
        {viewTarget && canEdit(viewTarget) && BOOKING_STATUS_GROUPS.EDITABLE.includes(viewTarget.status) && <Button startIcon={<EditOutlined />} variant="outlined" onClick={() => showEdit(viewTarget)}>Edit</Button>}
        {viewTarget && canCancel(viewTarget) && BOOKING_STATUS_GROUPS.CANCELLABLE.includes(viewTarget.status) && <Button startIcon={<CancelOutlined />} color="warning" variant="outlined" onClick={() => showCancel(viewTarget)}>Cancel</Button>}
        {viewTarget && canDelete(viewTarget) && BOOKING_STATUS_GROUPS.DELETABLE.includes(viewTarget.status) && <Button startIcon={<DeleteOutlineOutlined />} color="error" variant="outlined" onClick={() => { setDeleteTarget(viewTarget); setViewTarget(null); }}>Delete</Button>}
        {canManageBookings && viewTarget?.status === BOOKING_STATUS.PENDING && <Button startIcon={<CloseOutlined />} color="error" variant="outlined" onClick={() => showReject(viewTarget)}>Reject</Button>}
        {canManageBookings && viewTarget?.status === BOOKING_STATUS.PENDING && canChangeBooking(viewTarget) && <Button startIcon={<CheckOutlined />} color="success" variant="contained" onClick={async () => { if (await approveBooking(viewTarget.id)) setViewTarget(null); }}>Approve</Button>}
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
