import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import MainCard from '../components/MainCard';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusChip from '../components/StatusChip';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

const blank = { code: '', name: '', location: '', capacity: 4, facilities: '', description: '', status: 'ACTIVE' };

export default function RoomManagementPage() {
  const { canManageRooms } = useAuth();
  const { rooms, addRoom, updateRoom, deleteRoom } = useAppData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(blank);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const add = () => { setEditId(null); setForm(blank); setOpen(true); };
  const edit = (room) => { setEditId(room.id); setForm(room); setOpen(true); };
  const change = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));
  const save = async () => {
    const payload = { ...form, capacity: Number(form.capacity) };
    const ok = editId ? await updateRoom(editId, payload) : await addRoom(payload);
    if (ok) setOpen(false);
  };

  return <Box sx={{ p: .55 }}>
    <PageHeader title="Room Management" subtitle={canManageRooms ? "Manage meeting room master data" : "View meeting room master data (read-only)"} actions={canManageRooms ? <Button size="small" variant="contained" startIcon={<AddOutlined />} onClick={add}>Add Room</Button> : null} />
    <MainCard content={false}><DataTable rows={rooms} searchFields={[
      { key: 'code', label: 'Room Code' },
      { key: 'name', label: 'Room Name' },
      { key: 'facilities', label: 'Facilities' }
    ]} filters={[
      { key: 'status', label: 'Status', options: ['ACTIVE', 'MAINTENANCE', 'DISABLED'] },
      { key: 'location', label: 'Location', options: [...new Set(rooms.map((r) => r.location))] }
    ]} columns={[
      { key: 'code', label: 'Room Code' }, { key: 'name', label: 'Room Name' }, { key: 'location', label: 'Location' },
      { key: 'capacity', label: 'Capacity', align: 'center' }, { key: 'facilities', label: 'Facilities' },
      { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
      ...(canManageRooms ? [{ key: 'actions', label: 'Actions', align: 'right', sortable: false, render: (r) => <Stack direction="row" justifyContent="flex-end"><Tooltip title="Edit"><IconButton size="small" onClick={() => edit(r)}><EditOutlined sx={{ fontSize: 17 }} /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(r)}><DeleteOutlineOutlined sx={{ fontSize: 17 }} /></IconButton></Tooltip></Stack> }] : [])
    ]} /></MainCard>

    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>{editId ? 'Edit Room' : 'Add Room'}</DialogTitle><DialogContent dividers><Stack spacing={1.4} sx={{ pt: .3 }}><TextField label="Room Code" size="small" value={form.code} onChange={change('code')} /><TextField label="Room Name" size="small" value={form.name} onChange={change('name')} /><TextField label="Location" size="small" value={form.location} onChange={change('location')} /><TextField label="Capacity" type="number" size="small" value={form.capacity} onChange={change('capacity')} /><TextField label="Facilities" size="small" value={form.facilities} onChange={change('facilities')} helperText="Separate facilities with commas" /><TextField label="Status" select size="small" value={form.status} onChange={change('status')}><MenuItem value="ACTIVE">ACTIVE</MenuItem><MenuItem value="MAINTENANCE">MAINTENANCE</MenuItem><MenuItem value="DISABLED">DISABLED</MenuItem></TextField></Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={!form.code || !form.name || !form.location || Number(form.capacity) < 1} onClick={save}>Save</Button></DialogActions></Dialog>

    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete Room" message={deleteTarget ? `Delete ${deleteTarget.name}? Existing historical bookings are not deleted in the real backend.` : ''} confirmText="Delete" onClose={() => setDeleteTarget(null)} onConfirm={async () => { if (await deleteRoom(deleteTarget.id)) setDeleteTarget(null); }} />
  </Box>;
}
