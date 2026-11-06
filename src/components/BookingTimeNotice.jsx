import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';

// Clicking an unavailable calendar date/time should explain why instead of silently doing nothing.
export default function BookingTimeNotice({ message, onClose }) {
  return <Dialog open={Boolean(message)} onClose={onClose} aria-labelledby="booking-time-notice-title" fullWidth maxWidth="xs"
    PaperProps={{ sx: { borderRadius: 2.8, overflow: 'hidden' } }}>
    <DialogTitle id="booking-time-notice-title" sx={{ pb: 1.1, pt: 2.3 }}>
      <Stack direction="row" spacing={1.2} alignItems="center">
        <WarningAmberRounded sx={{ color: '#CF7D16', fontSize: 27 }} />
        <Typography component="span" sx={{ fontSize: '1rem', fontWeight: 800, color: '#173B63' }}>Booking time unavailable</Typography>
      </Stack>
    </DialogTitle>
    <DialogContent sx={{ pt: '4px !important', pb: 1.5 }}>
      <Typography sx={{ fontSize: '.85rem', lineHeight: 1.6, color: '#405971' }}>{message}</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.3 }}>
      <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', minWidth: 76 }}>OK</Button>
    </DialogActions>
  </Dialog>;
}
