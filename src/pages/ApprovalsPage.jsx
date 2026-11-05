import { BOOKING_FILTER_OPTIONS, BOOKING_STATUS } from '../constants/statuses.js';
import { canCancelBooking } from '../utils/bookingRules.js';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';
import MainCard from '../components/MainCard';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusChip from '../components/StatusChip';
import BookingHistory from '../components/BookingHistory';
import { canChangeBooking } from '../utils/bookingRules';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/date';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

// Compact icon-only controls keep the Actions column easy to scan.
// Tooltips and accessible labels preserve clarity and keyboard/screen-reader access.
function BookingActionIcon({ label, color = 'primary', onClick, disabled = false, children }) {
  return (
    <Tooltip title={label} arrow placement="top">
      <span style={{ display: 'inline-flex' }}>
        <IconButton
          size="small"
          color={color}
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            '&:hover': { bgcolor: 'action.hover' },
            '& .MuiSvgIcon-root': { fontSize: 19 }
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export default function ApprovalsPage() {
  const { canManageBookings, isAdmin } = useAuth();
  const { loading, bookings, approveBooking, rejectBooking, cancelBooking, deleteBooking } = useAppData();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [reason, setReason] = useState('');
  useEffect(() => {
    const id = searchParams.get('booking');
    const match = id && bookings.find((row) => row.id === id);
    if (match) { setViewTarget(match); setSearchParams((previous) => { const next = new URLSearchParams(previous); next.delete('booking'); return next; }, { replace: true }); }
  }, [searchParams, setSearchParams, bookings]);

  const [approving, setApproving] = useState(null);
  const [busyId, setBusyId] = useState('');

  // The Approvals list is ordered by submission time, not meeting date or last update.
  // The API returns createdAt as a local ISO datetime string (e.g. 2026-11-05T10:30:00).
  // Keep legacy records without createdAt at the end; stable ties retain the API order.
  const newestFirstBookings = useMemo(() => [...bookings].sort((a, b) => {
    const left = typeof a.createdAt === 'string' ? a.createdAt : '';
    const right = typeof b.createdAt === 'string' ? b.createdAt : '';
    return right.localeCompare(left);
  }), [bookings]);

  const reject = async () => {
    if (!rejectTarget || !reason.trim() || busyId) return;
    setBusyId(rejectTarget.id);
    try {
      if (await rejectBooking(rejectTarget.id, reason.trim())) { setRejectTarget(null); setReason(''); }
    } finally { setBusyId(''); }
  };

  return <Box sx={{ p: .55 }}>
    <PageHeader title="Booking Approvals" subtitle={canManageBookings ? "Review and process room booking requests" : "View all booking requests (read-only)"} />
    <MainCard content={false}>
      <DataTable
        loading={loading}
        rows={newestFirstBookings}
        searchFields={[
          { key: 'title', label: 'Meeting' },
          { key: 'user', label: 'Requested By' }
        ]}
        filters={[
          { key: 'status', label: 'Status', options: BOOKING_FILTER_OPTIONS },
          { key: 'department', label: 'Department', options: [...new Set(bookings.map((row) => row.department))] },
          { key: 'room', label: 'Room', options: [...new Set(bookings.map((row) => row.room))] }
        ]}
        columns={[
          { key: 'title', label: 'Meeting' }, { key: 'user', label: 'Requested By' },
          { key: 'department', label: 'Department' }, { key: 'room', label: 'Room' },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.date) }, { key: 'time', label: 'Time' },
          { key: 'participants', label: 'People', align: 'center' }, { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
          { key: 'actions', label: 'Actions', align: 'right', sortable: false, render: (row) => <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={.25} sx={{ whiteSpace: 'nowrap' }}>
            <BookingActionIcon label="View booking details" onClick={() => setViewTarget(row)}><VisibilityOutlined /></BookingActionIcon>
            {canManageBookings && canCancelBooking(row, { isManager: true }) && row.status === BOOKING_STATUS.APPROVED && (
              <BookingActionIcon label="Cancel approved booking" color="warning" onClick={() => setCancelTarget(row)}><EventBusyOutlined /></BookingActionIcon>
            )}
            {canManageBookings && row.status === BOOKING_STATUS.PENDING && <>
              <BookingActionIcon label="Reject booking" color="error" disabled={Boolean(busyId)} onClick={() => { setReason(''); setRejectTarget(row); }}><CloseOutlined /></BookingActionIcon>
              <BookingActionIcon label="Approve booking" color="success" disabled={Boolean(busyId) || !canChangeBooking(row)} onClick={() => setApproving(row)}><CheckOutlined /></BookingActionIcon>
            </>}
            {isAdmin && <BookingActionIcon label="Delete booking permanently" color="error" disabled={Boolean(busyId)} onClick={() => setDeleteTarget(row)}><DeleteOutlineOutlined /></BookingActionIcon>}
          </Stack> }
        ]}
      />
    </MainCard>

    <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} fullWidth maxWidth="sm"><DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Reject Booking</DialogTitle><DialogContent><Typography sx={{ mb: 1.2, fontSize: '.75rem', color: '#61758B' }}>{rejectTarget ? `${rejectTarget.title} · ${formatDate(rejectTarget.date)} · ${rejectTarget.time}` : ''}</Typography><TextField autoFocus multiline minRows={3} fullWidth label="Reject reason" value={reason} onChange={(event) => setReason(event.target.value)} /></DialogContent><DialogActions><Button onClick={() => setRejectTarget(null)}>Cancel</Button><Button variant="contained" color="error" disabled={!reason.trim() || Boolean(busyId)} onClick={reject}>{busyId ? 'Rejecting...' : 'Reject Booking'}</Button></DialogActions></Dialog>

    <Dialog open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} fullWidth maxWidth="sm"><DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Booking Details</DialogTitle><DialogContent dividers>{viewTarget && <Stack spacing={.75}>{[
      ['Meeting', viewTarget.title], ['Requester', viewTarget.user], ['Department', viewTarget.department], ['Room', viewTarget.room], ['Date', formatDate(viewTarget.date)], ['Time', viewTarget.time], ['People', viewTarget.participants], ['Status', viewTarget.status], ['Reject Reason', viewTarget.rejectReason || '-']
    ].map(([label, value]) => <Stack key={label} direction="row" justifyContent="space-between"><Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>{label}</Typography><Typography sx={{ fontSize: '.72rem', fontWeight: 700, color: '#314A65' }}>{value}</Typography></Stack>)}</Stack>}<BookingHistory bookingId={viewTarget?.id} /></DialogContent><DialogActions><Button onClick={() => setViewTarget(null)}>Close</Button>{canManageBookings && canCancelBooking(viewTarget, { isManager: true }) && viewTarget?.status === BOOKING_STATUS.APPROVED && <Button color="warning" variant="outlined" onClick={() => { setCancelTarget(viewTarget); setViewTarget(null); }}>Cancel Approved Booking</Button>}</DialogActions></Dialog>
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title="Permanently Delete Booking"
      message={deleteTarget ? `Permanently delete “${deleteTarget.title}” (${deleteTarget.status}) on ${formatDate(deleteTarget.date)} at ${deleteTarget.time}? The booking and its history will be removed from the database. This action cannot be undone. No email will be sent.` : ''}
      confirmText="Delete Permanently"
      onClose={() => setDeleteTarget(null)}
      onConfirm={async () => {
        if (!isAdmin || !deleteTarget) return;
        if (await deleteBooking(deleteTarget.id)) {
          if (viewTarget?.id === deleteTarget.id) setViewTarget(null);
          setDeleteTarget(null);
        }
      }}
    />
    <ConfirmDialog open={Boolean(cancelTarget)} title="Cancel Approved Booking" message={cancelTarget ? `Cancel the approved booking “${cancelTarget.title}” on ${formatDate(cancelTarget.date)} at ${cancelTarget.time}? The requester cannot edit an approved booking.` : ''} confirmText="Cancel Booking" confirmColor="warning" onClose={() => setCancelTarget(null)} onConfirm={async () => { if (cancelTarget && await cancelBooking(cancelTarget.id)) setCancelTarget(null); }} />
    <ConfirmDialog open={Boolean(approving)} title="Approve booking" message={approving ? `Approve “${approving.title}” for ${formatDate(approving.date)} at ${approving.time}?` : ''} confirmText="Approve" confirmColor="success" onClose={() => setApproving(null)} onConfirm={async () => { if (approving && await approveBooking(approving.id)) setApproving(null); }} />
  </Box>;
}
