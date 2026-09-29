import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

export default function ConfirmDialog({ open, title = 'Confirm', message, confirmText = 'Confirm', confirmColor = 'error', onClose, onConfirm }) {
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>{title}</DialogTitle>
    <DialogContent><Typography sx={{ fontSize: '.76rem', color: '#61758B' }}>{message}</Typography></DialogContent>
    <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" color={confirmColor} onClick={onConfirm}>{confirmText}</Button></DialogActions>
  </Dialog>;
}
