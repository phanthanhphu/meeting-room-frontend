import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { PASSWORD_POLICY } from './userConfig';

export default function ResetPasswordDialog({ open, user, onClose, onReset }) {
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setTemporaryPassword(''); setError(''); } }, [open, user?.id]);
  const reset = async () => {
    setSaving(true); setError('');
    try { setTemporaryPassword(await onReset(user.id)); } catch (e) { setError(e?.message || 'Unable to reset password.'); } finally { setSaving(false); }
  };
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Reset Password</DialogTitle>
    <DialogContent dividers>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {!temporaryPassword ? <Stack spacing={1}><Typography sx={{ fontSize: '.76rem', color: '#61758B' }}>Generate a new secure password for <b>{user?.name}</b>?</Typography><Alert severity="warning" sx={{ py: .2 }}>The database password hash is replaced immediately. The generated password can be used on the next login.</Alert></Stack> : <Stack spacing={1}><Alert severity="success">Password reset completed. This is the new login password.</Alert><Typography sx={{ fontSize: '.7rem', color: '#71849A' }}>Temporary password</Typography><Typography sx={{ p: 1, borderRadius: 1, bgcolor: '#F4F7FB', border: '1px solid #DFE7EF', fontFamily: 'monospace', fontWeight: 800, color: '#173B63', letterSpacing: '.04em' }}>{temporaryPassword}</Typography><Typography sx={{ fontSize: '.66rem', color: '#71849A' }}>{PASSWORD_POLICY.message}</Typography></Stack>}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Close</Button>{!temporaryPassword && <Button variant="contained" disabled={saving} onClick={reset}>{saving ? 'Resetting...' : 'Reset Password'}</Button>}</DialogActions>
  </Dialog>;
}
