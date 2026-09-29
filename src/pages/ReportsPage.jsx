import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Box, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import HighlightOffOutlined from '@mui/icons-material/HighlightOffOutlined';
import MainCard from '../components/MainCard';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusChip from '../components/StatusChip';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../utils/date';

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function downloadCsv(rows, fromDate, toDate) {
  const headers = ['Booking ID', 'Meeting', 'Booked By', 'Account', 'Email', 'Department', 'Room', 'Date', 'Time', 'People', 'Status', 'Requested At', 'Approved By', 'Reject Reason'];
  const lines = [headers.map(csvEscape).join(',')];
  rows.forEach((row) => lines.push([
    row.id, row.title, row.user, row.account || '', row.email || '', row.department, row.room, row.date, row.time, row.participants,
    row.status, row.createdAt, row.approvedBy || '', row.rejectReason || ''
  ].map(csvEscape).join(',')));
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `meeting-room-report_${fromDate || 'all'}_${toDate || 'all'}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function Kpi({ label, value, icon: Icon, tone }) {
  return <Paper elevation={0} sx={{ p: 1.35, borderRadius: 2, border: `1px solid ${tone}35`, background: `linear-gradient(135deg,#fff,${tone}0C)` }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box><Typography sx={{ fontSize: '.66rem', textTransform: 'uppercase', fontWeight: 800, color: tone }}>{label}</Typography><Typography sx={{ mt: .45, fontSize: '1.3rem', fontWeight: 800, color: '#173B63' }}>{value}</Typography></Box>
      <Box sx={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${tone}18`, color: tone }}><Icon sx={{ fontSize: 21 }} /></Box>
    </Stack>
  </Paper>;
}

export default function ReportsPage() {
  const { bookings, rooms, showNotification } = useAppData();
  const [fromDate, setFromDate] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'));
  const [room, setRoom] = useState('');
  const [requester, setRequester] = useState('');
  const [status, setStatus] = useState('');
  const requesters = useMemo(() => [...new Map(
    bookings.filter((row) => row.user).map((row) => [row.userId || row.user, { id: row.userId || row.user, name: row.user }])
  ).values()].sort((a, b) => a.name.localeCompare(b.name)), [bookings]);

  const [appliedFilters, setAppliedFilters] = useState(() => ({
    fromDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    toDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    room: '', requester: '', status: ''
  }));

  const filtered = useMemo(() => bookings.filter((row) => {
    if (appliedFilters.fromDate && row.date < appliedFilters.fromDate) return false;
    if (appliedFilters.toDate && row.date > appliedFilters.toDate) return false;
    if (appliedFilters.room && row.room !== appliedFilters.room) return false;
    if (appliedFilters.requester && row.user !== appliedFilters.requester) return false;
    if (appliedFilters.status && row.status !== appliedFilters.status) return false;
    return true;
  }), [bookings, appliedFilters]);

  const applyFilters = () => setAppliedFilters({ fromDate, toDate, room, requester, status });

  const clearFilters = () => {
    const defaults = {
      fromDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      toDate: dayjs().endOf('month').format('YYYY-MM-DD'),
      room: '', requester: '', status: ''
    };
    setFromDate(defaults.fromDate);
    setToDate(defaults.toDate);
    setRoom('');
    setRequester('');
    setStatus('');
    setAppliedFilters(defaults);
  };

  return <Box sx={{ p: .55 }}>
    <PageHeader
      title="Booking Reports"
      subtitle="Booking report by date, room, user and approval status"
      actions={<Stack direction="row" spacing={.65}>
        <Button size="small" variant="contained" startIcon={<DownloadOutlined />} onClick={() => { downloadCsv(filtered, appliedFilters.fromDate, appliedFilters.toDate); showNotification(`Exported ${filtered.length} report record${filtered.length === 1 ? '' : 's'}.`); }} disabled={!filtered.length}>Export CSV</Button>
      </Stack>}
    />

    <MainCard sx={{ mb: 1.05 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={.8} alignItems={{ xs: 'stretch', lg: 'center' }}>
        <TextField label="From date" type="date" size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 155 }} />
        <TextField label="To date" type="date" size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 155 }} />
        <TextField select label="Room" size="small" value={room} onChange={(e) => setRoom(e.target.value)} sx={{ minWidth: 185 }}>
          <MenuItem value="">All rooms</MenuItem>{rooms.map((item) => <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>)}
        </TextField>
        <TextField select label="User" size="small" value={requester} onChange={(e) => setRequester(e.target.value)} sx={{ minWidth: 185 }}>
          <MenuItem value="">All users</MenuItem>{requesters.map((item) => <MenuItem key={item.id} value={item.name}>{item.name}</MenuItem>)}
        </TextField>
        <TextField select label="Status" size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 155 }}>
          <MenuItem value="">All status</MenuItem><MenuItem value="PENDING">PENDING</MenuItem><MenuItem value="APPROVED">APPROVED</MenuItem><MenuItem value="REJECTED">REJECTED</MenuItem><MenuItem value="CANCELLED">CANCELLED</MenuItem>
        </TextField>
        <Button size="small" variant="contained" startIcon={<SearchOutlined />} onClick={applyFilters}>Search</Button>
        <Button size="small" variant="outlined" startIcon={<RestartAltOutlined />} onClick={clearFilters}>Reset Search</Button>
      </Stack>
    </MainCard>

    <Grid container spacing={1.05} sx={{ mb: 1.05 }}>
      <Grid item xs={12} sm={6} lg={3}><Kpi label="Total records" value={filtered.length} icon={AssessmentOutlined} tone="#4680FF" /></Grid>
      <Grid item xs={12} sm={6} lg={3}><Kpi label="Approved" value={filtered.filter((row) => row.status === 'APPROVED').length} icon={CheckCircleOutline} tone="#2CA87F" /></Grid>
      <Grid item xs={12} sm={6} lg={3}><Kpi label="Pending" value={filtered.filter((row) => row.status === 'PENDING').length} icon={PendingActionsOutlined} tone="#E58A00" /></Grid>
      <Grid item xs={12} sm={6} lg={3}><Kpi label="Rejected / Cancelled" value={filtered.filter((row) => ['REJECTED', 'CANCELLED'].includes(row.status)).length} icon={HighlightOffOutlined} tone="#DC2626" /></Grid>
    </Grid>

    <MainCard content={false}>
      <DataTable
        rows={filtered}
        searchable={false}
        initialPageSize={10}
        columns={[
          { key: 'id', label: 'Booking ID' },
          { key: 'title', label: 'Meeting' },
          { key: 'user', label: 'Booked By' },
          { key: 'account', label: 'Account' },
          { key: 'department', label: 'Department' },
          { key: 'room', label: 'Room' },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
          { key: 'time', label: 'Time' },
          { key: 'participants', label: 'People', align: 'center' },
          { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> }
        ]}
      />
    </MainCard>
  </Box>;
}
