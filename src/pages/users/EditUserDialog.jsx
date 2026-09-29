import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { EMPTY_USER_FORM, ROLE_OPTIONS } from './userConfig';

export default function EditUserDialog({ open, user, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isDomain = (user?.accountSource || 'SYSTEM') === 'DOMAIN';

  useEffect(() => {
    if (open && user) {
      setForm({ ...EMPTY_USER_FORM, ...user, password: '' });
      setError('');
    }
  }, [open, user]);

  const change = (key) => (event) => { setError(''); setForm((current) => ({ ...current, [key]: event.target.value })); };
  const save = async () => {
    setSaving(true); setError('');
    try { await onSave(user.id, form); onClose(); } catch (e) { setError(e?.message || 'Unable to update user.'); } finally { setSaving(false); }
  };

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle sx={{ fontSize: '.95rem', fontWeight: 800 }}>{isDomain ? 'Edit Domain Account' : 'Edit System Account'}</DialogTitle>
    <DialogContent dividers><Stack spacing={1.4} sx={{ pt: .3 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="User ID" size="small" value={form.username || ''} disabled />
      {isDomain && <TextField label="Domain Account" size="small" value={form.domainAccount || form.username || ''} disabled />}
      <TextField label="Full Name" size="small" value={form.name || ''} onChange={change('name')} />
      <TextField label="Email" size="small" value={form.email || ''} onChange={change('email')} disabled={isDomain} helperText={isDomain ? 'Domain email is created from the authenticated AD account and cannot be changed here.' : ''} />
      <TextField label="Department" size="small" value={form.department || ''} onChange={change('department')} placeholder={isDomain ? 'Blank until Admin assigns a department' : ''} />
      <TextField label="Role" select size="small" value={form.role} onChange={change('role')}>{ROLE_OPTIONS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField>
      <TextField label="Status" select size="small" value={form.active ? 'ACTIVE' : 'DISABLED'} onChange={(e) => setForm((current) => ({ ...current, active: e.target.value === 'ACTIVE' }))}><MenuItem value="ACTIVE">ACTIVE</MenuItem><MenuItem value="DISABLED">DISABLED</MenuItem></TextField>
      <Alert severity="info" sx={{ py: .2 }}>
        {isDomain
          ? 'This account was created automatically after a successful Domain login. Its password is managed by Active Directory. Admin can manage Department, Role and Status here.'
          : 'Password is not editable here. Use Admin Reset Password for this System Account.'}
      </Alert>
    </Stack></DialogContent>
    <DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" disabled={saving || !form.name || !form.email} onClick={save}>{saving ? 'Saving...' : 'Save'}</Button></DialogActions>
  </Dialog>;
}
