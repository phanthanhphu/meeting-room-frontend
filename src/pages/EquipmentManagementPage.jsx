import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import HandymanOutlined from '@mui/icons-material/HandymanOutlined';
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined';
import { EQUIPMENT_CATEGORIES, EquipmentIcon } from '../components/EquipmentDisplay';
import ConfirmDialog from '../components/ConfirmDialog';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

const blank = { code: '', name: '', category: 'DISPLAY', description: '', status: 'ACTIVE' };
const stats = [
  ['Catalog items', Inventory2Outlined, '#2563EB', '#EFF6FF'],
  ['Ready to use', CheckCircleOutlineRounded, '#059669', '#ECFDF5'],
  ['Maintenance', HandymanOutlined, '#D97706', '#FFFBEB'],
  ['Assigned devices', MeetingRoomOutlined, '#7C3AED', '#F5F3FF']
];
const statusColors = {
  ACTIVE: { color: '#047857', bgcolor: '#ECFDF5', borderColor: '#A7F3D0' },
  MAINTENANCE: { color: '#92400E', bgcolor: '#FFFBEB', borderColor: '#FDE68A' },
  INACTIVE: { color: '#64748B', bgcolor: '#F1F5F9', borderColor: '#CBD5E1' }
};
const surface = { border: '1px solid #E5EBF3', borderRadius: 3, boxShadow: '0 8px 26px rgba(34,54,82,.035)' };

export default function EquipmentManagementPage() {
  const { canManageRooms } = useAuth();
  const { equipment, rooms, addEquipment, updateEquipment, deleteEquipment } = useAppData();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const usage = useMemo(() => Object.fromEntries(equipment.map((item) => [item.id, rooms.filter((room) => room.equipmentIds?.includes(item.id)).length])), [equipment, rooms]);
  // Search, filter, sort and pagination are handled by the shared DataTable.
  // Include all searchable properties in one field to match the old catalog search.
  const rows = useMemo(() => equipment.map((item) => ({
    ...item,
    categoryLabel: EQUIPMENT_CATEGORIES.find((option) => option.value === item.category)?.label || item.category || '—',
    assignedRooms: usage[item.id] || 0,
    searchText: [item.code, item.name, item.description, item.category].filter(Boolean).join(' ')
  })), [equipment, usage]);
  const counts = [equipment.length, equipment.filter((x) => x.status === 'ACTIVE').length, equipment.filter((x) => x.status === 'MAINTENANCE').length, Object.values(usage).reduce((n, count) => n + count, 0)];
  const startCreate = () => { setForm({ ...blank }); setEditingId(null); setOpen(true); };
  const startEdit = (item) => { setForm({ code: item.code, name: item.name, category: item.category, description: item.description || '', status: item.status }); setEditingId(item.id); setOpen(true); };
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase(), name: form.name.trim(), description: form.description.trim() };
      const result = editingId ? await updateEquipment(editingId, payload) : await addEquipment(payload);
      if (result) setOpen(false);
    } finally { setSaving(false); }
  };
  return <Box sx={{ p: { xs: .7, md: 1.2 } }}>
    <PageHeader title="Equipment Catalog"
      subtitle="Manage equipment in one catalog and assign it to meeting rooms."
      actions={canManageRooms && <Button startIcon={<AddRounded />} onClick={startCreate} variant="contained">Add equipment</Button>} />
    <Grid container spacing={1.4} sx={{ mb: 2 }}>
      {stats.map(([label, Icon, color, bg], index) => <Grid item xs={6} md={3} key={label}><Paper sx={{ ...surface, p: { xs: 1.4, md: 2 }, height: '100%' }}><Stack direction="row" spacing={1.2} alignItems="center"><Box sx={{ p: 1.1, borderRadius: 2.2, bgcolor: bg, display: 'grid', placeItems: 'center' }}><Icon sx={{ color, fontSize: 22 }} /></Box><Box><Typography sx={{ fontSize: { xs: '1.23rem', md: '1.5rem' }, color: '#16345E', fontWeight: 850 }}>{counts[index]}</Typography><Typography sx={{ fontSize: '.69rem', color: '#7A8CA5', fontWeight: 650 }}>{label}</Typography></Box></Stack></Paper></Grid>)}
    </Grid>
    <Paper sx={{ ...surface, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E7ECF4' }}>
        <Typography sx={{ fontWeight: 850, fontSize: '.93rem', color: '#17345A' }}>Equipment list</Typography>
        <Typography sx={{ fontSize: '.73rem', color: '#8394A8', mt: .3 }}>
          Search and filter the catalog, sort columns, and choose how many rows to display per page.
        </Typography>
      </Box>
      <DataTable
        rows={rows}
        getKey={(item) => item.id}
        searchFields={[{ key: 'searchText', label: 'Search code, name or description', width: 250 }]}
        filters={[
          { key: 'category', label: 'Category', options: EQUIPMENT_CATEGORIES },
          { key: 'status', label: 'Status', options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'MAINTENANCE', label: 'Maintenance' },
            { value: 'INACTIVE', label: 'Inactive' }
          ] }
        ]}
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        columns={[
          {
            key: 'name', label: 'Equipment name',
            render: (item) => <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 175 }}>
              <Box sx={{ width: 32, height: 32, flexShrink: 0, borderRadius: 1.6, bgcolor: '#EEF5FF', display: 'grid', placeItems: 'center' }}>
                <EquipmentIcon item={item} size={20} />
              </Box>
              <Typography sx={{ fontSize: '.76rem', fontWeight: 800, color: '#17345A' }}>{item.name}</Typography>
            </Stack>
          },
          { key: 'code', label: 'Code', render: (item) => <Typography sx={{ fontSize: '.74rem', fontWeight: 750, color: '#376CB3' }}>{item.code}</Typography> },
          { key: 'categoryLabel', label: 'Category', render: (item) => <Typography sx={{ fontSize: '.74rem', color: '#556D87' }}>{item.categoryLabel}</Typography> },
          {
            key: 'description', label: 'Description',
            render: (item) => <Tooltip title={item.description || 'No description'} arrow>
              <Typography noWrap sx={{ maxWidth: 255, fontSize: '.73rem', color: '#64748B' }}>{item.description || '—'}</Typography>
            </Tooltip>
          },
          {
            key: 'assignedRooms', label: 'Assigned rooms', align: 'center',
            render: (item) => <Chip size="small" label={item.assignedRooms} sx={{ bgcolor: '#F0F5FB', color: '#516984', fontSize: '.7rem', fontWeight: 750, minWidth: 35 }} />
          },
          {
            key: 'status', label: 'Status',
            render: (item) => <Chip
              label={item.status === 'ACTIVE' ? 'Active' : item.status === 'INACTIVE' ? 'Inactive' : 'Maintenance'}
              size="small" variant="outlined"
              sx={{ ...statusColors[item.status], height: 25, fontSize: '.68rem', fontWeight: 750 }}
            />
          },
          ...(canManageRooms ? [{
            key: 'actions', label: 'Actions', align: 'right', sortable: false,
            render: (item) => <Stack direction="row" justifyContent="flex-end">
              <Tooltip title="Edit equipment">
                <IconButton size="small" aria-label={`Edit ${item.name}`} onClick={() => startEdit(item)}>
                  <EditOutlined sx={{ fontSize: 19 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={item.assignedRooms ? 'Remove it from rooms before deleting' : 'Delete equipment'}>
                <span><IconButton disabled={Boolean(item.assignedRooms)} color="error" size="small" aria-label={`Delete ${item.name}`} onClick={() => setDeleteTarget(item)}>
                  <DeleteOutlineOutlined sx={{ fontSize: 19 }} />
                </IconButton></span>
              </Tooltip>
            </Stack>
          }] : [])
        ]}
      />
    </Paper>
    <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ color: '#18365F', fontWeight: 800, pb: 1 }}>{editingId ? 'Edit equipment' : 'Add equipment'}<Typography sx={{ color: '#8293A7', fontSize: '.75rem', mt: .35 }}>This device type can be used by multiple meeting rooms.</Typography></DialogTitle>
      <DialogContent dividers><Stack spacing={1.7} sx={{ pt: 1 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4}><TextField label="Equipment code" required fullWidth value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} size="small" inputProps={{ maxLength: 40 }} /><TextField label="Equipment name" required fullWidth value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} size="small" inputProps={{ maxLength: 120 }} /></Stack><TextField label="Equipment type" select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} fullWidth size="small">{EQUIPMENT_CATEGORIES.map((x) => <MenuItem key={x.value} value={x.value}><Stack direction="row" alignItems="center" gap={1}><EquipmentIcon item={{ category: x.value }} size={19} />{x.label}</Stack></MenuItem>)}</TextField><TextField label="Status" select fullWidth size="small" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{['ACTIVE', 'MAINTENANCE', 'INACTIVE'].map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField><TextField label="Description (optional)" size="small" multiline minRows={2} fullWidth value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} inputProps={{ maxLength: 500 }} />{editingId && Boolean(usage[editingId]) && form.status === 'INACTIVE' && <Alert severity="warning">Remove this equipment from {usage[editingId]} assigned room(s) before marking it inactive.</Alert>}</Stack></DialogContent>
      <DialogActions sx={{ p: 2 }}><Button disabled={saving} onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={saving || !form.code.trim() || !form.name.trim() || form.description.length > 500 || (editingId && usage[editingId] > 0 && form.status === 'INACTIVE')} onClick={save}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create equipment'}</Button></DialogActions>
    </Dialog>
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete equipment" message={deleteTarget ? `Delete “${deleteTarget.name}” from the catalog?` : ''} confirmText={busyDelete ? 'Deleting...' : 'Delete'} onClose={() => !busyDelete && setDeleteTarget(null)} onConfirm={async () => { if (busyDelete || !deleteTarget) return; setBusyDelete(true); try { if (await deleteEquipment(deleteTarget.id)) setDeleteTarget(null); } finally { setBusyDelete(false); } }} />
  </Box>;
}
