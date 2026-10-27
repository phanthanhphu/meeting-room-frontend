import { BOOKING_STATUS, BOOKING_STATUS_GROUPS } from '../constants/statuses.js';
import { useMemo, useState } from 'react';
import { downloadBookingReportXlsx } from '../utils/exportBookingReportXlsx';
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
import FilterToolbar from '../components/FilterToolbar';
import DataTable from '../components/DataTable';
import StatusChip from '../components/StatusChip';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../utils/date';

function Kpi({ label, value, icon: Icon, tone }) {
  return <Paper elevation={0} sx={{ p: 1.35, borderRadius: 2, border: `1px solid ${tone}35`, background: `linear-gradient(135deg,#fff,${tone}0C)` }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box><Typography sx={{ fontSize: '.66rem', textTransform: 'uppercase', fontWeight: 800, color: tone }}>{label}</Typography><Typography sx={{ mt: .45, fontSize: '1.3rem', fontWeight: 800, color: '#173B63' }}>{value}</Typography></Box>
      <Box sx={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${tone}18`, color: tone }}><Icon sx={{ fontSize: 21 }} /></Box>
    </Stack>
  </Paper>;
}

export default function ReportsPage() {
  const { loading, bookings, rooms, showNotification } = useAppData();
  const [fromDate, setFromDate] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'));
  const [room, setRoom] = useState('');
  const [requester, setRequester] = useState('');
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
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
    if (appliedFilters.room && row.roomId !== appliedFilters.room) return false;
    if (appliedFilters.requester && (row.userId || row.user) !== appliedFilters.requester) return false;
    if (appliedFilters.status && row.status !== appliedFilters.status) return false;
    return true;
  }), [bookings, appliedFilters]);

  const exportExcel = () => {
    if (exporting || !filtered.length || loading) return;
    setExporting(true);
    try {
      downloadBookingReportXlsx({ rows: filtered, filters: appliedFilters, rooms, requesters });
      showNotification(`Exported ${filtered.length} booking${filtered.length === 1 ? '' : 's'} to formatted Excel.`);
    } catch (error) {
      showNotification(error?.message || 'Unable to generate Excel report.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const invalidDateRange = Boolean(fromDate && toDate && fromDate > toDate);
  const applyFilters = () => { if (!invalidDateRange) setAppliedFilters({ fromDate, toDate, room, requester, status }); };

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
      subtitle="Filter bookings and export Excel with an overview, booking details, user totals, and a booking timeline"
      actions={<Stack direction="row" spacing={.65}>
        <Button size="small" variant="contained" startIcon={<DownloadOutlined />} onClick={exportExcel} disabled={!filtered.length || exporting || loading}>{exporting ? 'Preparing Excel...' : 'Export Excel'}</Button>
      </Stack>}
    />

    <MainCard sx={{ mb: 1.05 }}>
      <FilterToolbar actions={<>
        <Button size="small" variant="contained" startIcon={<SearchOutlined />} onClick={applyFilters} disabled={invalidDateRange}>Search</Button>
        <Button size="small" variant="outlined" startIcon={<RestartAltOutlined />} onClick={clearFilters}>Reset</Button>
      </>}>

        <TextField label="From date" type="date" size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 155 }} />
        <TextField label="To date" type="date" size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 155 }} />
        <TextField select label="Room" size="small" value={room} onChange={(e) => setRoom(e.target.value)} sx={{ minWidth: 185 }}>
          <MenuItem value="">All rooms</MenuItem>{rooms.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>
        <TextField select label="User" size="small" value={requester} onChange={(e) => setRequester(e.target.value)} sx={{ minWidth: 185 }}>
          <MenuItem value="">All users</MenuItem>{requesters.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>
        <TextField select label="Status" size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 155 }}>
          <MenuItem value="">All status</MenuItem><MenuItem value="PENDING">PENDING</MenuItem><MenuItem value="APPROVED">APPROVED</MenuItem><MenuItem value="REJECTED">REJECTED</MenuItem><MenuItem value="CANCELLED">CANCELLED</MenuItem><MenuItem value="COMPLETED">COMPLETED</MenuItem>
        </TextField>
      </FilterToolbar>
      {invalidDateRange && <Typography color="error" sx={{ mt: 1, fontSize: '.8rem' }}>From date must not be later than to date.</Typography>}
    </MainCard>

    <Grid container spacing={1.05} sx={{ mb: 1.05 }}>
      <Grid item xs={12} sm={6} lg={3}><Kpi label="Total records" value={filtered.length} icon={AssessmentOutlined} tone="#4680FF" /></Grid>
      <Grid item xs={12} sm={6} lg={3}><Kpi label="Approved / completed" value={filtered.filter((row) => BOOKING_STATUS_GROUPS.REPORT_ACTIVE.includes(row.status)).length} icon={CheckCircleOutline} tone="#2CA87F" /></Grid>
      <Grid item xs={12} sm={6} lg={3}><Kpi label="Pending" value={filtered.filter((row) => row.status === BOOKING_STATUS.PENDING).length} icon={PendingActionsOutlined} tone="#E58A00" /></Grid>
      <Grid item xs={12} sm={6} lg={3}><Kpi label="Rejected / Cancelled" value={filtered.filter((row) => BOOKING_STATUS_GROUPS.REPORT_CLOSED.includes(row.status)).length} icon={HighlightOffOutlined} tone="#DC2626" /></Grid>
    </Grid>

    <MainCard content={false}>
      <DataTable
        loading={loading}
        rows={filtered}
        searchable={false}
        initialPageSize={10}
        columns={[
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
