import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import MainCard from '../components/MainCard';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusChip from '../components/StatusChip';
import { formatDate } from '../utils/date';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

export default function ApprovalsPage() {
  const { canManageBookings } = useAuth();
  const { bookings, approveBooking, rejectBooking } = useAppData();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [reason, setReason] = useState('');

  const reject = async () => {
    if (!rejectTarget) return;
    if (await rejectBooking(rejectTarget.id, reason)) {
      setRejectTarget(null); setReason('');
    }
  };

  return <Box sx={{ p: .55 }}>
    <PageHeader title="Booking Approvals" subtitle={canManageBookings ? "Review and process room booking requests" : "View all booking requests (read-only)"} />
    <MainCard content={false}>
      <DataTable
        rows={bookings}
        searchFields={[
          { key: 'id', label: 'Booking ID' },
          { key: 'title', label: 'Meeting' },
          { key: 'user', label: 'Requested By' }
        ]}
        filters={[
          { key: 'status', label: 'Status', options: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
          { key: 'department', label: 'Department', options: [...new Set(bookings.map((row) => row.department))] },
          { key: 'room', label: 'Room', options: [...new Set(bookings.map((row) => row.room))] }
        ]}
        columns={[
          { key: 'id', label: 'Booking ID' }, { key: 'title', label: 'Meeting' }, { key: 'user', label: 'Requested By' },
          { key: 'department', label: 'Department' }, { key: 'room', label: 'Room' },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.date) }, { key: 'time', label: 'Time' },
          { key: 'participants', label: 'People', align: 'center' }, { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
          { key: 'actions', label: 'Actions', align: 'right', sortable: false, render: (row) => <Stack direction="row" justifyContent="flex-end" spacing={.5}>
            <Button size="small" variant="text" startIcon={<VisibilityOutlined />} onClick={() => setViewTarget(row)}>View</Button>
            {canManageBookings && row.status === 'PENDING' && <><Button size="small" variant="outlined" color="error" startIcon={<CloseOutlined />} onClick={() => setRejectTarget(row)}>Reject</Button><Button size="small" variant="contained" color="success" startIcon={<CheckOutlined />} onClick={async () => { await approveBooking(row.id); }}>Approve</Button></>}
          </Stack> }
        ]}
      />
    </MainCard>

    <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} fullWidth maxWidth="sm"><DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Reject Booking</DialogTitle><DialogContent><Typography sx={{ mb: 1.2, fontSize: '.75rem', color: '#61758B' }}>{rejectTarget ? `${rejectTarget.id} - ${rejectTarget.title}` : ''}</Typography><TextField autoFocus multiline minRows={3} fullWidth label="Reject reason" value={reason} onChange={(event) => setReason(event.target.value)} /></DialogContent><DialogActions><Button onClick={() => setRejectTarget(null)}>Cancel</Button><Button variant="contained" color="error" onClick={reject}>Reject Booking</Button></DialogActions></Dialog>

    <Dialog open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} fullWidth maxWidth="sm"><DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Booking Details</DialogTitle><DialogContent dividers>{viewTarget && <Stack spacing={.75}>{[
      ['ID', viewTarget.id], ['Meeting', viewTarget.title], ['Requester', viewTarget.user], ['Department', viewTarget.department], ['Room', viewTarget.room], ['Date', formatDate(viewTarget.date)], ['Time', viewTarget.time], ['People', viewTarget.participants], ['Status', viewTarget.status], ['Reject Reason', viewTarget.rejectReason || '-']
    ].map(([label, value]) => <Stack key={label} direction="row" justifyContent="space-between"><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>{label}</Typography><Typography sx={{ fontSize: '.72rem', fontWeight: 700, color: '#314A65' }}>{value}</Typography></Stack>)}</Stack>}</DialogContent><DialogActions><Button onClick={() => setViewTarget(null)}>Close</Button></DialogActions></Dialog>
  </Box>;
}
