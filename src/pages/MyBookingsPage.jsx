import { useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import { useNavigate } from 'react-router-dom';
import MainCard from '../components/MainCard';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusChip from '../components/StatusChip';
import BookingDialog from '../components/BookingDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { user, canCreateBooking, isReadOnly } = useAuth();
  const { bookings, rooms, updateBooking, cancelBooking, deleteBooking } = useAppData();
  const rows = useMemo(() => bookings.filter((row) => row.userId ? row.userId === user?.id : row.user === user?.fullName), [bookings, user]);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  return <Box sx={{ p: .55 }}>
    <PageHeader title="My Bookings" subtitle={isReadOnly ? "Your booking history (read-only)" : "Complete list of your room booking requests"} actions={canCreateBooking ? <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => navigate('/rooms')}>New Booking</Button> : null} />
    <MainCard content={false}>
      <DataTable
        rows={rows}
        searchFields={[
          { key: 'id', label: 'Booking ID' },
          { key: 'title', label: 'Meeting' }
        ]}
        filters={[
          { key: 'status', label: 'Status', options: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
          { key: 'room', label: 'Room', options: [...new Set(rows.map((row) => row.room))] }
        ]}
        columns={[
          { key: 'id', label: 'Booking ID' },
          { key: 'title', label: 'Meeting' },
          { key: 'room', label: 'Room' },
          { key: 'date', label: 'Meeting Date', render: (row) => formatDate(row.date) },
          { key: 'time', label: 'Time' },
          { key: 'participants', label: 'People', align: 'center' },
          { key: 'createdAt', label: 'Requested At' },
          { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
          { key: 'actions', label: 'Actions', align: 'right', sortable: false, render: (row) => <Stack direction="row" justifyContent="flex-end" spacing={.1}>
            <Tooltip title="View"><IconButton size="small" onClick={() => setViewTarget(row)}><VisibilityOutlined sx={{ fontSize: 17 }} /></IconButton></Tooltip>
            {!isReadOnly && ['PENDING', 'APPROVED'].includes(row.status) && <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditTarget(row)}><EditOutlined sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
            {!isReadOnly && ['PENDING', 'APPROVED'].includes(row.status) && <Tooltip title="Cancel"><IconButton size="small" color="warning" onClick={() => setCancelTarget(row)}><CancelOutlined sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
            {!isReadOnly && ['REJECTED', 'CANCELLED'].includes(row.status) && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteOutlineOutlined sx={{ fontSize: 17 }} /></IconButton></Tooltip>}
          </Stack> }
        ]}
      />
    </MainCard>

    <Dialog open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} fullWidth maxWidth="sm"><DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Booking Details</DialogTitle><DialogContent dividers>{viewTarget && <Stack spacing={.7}>{[
      ['Booking ID', viewTarget.id], ['Meeting', viewTarget.title], ['Room', viewTarget.room], ['Date', formatDate(viewTarget.date)], ['Time', viewTarget.time], ['Participants', viewTarget.participants], ['Status', viewTarget.status], ['Requested At', viewTarget.createdAt], ['Approved By', viewTarget.approvedBy || '-'], ['Reject Reason', viewTarget.rejectReason || '-']
    ].map(([label, value]) => <Stack key={label} direction="row" justifyContent="space-between" spacing={2}><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>{label}</Typography><Typography sx={{ fontSize: '.72rem', fontWeight: 700, color: '#314A65', textAlign: 'right' }}>{value}</Typography></Stack>)}</Stack>}</DialogContent><DialogActions><Button onClick={() => setViewTarget(null)}>Close</Button></DialogActions></Dialog>

    <BookingDialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} booking={editTarget} rooms={rooms} onSave={async (form) => { if (await updateBooking(editTarget.id, form)) setEditTarget(null); }} />
    <ConfirmDialog open={Boolean(cancelTarget)} title="Cancel Booking" message={cancelTarget ? `Cancel ${cancelTarget.id} - ${cancelTarget.title}?` : ''} confirmText="Cancel Booking" confirmColor="warning" onClose={() => setCancelTarget(null)} onConfirm={async () => { if (await cancelBooking(cancelTarget.id)) setCancelTarget(null); }} />
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete Booking" message={deleteTarget ? `Delete ${deleteTarget.id}? This action cannot be undone.` : ''} confirmText="Delete" onClose={() => setDeleteTarget(null)} onConfirm={async () => { if (await deleteBooking(deleteTarget.id)) setDeleteTarget(null); }} />
  </Box>;
}
