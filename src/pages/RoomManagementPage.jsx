import { useMemo, useState } from 'react';
import {
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, InputAdornment, MenuItem, Paper, Stack, TextField, Tooltip, Typography
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined';
import PeopleOutlineRounded from '@mui/icons-material/PeopleOutlineRounded';
import BuildCircleOutlined from '@mui/icons-material/BuildCircleOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import ConfirmDialog from '../components/ConfirmDialog';
import { EquipmentIcon, EquipmentPills, EQUIPMENT_CATEGORIES } from '../components/EquipmentDisplay';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

// Code remains an internal backend key but is no longer shown or entered in the UI.
// A random identifier avoids collisions across users creating rooms in parallel.
const makeRoomCode = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `MR-${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};
const blank = { code: '', name: '', location: '', capacity: 4, equipmentIds: [], description: '', status: 'ACTIVE' };
const border = { border: '1px solid #E5EBF3', borderRadius: 3, boxShadow: '0 8px 26px rgba(34,54,82,.035)' };

export default function RoomManagementPage() {
  const navigate = useNavigate();
  const { canManageRooms } = useAuth();
  const { rooms, equipment, addRoom, updateRoom, deleteRoom } = useAppData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(blank);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const activeEquipment = useMemo(() => equipment.filter((item) => item.status !== 'INACTIVE' && (`${item.name} ${item.code} ${item.category}`).toLowerCase().includes(deviceSearch.trim().toLowerCase())), [equipment, deviceSearch]);
  const grouped = EQUIPMENT_CATEGORIES.map((group) => ({ ...group, options: activeEquipment.filter((device) => device.category === group.value) })).filter((group) => group.options.length);
  const rows = useMemo(() => rooms.map((r) => ({ ...r, equipmentSearch: (r.equipmentIds || []).map((id) => equipment.find((device) => device.id === id)?.name || '').join(' ') })), [rooms, equipment]);
  const add = () => { setEditId(null); setForm({ ...blank, code: makeRoomCode(), equipmentIds: [] }); setDeviceSearch(''); setOpen(true); };
  const edit = (room) => { setEditId(room.id); setForm({ ...room, equipmentIds: room.equipmentIds || [] }); setDeviceSearch(''); setOpen(true); };
  const change = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const toggleEquipment = (id) => setForm((prev) => ({ ...prev, equipmentIds: prev.equipmentIds.includes(id) ? prev.equipmentIds.filter((v) => v !== id) : [...prev.equipmentIds, id] }));
  const valid = form.code.trim() && form.name.trim() && form.location.trim() && Number.isInteger(Number(form.capacity)) && Number(form.capacity) >= 1 && Number(form.capacity) <= 500;
  const save = async () => {
    if (saving || !valid) return;
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.trim(), name: form.name.trim(), location: form.location.trim(), capacity: Number(form.capacity), description: form.description || '', facilities: '' };
      const result = editId ? await updateRoom(editId, payload) : await addRoom(payload);
      if (result) setOpen(false);
    } finally { setSaving(false); }
  };
  return <Box sx={{ p: { xs: .7, md: 1.2 } }}>
    <PageHeader title="Room Management"
      subtitle="Manage room capacity, location, availability and assigned equipment."
      actions={canManageRooms && <Button onClick={add} variant="contained" startIcon={<AddRounded />}>Add room</Button>} />
    <Grid container spacing={1.3} sx={{ mb: 1.7 }}>
      {[
        { label: 'Total rooms', count: rooms.length, icon: MeetingRoomOutlined, color: '#2563EB', bg: '#EFF6FF' },
        { label: 'Available', count: rooms.filter((r) => r.status === 'ACTIVE').length, icon: PeopleOutlineRounded, color: '#059669', bg: '#ECFDF5' },
        { label: 'Under maintenance', count: rooms.filter((r) => r.status === 'MAINTENANCE').length, icon: BuildCircleOutlined, color: '#D97706', bg: '#FFFBEB' },
        { label: 'Device types', count: equipment.length, icon: Inventory2Outlined, color: '#7C3AED', bg: '#F5F3FF' }
      ].map(({ label, count, icon: Icon, color, bg }) => <Grid item xs={6} md={3} key={label}><Paper sx={{ ...border, p: 1.6, height: '100%' }}><Stack direction="row" alignItems="center" gap={1.2}><Box sx={{ bgcolor: bg, borderRadius: 2, p: 1, display: 'grid', placeItems: 'center' }}><Icon sx={{ fontSize: 21, color }} /></Box><Box><Typography sx={{ fontWeight: 850, color: '#18385D', fontSize: '1.4rem' }}>{count}</Typography><Typography sx={{ fontSize: '.69rem', color: '#7A8FA8', fontWeight: 650 }}>{label}</Typography></Box></Stack></Paper></Grid>)}
    </Grid>
    <Paper sx={{ ...border, overflow: 'hidden' }}><DataTable rows={rows} searchFields={[{ key: 'name', label: 'Room name' }, { key: 'equipmentSearch', label: 'Equipment' }]} filters={[{ key: 'status', label: 'Status', options: ['ACTIVE', 'MAINTENANCE', 'DISABLED'] }, { key: 'location', label: 'Location', options: [...new Set(rooms.map((r) => r.location).filter(Boolean))] }]} initialPageSize={10} columns={[
      { key: 'name', label: 'Room name', render: (r) => <Typography sx={{ color: '#17345A', fontWeight: 750 }}>{r.name}</Typography> },
      { key: 'location', label: 'Location' },
      { key: 'capacity', label: 'Seats', align: 'center' },
      { key: 'equipmentSearch', label: 'Equipment', sortable: false, render: (r) => <EquipmentPills ids={r.equipmentIds} equipment={equipment} limit={2} small /> },
      { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
      ...(canManageRooms ? [{ key: 'actions', label: 'Actions', align: 'right', sortable: false, render: (r) => <Stack direction="row" justifyContent="flex-end"><Tooltip title="Edit room"><IconButton size="small" aria-label={`Edit ${r.name}`} onClick={() => edit(r)}><EditOutlined sx={{ fontSize: 18 }} /></IconButton></Tooltip><Tooltip title="Delete room"><IconButton size="small" color="error" aria-label={`Delete ${r.name}`} onClick={() => setDeleteTarget(r)}><DeleteOutlineOutlined sx={{ fontSize: 18 }} /></IconButton></Tooltip></Stack> }] : [])
    ]} /></Paper>
    <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>
      <DialogTitle sx={{ bgcolor: '#F8FAFE', borderBottom: '1px solid #E6EDF5', py: 2, px: 2.6 }}><Typography sx={{ fontWeight: 850, fontSize: '1.05rem', color: '#18345D' }}>{editId ? 'Edit meeting room' : 'Create meeting room'}</Typography><Typography sx={{ color: '#8194A9', fontSize: '.75rem', mt: .35 }}>Room details and equipment assignments</Typography></DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 2.6 }, py: 2.3 }}><Stack spacing={2.1} sx={{ mt: 1 }}>
        <Grid container spacing={1.5}><Grid item xs={12} sm={12}><TextField size="small" required label="Room name" fullWidth value={form.name} onChange={change('name')} inputProps={{ maxLength: 120 }} /></Grid><Grid item xs={12} sm={5}><TextField size="small" required label="Location / floor" fullWidth value={form.location} onChange={change('location')} inputProps={{ maxLength: 160 }} /></Grid><Grid item xs={6} sm={3}><TextField size="small" required label="Capacity" type="number" fullWidth value={form.capacity} onChange={change('capacity')} inputProps={{ min: 1, max: 500, step: 1 }} /></Grid><Grid item xs={6} sm={4}><TextField size="small" label="Status" select fullWidth value={form.status} onChange={change('status')}><MenuItem value="ACTIVE">Available</MenuItem><MenuItem value="MAINTENANCE">Maintenance</MenuItem><MenuItem value="DISABLED">Disabled</MenuItem></TextField></Grid></Grid>
        <TextField size="small" label="Description (optional)" multiline minRows={2} fullWidth value={form.description || ''} onChange={change('description')} inputProps={{ maxLength: 1000 }} />
        <Box sx={{ borderRadius: 2.5, border: '1px solid #E4EAF3', p: 1.7, bgcolor: '#FBFCFF' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}><Box><Typography sx={{ fontWeight: 800, fontSize: '.88rem', color: '#173A64' }}>Available equipment <Chip size="small" label={`${form.equipmentIds.length} selected`} sx={{ ml: .6, bgcolor: '#EAF2FF', color: '#2563EB', fontWeight: 750 }} /></Typography><Typography sx={{ fontSize: '.72rem', color: '#8494A8', mt: .25 }}>Select from the managed equipment catalog, not free-text names.</Typography></Box><TextField placeholder="Find equipment..." size="small" value={deviceSearch} onChange={(e) => setDeviceSearch(e.target.value)} sx={{ minWidth: { sm: 205 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: '#96A9BD', fontSize: 18 }} /></InputAdornment> }} /></Stack>
          <Box sx={{ mt: 1.5, maxHeight: 285, overflowY: 'auto', pr: .35 }}>
            {grouped.map((group) => <Box key={group.value} sx={{ mb: 1.5 }}><Typography sx={{ textTransform: 'uppercase', color: '#91A3B9', fontSize: '.63rem', fontWeight: 850, letterSpacing: .8, mb: .7 }}>{group.label}</Typography><Grid container spacing={.9}>{group.options.map((device) => { const selected = form.equipmentIds.includes(device.id); return <Grid item xs={12} sm={6} key={device.id}><Box onClick={() => toggleEquipment(device.id)} role="checkbox" tabIndex={0} aria-checked={selected} aria-label={`Select ${device.name}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleEquipment(device.id); } }} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', p: .8, gap: 1, borderRadius: 2, border: selected ? '1px solid #6A99E7' : '1px solid #E1E8F2', bgcolor: selected ? '#EEF5FF' : '#fff', '&:hover': { borderColor: '#8FB6EE' } }}><EquipmentIcon item={device} size={21} /><Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontSize: '.76rem', fontWeight: 750, color: '#2D4B70', overflowWrap: 'anywhere' }}>{device.name}</Typography>{device.status === 'MAINTENANCE' && <Typography sx={{ fontSize: '.63rem', color: '#B45309' }}>Under maintenance</Typography>}</Box><Checkbox size="small" checked={selected} tabIndex={-1} sx={{ p: .35 }} /></Box></Grid>; })}</Grid></Box>)}
            {!grouped.length && <Typography sx={{ fontSize: '.77rem', color: '#8FA1B4', textAlign: 'center', py: 2 }}>{equipment.length ? 'No equipment matches your search.' : 'No equipment in the catalog yet.'}</Typography>}
          </Box>
          <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 1.2, flexWrap: 'wrap' }}><Typography sx={{ fontSize: '.72rem', color: '#8294AA' }}>Missing a device?</Typography><Button size="small" onClick={() => navigate('/equipment-management')} sx={{ fontSize: '.72rem' }}>Open equipment catalog</Button></Stack>
        </Box>
      </Stack></DialogContent><DialogActions sx={{ px: 2.6, py: 1.6, borderTop: '1px solid #E9EEF5' }}><Button disabled={saving} onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={!valid || saving} onClick={save}>{saving ? 'Saving...' : editId ? 'Save changes' : 'Create room'}</Button></DialogActions>
    </Dialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete meeting room" message={deleteTarget ? `Delete “${deleteTarget.name}”? Rooms with any booking history cannot be deleted; disable them instead.` : ''} confirmText="Delete" onClose={() => setDeleteTarget(null)} onConfirm={async () => { if (deleteTarget && await deleteRoom(deleteTarget.id)) setDeleteTarget(null); }} />
  </Box>;
}
