import { formatDateTime } from '../utils/date.js';
import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import globalApi from '../routes/globalApi';

export default function BookingHistory({ bookingId }) {
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  useEffect(() => {
    if (!bookingId) return undefined;
    let active = true;
    setState({ loading: true, rows: [], error: '' });
    globalApi.bookings.history(bookingId)
      .then((rows) => { if (active) setState({ loading: false, rows: rows || [], error: '' }); })
      .catch((error) => { if (active) setState({ loading: false, rows: [], error: error.message || 'Unable to load history.' }); });
    return () => { active = false; };
  }, [bookingId]);
  return <Box sx={{ mt: 1.5, pt: 1.2, borderTop: '1px solid #E5ECF3' }}>
    <Typography sx={{ fontWeight: 800, color: '#24456C', fontSize: '.83rem', mb: 1 }}>Activity history</Typography>
    {state.loading && <Stack direction="row" alignItems="center" gap={1}><CircularProgress size={15} /><Typography variant="caption">Loading history...</Typography></Stack>}
    {state.error && <Alert severity="warning" sx={{ fontSize: '.73rem' }}>{state.error}</Alert>}
    {!state.loading && !state.error && !state.rows.length && <Typography variant="caption" color="text.secondary">No recorded actions.</Typography>}
    <Stack spacing={1}>
      {state.rows.map((item) => <Box key={item.id} sx={{ pl: 1.25, borderLeft: '3px solid #9DBDEF' }}>
        <Typography sx={{ fontSize: '.73rem', fontWeight: 750, color: '#29496D' }}>{String(item.action || '').replaceAll('_', ' ')} · {item.actor?.fullName || 'System'}</Typography>
        <Typography sx={{ fontSize: '.68rem', color: '#7287A0' }}>{item.createdAt ? formatDateTime(item.createdAt) : ''}</Typography>
        {item.note && <Typography sx={{ fontSize: '.7rem', color: '#5D7188', whiteSpace: 'pre-wrap' }}>{item.note}</Typography>}
      </Box>)}
    </Stack>
  </Box>;
}
