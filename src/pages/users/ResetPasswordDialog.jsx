import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { PASSWORD_POLICY } from './userConfig';
import { PASSWORD_RESET_TEXT as TEXT } from '../../constants/users.js';
import { copyText } from '../../utils/copyText.js';

export default function ResetPasswordDialog({ open, user, isSelf = false, onClose, onReset }) {
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTemporaryPassword('');
      setError('');
      setSaving(false);
    }
  }, [open, user?.id]);

  const reset = async () => {
    if (!user?.id || saving || temporaryPassword) return;
    setSaving(true);
    setError('');
    try {
      const generatedPassword = await onReset(user.id);
      setTemporaryPassword(generatedPassword);
    } catch (error) {
      setError(error?.message || TEXT.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>{TEXT.title}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {!temporaryPassword ? (
          <Stack spacing={1}>
            <Typography sx={{ fontSize: '.76rem', color: '#61758B' }}>
              {TEXT.prompt} <b>{user?.name}</b>?
            </Typography>
            <Alert severity="warning" sx={{ py: .2 }}>{TEXT.warning}</Alert>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Alert severity="success">{isSelf ? TEXT.selfSuccess : TEXT.success}</Alert>
            <Typography sx={{ fontSize: '.7rem', color: '#71849A' }}>{TEXT.passwordLabel}</Typography>
            <Typography sx={{ p: 1, borderRadius: 1, bgcolor: '#F4F7FB', border: '1px solid #DFE7EF', fontFamily: 'monospace', fontWeight: 800, color: '#173B63', letterSpacing: '.04em', overflowWrap: 'anywhere' }}>
              {temporaryPassword}
            </Typography>
            <Button size="small" variant="outlined" onClick={async () => { try { if (!await copyText(temporaryPassword)) setError(TEXT.copyError); } catch { setError(TEXT.copyError); } }}>
              {TEXT.copy}
            </Button>
            {!isSelf && <Alert severity="info" sx={{ fontSize: '.72rem' }}>{TEXT.shareWarning}</Alert>}
            <Typography sx={{ fontSize: '.72rem', color: '#71849A' }}>{PASSWORD_POLICY.message}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={onClose}>{TEXT.close}</Button>
        {!temporaryPassword && <Button variant="contained" disabled={saving} onClick={reset}>
          {saving ? TEXT.resetting : TEXT.action}
        </Button>}
      </DialogActions>
    </Dialog>
  );
}
