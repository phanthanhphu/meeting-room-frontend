import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import globalApi from '../routes/globalApi';
import { overlaps, minutesOf, BOOKING_LIMITS } from '../utils/bookingRules';
import { Alert, Box, Button, Chip, InputAdornment, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import FilterAltOffRounded from '@mui/icons-material/FilterAltOffRounded';
import { EquipmentPills } from '../components/EquipmentDisplay';
import PageHeader from '../components/PageHeader';
import FilterToolbar from '../components/FilterToolbar';
import DataTable from '../components/DataTable';
import BookingDialog from '../components/BookingDialog';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

const card = { border: '1px solid #E4EBF4', borderRadius: 3, boxShadow: '0 8px 24px rgba(31,54,86,.045)' };

export default function RoomsPage() {
  const { canCreateBooking, isReadOnly } = useAuth();
  const navigate = useNavigate();
  const { rooms, equipment, addBooking } = useAppData();
  const [open, setOpen] = useState(false);
  const [defaultRoom, setDefaultRoom] = useState('');
  const [bookingDefaults, setBookingDefaults] = useState(null);
  const [availableDate, setAvailableDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [appliedSlot, setAppliedSlot] = useState(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const searchVersion = useRef(0);
  const [slotError, setSlotError] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('ALL');
  const [status, setStatus] = useState('ACTIVE');
  const [deviceId, setDeviceId] = useState('ALL');
  const [minCapacity, setMinCapacity] = useState('');
  const defaults = { query: '', location: 'ALL', status: 'ACTIVE', deviceId: 'ALL', minCapacity: '' };
  const [applied, setApplied] = useState(defaults);
  const visible = useMemo(() => rooms.filter((room) => {
    const search = `${room.code} ${room.name} ${room.location} ${(room.equipmentIds || []).map((id) => equipment.find((x) => x.id === id)?.name || '').join(' ')}`.toLowerCase();
    const unavailable = appliedSlot && appliedSlot.rows.some((item) => item.status === 'APPROVED' && item.room?.id === room.id && overlaps(minutesOf(appliedSlot.start), minutesOf(appliedSlot.end), minutesOf(dayjs(item.startAt).format('HH:mm')), minutesOf(dayjs(item.endAt).format('HH:mm'))));
    return !unavailable && search.includes(applied.query.trim().toLowerCase()) && (applied.location === 'ALL' || room.location === applied.location) && (applied.status === 'ALL' || room.status === applied.status) && (applied.deviceId === 'ALL' || (room.equipmentIds || []).includes(applied.deviceId)) && (!applied.minCapacity || room.capacity >= Number(applied.minCapacity));
  }), [rooms, equipment, applied, appliedSlot]);
  const tableRows = useMemo(() => visible.map((room) => ({ ...room, equipmentCount: (room.equipmentIds || []).length })), [visible]);
  const allLocations = [...new Set(rooms.map((room) => room.location).filter(Boolean))].sort();
  const applyFilters = async () => {
    const requestId = ++searchVersion.current;
    if (availableDate) {
      const duration = minutesOf(endTime) - minutesOf(startTime);
      if (availableDate < dayjs().format('YYYY-MM-DD') || availableDate > dayjs().add(90, 'day').format('YYYY-MM-DD') || dayjs(availableDate).day() === 0) {
        setSlotError('Choose a Monday–Saturday date within the next 90 days.'); return;
      }
      if (duration < BOOKING_LIMITS.minMinutes || duration > BOOKING_LIMITS.maxMinutes || startTime < BOOKING_LIMITS.start || endTime > BOOKING_LIMITS.end) {
        setSlotError('Choose a valid slot between 07:00 and 18:00, lasting 15–240 minutes.'); return;
      }
      if (!dayjs(`${availableDate}T${startTime}`).isAfter(dayjs())) { setSlotError('Choose a future start time.'); return; }
      setSlotLoading(true); setSlotError(''); setAppliedSlot(null);
      try {
        const rows = await globalApi.bookings.calendar(availableDate, availableDate);
        if (requestId === searchVersion.current) setAppliedSlot({ date: availableDate, start: startTime, end: endTime, rows: rows || [] });
      } catch (error) { if (requestId === searchVersion.current) setSlotError(error.message || 'Could not check availability.'); }
      finally { if (requestId === searchVersion.current) setSlotLoading(false); }
    } else { setAppliedSlot(null); setSlotError(''); }
    setApplied({ query, location, status, deviceId, minCapacity });
  };
  const reset = () => { ++searchVersion.current; setSlotLoading(false); setAvailableDate(''); setStartTime('09:00'); setEndTime('10:00'); setAppliedSlot(null); setSlotError(''); setQuery(''); setLocation('ALL'); setStatus('ACTIVE'); setDeviceId('ALL'); setMinCapacity(''); setApplied({ query: '', location: 'ALL', status: 'ACTIVE', deviceId: 'ALL', minCapacity: '' }); };
  const startBooking = (roomId = '') => { setDefaultRoom(roomId); setBookingDefaults(appliedSlot); setOpen(true); };
  const saveBooking = async (form) => {
    const created = await addBooking(form);
    if (!created) return; // Stay in the dialog if the server rejected the request.
    setOpen(false);
    const params = new URLSearchParams({
      date: created.date || form.date,
      roomId: created.roomId || form.roomId,
      bookingId: String(created.id || '')
    });
    navigate(`/calendar?${params.toString()}`);
  };
  return <Box sx={{ p: { xs: .7, md: 1.2 } }}>
    <PageHeader title="Meeting Rooms"
      subtitle="Browse rooms, compare seating and installed equipment, then reserve a suitable space."
      actions={canCreateBooking && <Button variant="contained" onClick={() => startBooking()} startIcon={<AddRounded />}>New booking</Button>} />
    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1} sx={{ mb: 1.6 }}>
      <Chip icon={<MeetingRoomOutlined />} label={`${rooms.filter((r) => r.status === 'ACTIVE').length} active rooms`} size="small" variant="outlined" />
      <Chip icon={<GroupsOutlined />} label={`${rooms.reduce((a, r) => a + (r.status === 'ACTIVE' ? Number(r.capacity) : 0), 0)} seats`} size="small" variant="outlined" />
    </Stack>
    <Paper sx={{ ...card, mb: 2, p: { xs: 1.45, md: 1.9 } }}>
      <FilterToolbar
        actions={<><Button startIcon={<SearchRounded />} variant="contained" size="small" disabled={slotLoading} onClick={applyFilters}>{slotLoading ? 'Checking...' : 'Search'}</Button><Button startIcon={<FilterAltOffRounded />} variant="outlined" size="small" onClick={reset}>Reset</Button></>}
        summary={<Typography sx={{ color: '#7489A4', fontSize: '.73rem' }}>Showing <strong>{visible.length}</strong> of {rooms.length} rooms</Typography>}>
        <TextField placeholder="Search rooms or equipment..." size="small" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: '#92A7BF', fontSize: 20 }} /></InputAdornment> }} />
        <TextField select label="Floor / location" size="small" value={location} onChange={(e) => setLocation(e.target.value)}><MenuItem value="ALL">All locations</MenuItem>{allLocations.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
        <TextField select label="Equipment" size="small" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}><MenuItem value="ALL">Any equipment</MenuItem>{equipment.filter((x) => x.status !== 'INACTIVE').map((v) => <MenuItem value={v.id} key={v.id}>{v.name}</MenuItem>)}</TextField>
        <TextField select label="Status" size="small" value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="ALL">All statuses</MenuItem><MenuItem value="ACTIVE">Active / bookable</MenuItem><MenuItem value="MAINTENANCE">Maintenance</MenuItem><MenuItem value="DISABLED">Disabled</MenuItem></TextField>
        <TextField label="Free on date (optional)" type="date" size="small" value={availableDate} onChange={(e) => setAvailableDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: dayjs().format('YYYY-MM-DD'), max: dayjs().add(90, 'day').format('YYYY-MM-DD') }} />
        {availableDate && <><TextField label="From" type="time" size="small" value={startTime} onChange={(e) => setStartTime(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: '07:00', max: '17:45', step: 900 }} /><TextField label="To" type="time" size="small" value={endTime} onChange={(e) => setEndTime(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: '07:15', max: '18:00', step: 900 }} /></>}
        <TextField label="Min. seats" size="small" type="number" value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)} inputProps={{ min: 1, step: 1 }} sx={{ maxWidth: { md: 135 } }} />
      </FilterToolbar>
    </Paper>
    {slotError && <Alert severity="error" sx={{ mb: 1.5 }}>{slotError}</Alert>}
    {appliedSlot && <Alert severity="info" sx={{ mb: 1.5 }}>Only rooms without approved meetings on {appliedSlot.date}, {appliedSlot.start}–{appliedSlot.end} are shown. Pending requests may still be awaiting approval.</Alert>}
    <Paper sx={{ ...card, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.4, borderBottom: '1px solid #E7ECF4' }}>
        <Typography sx={{ fontSize: '.9rem', fontWeight: 850, color: '#17345A' }}>Meeting room list</Typography>
        <Typography sx={{ fontSize: '.72rem', color: '#7A8CA5', mt: .3 }}>
          Compare rooms in a table, sort by column and choose a room to book. Booking requests require approval.
        </Typography>
      </Box>
      <DataTable
        rows={tableRows}
        searchable={false}
        getKey={(room) => room.id}
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        columns={[
          {
            key: 'name', label: 'Room name',
            render: (room) => <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 150 }}>
              <Box sx={{ width: 32, height: 32, flexShrink: 0, borderRadius: 1.5, bgcolor: '#EEF5FF', display: 'grid', placeItems: 'center' }}>
                <MeetingRoomOutlined sx={{ fontSize: 20, color: '#3275CC' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '.77rem', color: '#17365D' }}>{room.name}</Typography>
            </Stack>
          },
          { key: 'location', label: 'Floor / location', render: (room) => <Typography sx={{ fontSize: '.74rem', color: '#526C87' }}>{room.location || '—'}</Typography> },
          { key: 'capacity', label: 'Seats', align: 'center', render: (room) => <Chip size="small" icon={<GroupsOutlined />} label={room.capacity} variant="outlined" sx={{ fontWeight: 750, bgcolor: '#F7FAFF', borderColor: '#E3EBF7' }} /> },
          {
            key: 'equipmentCount', label: 'Equipment', sortable: true,
            render: (room) => <Box sx={{ minWidth: 170, maxWidth: 310 }}>
              <EquipmentPills ids={room.equipmentIds || []} equipment={equipment} limit={3} small />
            </Box>
          },
          {
            key: 'status', label: appliedSlot ? 'Room / time status' : 'Room status',
            render: (room) => <Chip size="small" variant="outlined"
              label={room.status === 'ACTIVE' ? (appliedSlot ? 'Free for selected time' : 'Active') : room.status === 'MAINTENANCE' ? 'Maintenance' : 'Disabled'}
              sx={{ height: 26, fontSize: '.69rem', fontWeight: 750,
                bgcolor: room.status === 'ACTIVE' ? '#EAF8F1' : '#FFFAEC',
                borderColor: room.status === 'ACTIVE' ? '#BCEAD5' : '#F3DBAB',
                color: room.status === 'ACTIVE' ? '#047857' : '#99631C' }} />
          },
          {
            key: 'description', label: 'Description', sortable: false,
            render: (room) => <Tooltip title={room.description || 'No description'} arrow>
              <Typography noWrap sx={{ maxWidth: 180, color: '#72869B', fontSize: '.73rem' }}>{room.description || '—'}</Typography>
            </Tooltip>
          },
          {
            key: 'actions', label: 'Action', align: 'center', sortable: false,
            render: (room) => canCreateBooking
              ? <Button size="small" variant="contained" disabled={room.status !== 'ACTIVE'} onClick={() => startBooking(room.id)} sx={{ minWidth: 108, textTransform: 'none', fontWeight: 750 }}>Book room</Button>
              : <Typography sx={{ color: '#8294A8', fontSize: '.72rem' }}>{isReadOnly ? 'View only' : 'Unavailable'}</Typography>
          }
        ]}
      />
    </Paper>
    {!visible.length && <Alert severity="info" sx={{ mt: 1.5 }}>No meeting rooms match your filters. Change the search criteria or select Reset.</Alert>}
    <BookingDialog open={open} onClose={() => setOpen(false)} onSave={saveBooking} rooms={rooms} defaultRoom={defaultRoom} defaultDate={bookingDefaults?.date} defaultStartTime={bookingDefaults?.start} defaultEndTime={bookingDefaults?.end} />
  </Box>;
}
