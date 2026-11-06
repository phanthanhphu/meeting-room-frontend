import { useMemo, useState } from 'react';
import {
  Box, Button, Dialog, DialogContent, DialogTitle, IconButton,
  InputAdornment, Stack, TextField, Tooltip, Typography
} from '@mui/material';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined';
import { roomAccent } from '../constants/roomColors.js';

export const VISIBLE_ROOM_COLOR_COUNT = 5;

/** Room labels use the actual stored room color. Never derive the color from the status. */
function RoomLabel({ room, active = false, onClick, compact = false }) {
  const accent = roomAccent(room);
  const content = <>
    <Box aria-hidden="true" sx={{ width: compact ? 13 : 15, height: compact ? 13 : 15, borderRadius: .9, flexShrink: 0, bgcolor: accent, boxShadow: 'inset 0 0 0 1px rgba(13,32,57,.08)' }} />
    <Typography component="span" sx={{ flex: 1, minWidth: 0, color: '#182F51', fontSize: compact ? '.73rem' : '.81rem', fontWeight: 850, lineHeight: 1.5, whiteSpace: compact ? 'nowrap' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', overflowWrap: 'anywhere' }}>
      {room.name}
    </Typography>
    {!compact && active && <CheckRounded aria-label="Selected" sx={{ ml: 'auto', color: '#2768BD', fontSize: 18 }} />}
  </>;
  const styles = {
    display: 'inline-flex', justifyContent: 'flex-start', alignItems: 'center', gap: .9,
    px: compact ? 1.1 : 1.5, py: compact ? .55 : 1.2, minWidth: 0,
    minHeight: compact ? 31 : 45, maxWidth: compact ? 182 : '100%',
    width: compact ? 'auto' : '100%', border: `1px solid ${active ? '#83B2F4' : '#DEE7F2'}`,
    borderRadius: compact ? '20px' : '10px',
    bgcolor: active ? '#EAF3FF' : '#FFFFFF',
    boxShadow: active ? '0 0 0 1px rgba(42,110,210,.10)' : '0 1px 3px rgba(25,59,99,.03)',
    textTransform: 'none', '&:focus-visible': { outline: '2px solid #2563EB', outlineOffset: 2 }
  };
  if (onClick) return <Tooltip title={room.name} disableHoverListener={!compact} arrow>
    <Button onClick={onClick} aria-pressed={active} aria-label={`Filter calendar by ${room.name}`} variant="text" size="small" sx={{ ...styles, '&:hover': { bgcolor: '#F2F7FE', borderColor: '#AFC8ED' } }}>{content}</Button>
  </Tooltip>;
  return <Box sx={styles} title={room.name}>{content}</Box>;
}

export default function RoomColorLegend({ rooms = [], roomFilter = '', onSelectRoom }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const visibleRooms = rooms.slice(0, VISIBLE_ROOM_COLOR_COUNT);
  const remaining = Math.max(rooms.length - VISIBLE_ROOM_COLOR_COUNT, 0);
  const filteredRooms = useMemo(() => rooms.filter((room) => String(room.name || '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [rooms, search]);
  const close = () => { setOpen(false); setSearch(''); };
  const select = (id) => { onSelectRoom?.(id); close(); };

  return <>
    <Box aria-label="Room color legend" sx={{ px: { xs: 1.4, sm: 1.8 }, py: 1.2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: .9, bgcolor: '#FFFFFF', borderBottom: '1px solid #E1EAF4' }}>
      <Typography component="span" sx={{ fontSize: '.72rem', fontWeight: 850, color: '#49607E', mr: .35, whiteSpace: 'nowrap' }}>Room Colors:</Typography>
      {visibleRooms.map((room) => <RoomLabel key={room.id} room={room} compact active={roomFilter === room.id} onClick={onSelectRoom ? () => select(room.id) : undefined} />)}
      {remaining > 0 && <Button aria-label={`Show all ${rooms.length} rooms and their colors`} onClick={() => setOpen(true)} endIcon={<ExpandMoreRounded sx={{ fontSize: '16px !important' }} />} size="small" variant="outlined" sx={{ textTransform: 'none', fontSize: '.74rem', fontWeight: 800, px: 1.35, minHeight: 31, borderRadius: '20px', borderColor: '#BDD4F8', color: '#1F59B3', bgcolor: '#EFF5FF', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#E5F0FF', borderColor: '#6D9CEB' } }}>Show more (+{remaining})</Button>}
      {rooms.length === 0 && <Typography sx={{ fontSize: '.74rem', color: '#71849A' }}>No rooms configured</Typography>}
    </Box>

    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" aria-labelledby="room-color-legend-title" PaperProps={{ sx: { borderRadius: 3, border: '1px solid #DEE7F2', boxShadow: '0 22px 80px rgba(20,49,89,.20)', maxHeight: 'min(80vh, 670px)' } }}>
      <DialogTitle id="room-color-legend-title" sx={{ pt: 2.1, px: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" gap={1} alignItems="center">
            <MeetingRoomOutlined sx={{ color: '#326FC3', fontSize: 21 }} />
            <Typography component="span" sx={{ fontSize: '1.05rem', color: '#152B4C', fontWeight: 850 }}>All Rooms ({rooms.length})</Typography>
          </Stack>
          <Typography sx={{ mt: .45, fontSize: '.73rem', color: '#6B7F98' }}>Select a room to filter the booking calendar.</Typography>
        </Box>
        <IconButton size="small" aria-label="Close room colors" onClick={close} sx={{ color: '#5B6F86' }}><CloseOutlined /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 2.4, pb: 2.4, pt: '4px !important', minHeight: 0, overflowY: 'auto' }}>
        <TextField autoFocus size="small" fullWidth autoComplete="off" placeholder="Search rooms..." inputProps={{ 'aria-label': 'Search rooms' }} value={search} onChange={(event) => setSearch(event.target.value)} sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { bgcolor: '#FBFDFF', borderRadius: 2 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 19, color: '#657F9A' }} /></InputAdornment> }} />
        {onSelectRoom && <Button onClick={() => select('')} variant="text" fullWidth aria-pressed={!roomFilter} sx={{ mb: 1, py: 1, justifyContent: 'flex-start', px: 1.6, borderRadius: 2, textTransform: 'none', fontWeight: 800, color: '#235DB3', bgcolor: !roomFilter ? '#EAF3FF' : '#F6F9FC', '&:hover': { bgcolor: '#EAF3FF' } }}>All rooms {roomFilter ? '' : '✓'}</Button>}
        <Stack spacing={.65}>
          {filteredRooms.map((room) => <RoomLabel key={room.id} room={room} active={roomFilter === room.id} onClick={onSelectRoom ? () => select(room.id) : undefined} />)}
          {filteredRooms.length === 0 && <Typography sx={{ color: '#64748B', fontSize: '.8rem', textAlign: 'center', py: 3 }}>No rooms match your search.</Typography>}
        </Stack>
      </DialogContent>
    </Dialog>
  </>;
}
