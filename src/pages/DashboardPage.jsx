import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Box, Button, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import StarOutlineOutlined from '@mui/icons-material/StarOutlineOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import MainCard from '../components/MainCard';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import DataTable from '../components/DataTable';
import { formatDate } from '../utils/date';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

const chartColors = ['#4680FF', '#2CA87F', '#E58A00', '#7C3AED', '#3EC9D6', '#E25563'];

function Kpi({ label, value, icon: Icon, tone, helper }) {
  return (
    <Paper elevation={0} sx={{ p: 1.4, minHeight: 108, border: `1px solid ${tone}35`, borderRadius: 2, background: `linear-gradient(135deg,#fff 0%,${tone}0C 100%)`, boxShadow: '0 4px 18px rgba(22,56,93,.035)' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: tone, fontSize: '.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: .25 }}>{label}</Typography>
          <Typography noWrap sx={{ mt: .5, color: '#173B63', fontSize: '1.35rem', lineHeight: 1.1, fontWeight: 800 }}>{value}</Typography>
          <Typography noWrap sx={{ mt: .6, color: '#71849A', fontSize: '.67rem', fontWeight: 650 }}>{helper}</Typography>
        </Box>
        <Box sx={{ width: 44, height: 44, flex: '0 0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${tone}18`, color: tone }}><Icon sx={{ fontSize: 22 }} /></Box>
      </Stack>
    </Paper>
  );
}

function SectionTitle({ title, subtitle }) {
  return <Box sx={{ px: 1.4, py: 1.05, borderBottom: '1px solid #E4EBF2' }}><Typography sx={{ fontSize: '.82rem', fontWeight: 800, color: '#173B63' }}>{title}</Typography>{subtitle && <Typography sx={{ mt: .12, fontSize: '.66rem', color: '#71849A' }}>{subtitle}</Typography>}</Box>;
}

function TrendChart({ rows }) {
  const data = useMemo(() => {
    const counts = {};
    rows.forEach((row) => { counts[row.date] = (counts[row.date] || 0) + 1; });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, count]) => ({ date, count }));
  }, [rows]);
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <Box sx={{ px: 1.5, pt: 1.2, pb: 1.25 }}>
      <Stack direction="row" alignItems="flex-end" spacing={.7} sx={{ height: 178, borderBottom: '1px solid #E5ECF3', backgroundImage: 'linear-gradient(to top, #EEF3F8 1px, transparent 1px)', backgroundSize: '100% 44px' }}>
        {data.map((item) => (
          <TooltipBar key={item.date} label={`${formatDate(item.date)}: ${item.count} booking${item.count > 1 ? 's' : ''}`} height={`${Math.max(10, (item.count / max) * 150)}px`} />
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: .55 }}>
        <Typography sx={{ fontSize: '.6rem', color: '#8496A8' }}>{data[0] ? formatDate(data[0].date) : '-'}</Typography>
        <Typography sx={{ fontSize: '.6rem', color: '#8496A8' }}>{data[data.length - 1] ? formatDate(data[data.length - 1].date) : '-'}</Typography>
      </Stack>
    </Box>
  );
}

function TooltipBar({ label, height }) {
  return <Box title={label} sx={{ flex: 1, minWidth: 8, maxWidth: 34, height, borderRadius: '4px 4px 0 0', bgcolor: '#4680FF', opacity: .88, transition: '.15s', '&:hover': { opacity: 1, transform: 'translateY(-2px)' } }} />;
}

function RoomUsageChart({ rows }) {
  const data = useMemo(() => {
    const counts = {};
    rows.forEach((row) => { counts[row.room] = (counts[row.room] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [rows]);
  const max = Math.max(1, ...data.map(([, count]) => count));
  return <Stack spacing={1.05} sx={{ p: 1.45 }}>{data.map(([room, count], index) => <Box key={room}><Stack direction="row" justifyContent="space-between" sx={{ mb: .35 }}><Typography sx={{ fontSize: '.68rem', color: '#425A72', fontWeight: 650 }}>{room}</Typography><Typography sx={{ fontSize: '.66rem', color: '#71849A', fontWeight: 700 }}>{count}</Typography></Stack><Box sx={{ height: 8, bgcolor: '#EDF2F7', borderRadius: 6, overflow: 'hidden' }}><Box sx={{ width: `${(count / max) * 100}%`, height: 1, borderRadius: 6, bgcolor: chartColors[index % chartColors.length] }} /></Box></Box>)}</Stack>;
}

function StatusDonut({ rows }) {
  const counts = rows.reduce((acc, row) => ({ ...acc, [row.status]: (acc[row.status] || 0) + 1 }), {});
  const total = Math.max(1, rows.length);
  const approved = counts.APPROVED || 0;
  const pending = counts.PENDING || 0;
  const rejected = counts.REJECTED || 0;
  const a = approved / total * 360;
  const p = pending / total * 360;
  return <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.5 }}><Box sx={{ width: 118, height: 118, borderRadius: '50%', background: `conic-gradient(#2CA87F 0deg ${a}deg,#E58A00 ${a}deg ${a + p}deg,#DC2626 ${a + p}deg 360deg)`, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}><Box sx={{ width: 72, height: 72, bgcolor: '#FFF', borderRadius: '50%', display: 'grid', placeItems: 'center' }}><Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#173B63' }}>{rows.length}</Typography><Typography sx={{ fontSize: '.58rem', color: '#71849A' }}>Bookings</Typography></Box></Box></Box><Stack spacing={.9}>{[['Approved', approved, '#2CA87F'], ['Pending', pending, '#E58A00'], ['Rejected', rejected, '#DC2626']].map(([label, count, color]) => <Stack key={label} direction="row" spacing={.7} alignItems="center"><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} /><Typography sx={{ fontSize: '.68rem', color: '#536A80', minWidth: 55 }}>{label}</Typography><Typography sx={{ fontSize: '.7rem', fontWeight: 800, color: '#173B63' }}>{count}</Typography></Stack>)}</Stack></Stack>;
}

export default function DashboardPage() {
  const { user, canViewAllBookings } = useAuth();
  const { bookings, rooms } = useAppData();
  const [fromDate, setFromDate] = useState(() => dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(() => dayjs().endOf('month').format('YYYY-MM-DD'));

  const scopedBookings = useMemo(() => canViewAllBookings ? bookings : bookings.filter((row) => row.userId ? row.userId === user?.id : row.user === user?.fullName), [bookings, canViewAllBookings, user]);
  const filtered = useMemo(() => scopedBookings.filter((row) => (!fromDate || row.date >= fromDate) && (!toDate || row.date <= toDate)), [scopedBookings, fromDate, toDate]);
  const approvedPeriodRows = useMemo(() => filtered.filter((row) => row.status === 'APPROVED'), [filtered]);
  const roomCounts = useMemo(() => approvedPeriodRows.reduce((acc, row) => ({ ...acc, [row.room]: (acc[row.room] || 0) + 1 }), {}), [approvedPeriodRows]);
  const userCounts = useMemo(() => approvedPeriodRows.reduce((acc, row) => ({ ...acc, [row.user]: (acc[row.user] || 0) + 1 }), {}), [approvedPeriodRows]);
  const topRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const topUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const usedRooms = Object.keys(roomCounts).length;
  const pending = filtered.filter((row) => row.status === 'PENDING').length;
  const approved = approvedPeriodRows.length;

  return <Box sx={{ p: .55 }}>
    <PageHeader title="Meeting Room Dashboard" subtitle={canViewAllBookings ? "Global booking statistics and room usage overview" : "Your booking statistics and room usage overview"} />

    <MainCard sx={{ mb: 1.1 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={1}>
        <Box><Typography sx={{ fontSize: '.75rem', fontWeight: 800, color: '#334E68' }}>Dashboard Date Filter</Typography><Typography sx={{ mt: .15, fontSize: '.64rem', color: '#71849A' }}>All statistics and charts below follow this date range.</Typography></Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={.75} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField label="From date" type="date" size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: { sm: 165 }, '& .MuiOutlinedInput-root': { height: 36 } }} />
          <TextField label="To date" type="date" size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: { sm: 165 }, '& .MuiOutlinedInput-root': { height: 36 } }} />
          <Button size="small" variant="outlined" startIcon={<RestartAltOutlined />} onClick={() => { setFromDate(dayjs().startOf('month').format('YYYY-MM-DD')); setToDate(dayjs().endOf('month').format('YYYY-MM-DD')); }}>This month</Button>
        </Stack>
      </Stack>
    </MainCard>

    <Grid container spacing={1.05}>
      <Grid item xs={12} sm={6} lg={2.4}><Kpi label="Bookings" value={filtered.length} helper={`${approved} approved`} icon={EventAvailableOutlined} tone="#4680FF" /></Grid>
      <Grid item xs={12} sm={6} lg={2.4}><Kpi label="Rooms Used" value={`${usedRooms}/${rooms.length}`} helper="Rooms in selected period" icon={MeetingRoomOutlined} tone="#2CA87F" /></Grid>
      <Grid item xs={12} sm={6} lg={2.4}><Kpi label={canViewAllBookings ? 'Top Booker' : 'My Approved'} value={canViewAllBookings ? topUser[0] : approved} helper={canViewAllBookings ? `${topUser[1]} approved meetings` : `${pending} pending`} icon={PersonOutlineOutlined} tone="#7C3AED" /></Grid>
      <Grid item xs={12} sm={6} lg={2.4}><Kpi label="Top Room" value={topRoom[0]} helper={`${topRoom[1]} approved meetings`} icon={StarOutlineOutlined} tone="#3EC9D6" /></Grid>
      <Grid item xs={12} sm={6} lg={2.4}><Kpi label="Pending" value={pending} helper="Waiting for approval" icon={PendingActionsOutlined} tone="#E58A00" /></Grid>
    </Grid>

    <Grid container spacing={1.05} sx={{ mt: .05 }}>
      <Grid item xs={12} lg={7}>
        <MainCard content={false} sx={{ height: '100%' }}><SectionTitle title="Booking Trend" subtitle="Number of booking requests by date" /><TrendChart rows={filtered} /></MainCard>
      </Grid>
      <Grid item xs={12} lg={5}>
        <MainCard content={false} sx={{ height: '100%' }}><SectionTitle title="Room Usage" subtitle="Approved meetings by room" /><RoomUsageChart rows={approvedPeriodRows} /></MainCard>
      </Grid>
      <Grid item xs={12} lg={5}>
        <MainCard content={false} sx={{ height: '100%' }}><SectionTitle title="Approval Status" subtitle="Approved, pending and rejected requests" /><StatusDonut rows={filtered} /></MainCard>
      </Grid>
      <Grid item xs={12} lg={7}>
        <MainCard content={false} sx={{ height: '100%' }}>
          <SectionTitle title="Bookings in Selected Period" subtitle="Approved meetings only" />
          <DataTable
            rows={approvedPeriodRows}
            initialPageSize={5}
            searchFields={[
              { key: 'id', label: 'Booking ID' },
              { key: 'title', label: 'Meeting' },
              { key: 'user', label: 'Booked By' }
            ]}
            filters={[
              { key: 'room', label: 'Room', options: [...new Set(approvedPeriodRows.map((row) => row.room))] }
            ]}
            columns={[
              { key: 'id', label: 'Booking ID' },
              { key: 'title', label: 'Meeting' },
              { key: 'user', label: 'Booked By' },
              { key: 'room', label: 'Room' },
              { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
              { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> }
            ]}
          />
        </MainCard>
      </Grid>
    </Grid>
  </Box>;
}
