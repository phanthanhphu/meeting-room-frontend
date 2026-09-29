import { useMemo, useState } from 'react';
import { Box, Button, Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import TvOutlined from '@mui/icons-material/TvOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import MainCard from '../components/MainCard';
import PageHeader from '../components/PageHeader';
import BookingDialog from '../components/BookingDialog';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

export default function RoomsPage() {
  const { canCreateBooking, isReadOnly } = useAuth();
  const { rooms, addBooking } = useAppData();
  const [open, setOpen] = useState(false);
  const [defaultRoom, setDefaultRoom] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('All');
  const [appliedSearch, setAppliedSearch] = useState({ roomCode: '', roomName: '', location: '', status: 'All' });

  const visible = useMemo(() => rooms.filter((room) => {
    const matchCode = !appliedSearch.roomCode || String(room.code || '').toLowerCase().includes(appliedSearch.roomCode.toLowerCase());
    const matchName = !appliedSearch.roomName || String(room.name || '').toLowerCase().includes(appliedSearch.roomName.toLowerCase());
    const matchLocation = !appliedSearch.location || String(room.location || '').toLowerCase().includes(appliedSearch.location.toLowerCase());
    const matchStatus = appliedSearch.status === 'All' || room.status === appliedSearch.status;
    return matchCode && matchName && matchLocation && matchStatus;
  }), [rooms, appliedSearch]);

  const applySearch = () => setAppliedSearch({ roomCode, roomName, location, status });
  const resetSearch = () => {
    setRoomCode(''); setRoomName(''); setLocation(''); setStatus('All');
    setAppliedSearch({ roomCode: '', roomName: '', location: '', status: 'All' });
  };

  const startBooking = (roomName = '') => { setDefaultRoom(roomName); setOpen(true); };
  const saveBooking = async (form) => { if (await addBooking(form)) setOpen(false); };

  return <Box sx={{ p: .55 }}>
    <PageHeader title="Meeting Rooms" subtitle={isReadOnly ? "View meeting room availability (read-only)" : "Select an available room and create a booking"} actions={canCreateBooking ? <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => startBooking()}>New Booking</Button> : null} />
    <MainCard sx={{ mb: 1.05 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={.8} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ flexWrap: 'wrap' }}>
        <TextField label="Room Code" size="small" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }} sx={{ width: { xs: '100%', sm: 160 }, '& .MuiOutlinedInput-root': { height: 36, bgcolor: '#fff' } }} />
        <TextField label="Room Name" size="small" value={roomName} onChange={(e) => setRoomName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }} sx={{ width: { xs: '100%', sm: 190 }, '& .MuiOutlinedInput-root': { height: 36, bgcolor: '#fff' } }} />
        <TextField label="Location" size="small" value={location} onChange={(e) => setLocation(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }} sx={{ width: { xs: '100%', sm: 185 }, '& .MuiOutlinedInput-root': { height: 36, bgcolor: '#fff' } }} />
        <TextField select label="Status" size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { height: 36, bgcolor: '#fff' } }}>
          <MenuItem value="All">All status</MenuItem><MenuItem value="ACTIVE">Available</MenuItem><MenuItem value="MAINTENANCE">Maintenance</MenuItem><MenuItem value="DISABLED">Disabled</MenuItem>
        </TextField>
        <Button size="small" variant="contained" startIcon={<SearchOutlined />} onClick={applySearch} sx={{ height: 36 }}>Search</Button>
        <Button size="small" variant="outlined" startIcon={<RestartAltOutlined />} onClick={resetSearch} sx={{ height: 36 }}>Reset Search</Button>
      </Stack>
    </MainCard>

    <Grid container spacing={1.1}>
      {visible.map((room) => {
        const facilities = String(room.facilities || '').split(',').map((v) => v.trim()).filter(Boolean);
        const available = room.status === 'ACTIVE';
        return <Grid key={room.id} item xs={12} sm={6} xl={3}><MainCard sx={{ height: '100%', p: 0 }} content={false}>
          <Box sx={{ p: 1.35, borderBottom: '1px solid #EDF2F7' }}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography sx={{ fontSize: '.9rem', fontWeight: 800, color: '#173B63' }}>{room.name}</Typography><Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: .45 }}><LocationOnOutlined sx={{ fontSize: 15, color: '#71849A' }} /><Typography sx={{ fontSize: '.69rem', color: '#71849A' }}>{room.location}</Typography></Stack></Box><Chip label={available ? 'Available' : room.status} size="small" sx={{ height: 22, fontSize: '.64rem', fontWeight: 750, color: available ? '#107D4F' : '#B56B00', bgcolor: available ? '#EAF8F2' : '#FFF7E8', border: `1px solid ${available ? '#BFE8D7' : '#F4D7A3'}` }} /></Stack></Box>
          <Box sx={{ p: 1.35 }}><Stack direction="row" spacing={1.2} sx={{ mb: 1.15 }}><Stack direction="row" spacing={0.5} alignItems="center"><GroupsOutlined sx={{ fontSize: 17, color: '#61758B' }} /><Typography sx={{ fontSize: '.72rem', color: '#40566E', fontWeight: 650 }}>{room.capacity} people</Typography></Stack><Stack direction="row" spacing={0.5} alignItems="center"><TvOutlined sx={{ fontSize: 17, color: '#61758B' }} /><Typography sx={{ fontSize: '.72rem', color: '#40566E', fontWeight: 650 }}>{facilities.length} facilities</Typography></Stack></Stack><Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ minHeight: 52 }}>{facilities.map((f) => <Chip key={f} label={f} size="small" variant="outlined" sx={{ height: 22, fontSize: '.64rem', borderColor: '#DCE5EE', color: '#61758B' }} />)}</Stack>{canCreateBooking && <Button fullWidth variant={available ? 'contained' : 'outlined'} disabled={!available} size="small" sx={{ mt: 1.15 }} onClick={() => startBooking(room.name)}>Book this room</Button>}</Box>
        </MainCard></Grid>;
      })}
    </Grid>

    <BookingDialog open={open} onClose={() => setOpen(false)} onSave={saveBooking} rooms={rooms} defaultRoom={defaultRoom} />
  </Box>;
}
