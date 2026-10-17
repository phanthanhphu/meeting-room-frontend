import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

export default function ConfirmDialog({ open, title = 'Confirm', message, confirmText = 'Confirm', confirmColor = 'error', onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!open) setSubmitting(false); }, [open]);
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try { await onConfirm(); } finally { setSubmitting(false); }
  };
  return <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
    <DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>{title}</DialogTitle>
    <DialogContent><Typography sx={{ fontSize: '.76rem', color: '#61758B' }}>{message}</Typography></DialogContent>
    <DialogActions><Button disabled={submitting} onClick={onClose}>Cancel</Button><Button disabled={submitting} variant="contained" color={confirmColor} onClick={submit}>{submitting ? 'Processing...' : confirmText}</Button></DialogActions>
  </Dialog>;
}
