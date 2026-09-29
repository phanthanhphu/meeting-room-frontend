import { useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Stack, TextField } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import { EMPTY_USER_FORM, ROLE_OPTIONS, generateRandomPassword, isValidPassword, PASSWORD_POLICY } from './userConfig';

export default function AddUserDialog({ open, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const passwordValid = useMemo(() => isValidPassword(form.password), [form.password]);

  const reset = () => { setForm(EMPTY_USER_FORM); setShowPassword(false); setError(''); };
  const close = () => { reset(); onClose(); };
  const change = (key) => (event) => { setError(''); setForm((current) => ({ ...current, [key]: event.target.value })); };
  const generate = () => { setForm((current) => ({ ...current, password: generateRandomPassword(14) })); setShowPassword(true); };

  const save = async () => {
    if (!passwordValid) { setError(PASSWORD_POLICY.message); return; }
    setSaving(true); setError('');
    try {
      await onSave(form);
      reset();
      onClose();
    } catch (e) {
      setError(e?.message || 'Unable to create user.');
    } finally { setSaving(false); }
  };

  return <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
    <DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>Add System User</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={1.4} sx={{ pt: .3 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="User ID" size="small" value={form.username} onChange={change('username')} />
        <TextField label="Full Name" size="small" value={form.name} onChange={change('name')} />
        <TextField label="Email" size="small" value={form.email} onChange={change('email')} />
        <TextField label="Department" size="small" value={form.department} onChange={change('department')} />
        <TextField label="Role" select size="small" value={form.role} onChange={change('role')}>{ROLE_OPTIONS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField>
        <TextField label="Status" select size="small" value={form.active ? 'ACTIVE' : 'DISABLED'} onChange={(e) => setForm((current) => ({ ...current, active: e.target.value === 'ACTIVE' }))}><MenuItem value="ACTIVE">ACTIVE</MenuItem><MenuItem value="DISABLED">DISABLED</MenuItem></TextField>
        <TextField label="Initial Password" size="small" type={showPassword ? 'text' : 'password'} value={form.password} onChange={change('password')} error={Boolean(form.password) && !passwordValid} helperText={PASSWORD_POLICY.message} autoComplete="new-password" InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
        <Button size="small" variant="outlined" startIcon={<AutoAwesomeOutlined />} onClick={generate} sx={{ alignSelf: 'flex-start' }}>Generate Secure Password</Button>
        <Alert severity="info" sx={{ py: .2 }}>This creates a System Account with a local password. Domain users do not need to be created here; they are added automatically after their first successful Domain login.</Alert>
      </Stack>
    </DialogContent>
    <DialogActions><Button onClick={close}>Cancel</Button><Button variant="contained" disabled={saving || !form.username || !form.name || !form.email || !form.department || !passwordValid} onClick={save}>{saving ? 'Saving...' : 'Save'}</Button></DialogActions>
  </Dialog>;
}
