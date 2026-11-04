import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, Grid, IconButton, MenuItem, Paper,
  Snackbar, Stack, Switch, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, TextField, Tooltip, Typography
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import MarkEmailReadOutlined from '@mui/icons-material/MarkEmailReadOutlined';
import NotificationsActiveOutlined from '@mui/icons-material/NotificationsActiveOutlined';
import OutboxOutlined from '@mui/icons-material/OutboxOutlined';
import PreviewOutlined from '@mui/icons-material/PreviewOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import api, { errorMessage } from '../api/client';
import PageHeader from '../components/PageHeader';

const BASE = '/admin/mail';
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const EVENT_INFO = [
  { id: 'pending', type: 'CREATED', label: 'New booking / Pending approval', subtitle: 'New request created by a user' },
  { id: 'approved', type: 'APPROVED', label: 'Booking approved', subtitle: 'Room Manager approves the request' },
  { id: 'rejected', type: 'REJECTED', label: 'Booking rejected', subtitle: 'Room Manager rejects with a reason' },
  { id: 'cancelled', type: 'CANCELLED', label: 'Booking cancelled', subtitle: 'User or Manager cancels the booking' }
];
const EMPTY_SENDER = { id: null, email: '', displayName: 'Meeting Room Booking', enabled: true,
  smtpUsername: '', smtpPassword: '', smtpHost: 'pop3.youngonevn.com', smtpPort: '30475', smtpSecurity: 'STARTTLS' };
const EMPTY_RULES = { pending: true, approved: true, rejected: true, cancelled: true };

const panelSx = { border: '1px solid #E4EBF3', boxShadow: 'none', borderRadius: 2.5, p: { xs: 1.5, sm: 2 }, bgcolor: '#fff' };
const muted = { color: '#71849A', fontSize: '.78rem' };
const heading = { color: '#1A3857', fontWeight: 800, fontSize: '1rem' };
const sectionHeader = (title, description, action) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.3} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
    <Box><Typography sx={heading}>{title}</Typography><Typography sx={muted}>{description}</Typography></Box>
    {action}
  </Stack>
);

export default function EmailManagementPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [status, setStatus] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteUrlSaved, setWebsiteUrlSaved] = useState('');
  const [websiteLinkSupported, setWebsiteLinkSupported] = useState(null);
  const [senders, setSenders] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientSaved, setRecipientSaved] = useState([]);
  const [rules, setRules] = useState(EMPTY_RULES);
  const [rulesSaved, setRulesSaved] = useState(EMPTY_RULES);
  const [outbox, setOutbox] = useState([]);
  const [senderEditor, setSenderEditor] = useState(null);
  const [testDialog, setTestDialog] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testSender, setTestSender] = useState('');
  const [recipientDialog, setRecipientDialog] = useState(null);
  const [recipientForm, setRecipientForm] = useState({ email: '', name: '', enabled: true });
  const [templateEvent, setTemplateEvent] = useState('CREATED');
  const [template, setTemplate] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  const reload = useCallback(async () => {
    // /website-link was added later than the original mail-management APIs.
    // A 404 from an older backend must never make all existing SMTP/recipient/rule
    // data disappear from the page. Only the optional URL feature is unavailable.
    const websiteRequest = api.get(`${BASE}/website-link`)
      .then(response => ({ supported: true, response }))
      .catch(err => {
        if ((err?.status ?? err?.response?.status) === 404) return { supported: false, response: null };
        throw err; // Do not hide 401, 403, network failures or 500s.
      });
    const [statusRes, senderRes, recipientRes, rulesRes, outboxRes, websiteResult] = await Promise.all([
      api.get(`${BASE}/status`), api.get(`${BASE}/senders`), api.get(`${BASE}/admin-recipients`),
      api.get(`${BASE}/notification-rules`), api.get(`${BASE}/outbox`), websiteRequest
    ]);
    setWebsiteLinkSupported(websiteResult.supported);
    if (websiteResult.supported) {
      const savedWebsiteUrl = websiteResult.response.data?.url || '';
      setWebsiteUrl(savedWebsiteUrl);
      setWebsiteUrlSaved(savedWebsiteUrl);
    }
    setStatus(statusRes.data);
    setSenders(senderRes.data || []);
    const loadedRecipients = recipientRes.data?.recipients || [];
    setRecipients(loadedRecipients); setRecipientSaved(loadedRecipients);
    const loadedRules = rulesRes.data || EMPTY_RULES;
    setRules(loadedRules); setRulesSaved(loadedRules);
    setOutbox(outboxRes.data || []);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    reload().catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  useEffect(() => {
    if (tab !== 3) return;
    let active = true;
    setPreviewBusy(true);
    api.get(`${BASE}/templates/${templateEvent}`)
      .then(({ data }) => { if (active) setTemplate(data); })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setPreviewBusy(false); });
    return () => { active = false; };
  }, [tab, templateEvent]);

  const execute = async (key, action, success = 'Saved successfully') => {
    if (busy) return;
    setBusy(key); setError('');
    try { await action(); await reload(); setToast(success); return true; }
    catch (e) { setError(errorMessage(e)); return false; }
    finally { setBusy(''); }
  };

  const startEditSender = sender => setSenderEditor(sender
    ? { ...sender, smtpPassword: '', smtpPort: String(sender.smtpPort) }
    : { ...EMPTY_SENDER, smtpHost: status?.smtpGatewayHost || EMPTY_SENDER.smtpHost,
        smtpPort: String(status?.smtpGatewayPort || EMPTY_SENDER.smtpPort),
        smtpSecurity: status?.smtpGatewaySecurity || EMPTY_SENDER.smtpSecurity });

  const saveSender = async () => {
    if (!senderEditor) return;
    if (!emailPattern.test(senderEditor.email.trim()) || !senderEditor.smtpUsername.trim() ||
      !senderEditor.displayName.trim() || !senderEditor.smtpHost.trim() ||
      !Number.isInteger(Number(senderEditor.smtpPort)) || Number(senderEditor.smtpPort) < 1 || Number(senderEditor.smtpPort) > 65535 ||
      (!senderEditor.id && !senderEditor.smtpPassword.trim())) {
      setError('Check the email, server, port and password fields before saving.'); return;
    }
    const body = { ...senderEditor, smtpPort: Number(senderEditor.smtpPort) };
    const ok = await execute('sender', async () => {
      if (senderEditor.id) await api.put(`${BASE}/senders/${senderEditor.id}`, body);
      else {
        const { data } = await api.post(`${BASE}/senders`, body);
        if (!senders.some(s => s.defaultSender)) await api.put(`${BASE}/default-sender`, { senderId: data.id });
      }
    }, 'SMTP sender saved');
    if (ok) setSenderEditor(null);
  };

  const saveRecipient = () => {
    const email = recipientForm.email.trim().toLowerCase();
    if (!emailPattern.test(email)) { setError('Enter a valid recipient email address.'); return; }
    if (recipients.some((r, index) => r.email.toLowerCase() === email && index !== recipientDialog)) {
      setError('This email is already in the recipient list.'); return;
    }
    const value = { email, name: recipientForm.name.trim(), enabled: Boolean(recipientForm.enabled) };
    setRecipients(list => recipientDialog === -1 ? [...list, value] : list.map((r, i) => i === recipientDialog ? value : r));
    setRecipientDialog(null); setError('');
  };
  const activeCount = recipients.filter(x => x.enabled).length;
  const recipientsDirty = JSON.stringify(recipients) !== JSON.stringify(recipientSaved);
  const rulesDirty = JSON.stringify(rules) !== JSON.stringify(rulesSaved);
  const websiteUrlDirty = websiteUrl.trim() !== websiteUrlSaved;
  const websiteUrlValid = (() => {
    if (!websiteUrl.trim()) return true; // Clearing the URL disables new email links.
    try {
      const u = new URL(websiteUrl.trim());
      return ['http:', 'https:'].includes(u.protocol) && Boolean(u.hostname) && !u.username && !u.password && !u.search && !u.hash;
    } catch { return false; }
  })();
  const defaultSender = senders.find(x => x.defaultSender);
  const readySenders = senders.filter(x => x.enabled && x.hasPassword);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={30} /></Box>;
  return <Box sx={{ px: { xs: .5, sm: 1 }, pb: 4 }}>
    <PageHeader title="Email Management" subtitle="Configure sender accounts, notification recipients, rules and delivery history"
      action={<Button variant="outlined" startIcon={<RefreshOutlined />} onClick={() => execute('reload', async () => {}, 'Information refreshed')} disabled={Boolean(busy)}>Refresh</Button>} />
    {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
    {websiteLinkSupported === false && <Alert severity="warning" sx={{ mb: 2 }}>The backend is still running an older Email Management version. Existing SMTP settings, recipients and notification rules are loaded normally, but Website URL links require updating the backend. No email settings have been deleted by this warning.</Alert>}
    <Paper sx={{ border: '1px solid #E4EBF3', borderRadius: 3, overflow: 'hidden', mb: 2 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ bgcolor: '#fff', minHeight: 46, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '.78rem', minHeight: 46, py: 1 } }}>
        <Tab icon={<SettingsOutlined fontSize="small" />} iconPosition="start" label="SMTP Settings" />
        <Tab icon={<MarkEmailReadOutlined fontSize="small" />} iconPosition="start" label="Admin Recipients" />
        <Tab icon={<NotificationsActiveOutlined fontSize="small" />} iconPosition="start" label="Notification Rules" />
        <Tab icon={<PreviewOutlined fontSize="small" />} iconPosition="start" label="Email Templates" />
        <Tab icon={<HistoryRounded fontSize="small" />} iconPosition="start" label="Email History" />
      </Tabs>
    </Paper>

    {tab === 0 && <Paper sx={panelSx}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={1.2} flexWrap="wrap">
          <Typography sx={heading}>Email service</Typography>
          <Chip size="small" color={status?.enabled ? 'success' : 'default'} label={status?.enabled ? 'Enabled' : 'Disabled'} />
          <Typography sx={muted}>Automatic booking notifications</Typography>
        </Stack>
        <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={Boolean(status?.enabled)} disabled={Boolean(busy) || (!status?.smtpCredentialsConfigured && !status?.enabled)}
          onChange={(_, enabled) => execute('toggle', () => api.put(`${BASE}/settings`, { enabled }), enabled ? 'Mail notifications enabled' : 'Mail notifications disabled')} />} label={<Typography fontSize=".8rem">Send notifications</Typography>} />
      </Stack>
      {!status?.encryptionKeyConfigured && <Alert severity="warning" sx={{ mb: 1.5 }}>SMTP encryption key unavailable. Configure MAIL_CREDENTIALS_KEY or the protected key file.</Alert>}
      <Divider sx={{ my: 1.5 }} />
      {sectionHeader('SMTP sender accounts', 'Mailboxes used to send booking notifications',
        <Button size="small" startIcon={<AddRounded />} variant="contained" disabled={Boolean(busy)} onClick={() => startEditSender(null)}>Add sender</Button>)}
      <TableContainer><Table size="small"><TableHead><TableRow>
        {['Sender address', 'SMTP gateway', 'Security', 'Status', 'Actions'].map(h => <TableCell key={h} sx={{ fontWeight: 800, color: '#60748A', bgcolor: '#F7F9FC', py: 1 }}>{h}</TableCell>)}
      </TableRow></TableHead><TableBody>
        {senders.length === 0 ? <TableRow><TableCell colSpan={5} sx={{ py: 3, textAlign: 'center', color: '#8190A0' }}>No SMTP sender configured.</TableCell></TableRow> :
          senders.map(s => <TableRow key={s.id} hover>
            <TableCell><Typography fontWeight={750} fontSize=".78rem">{s.email}</Typography><Typography sx={{ ...muted, fontSize: '.7rem' }}>{s.displayName}{s.defaultSender ? ' · Default sender' : ''}</Typography></TableCell>
            <TableCell sx={{ fontSize: '.76rem' }}>{s.smtpHost}:{s.smtpPort}</TableCell>
            <TableCell><Chip label={s.smtpSecurity} size="small" variant="outlined" /></TableCell>
            <TableCell><Chip label={s.enabled && s.hasPassword ? 'Ready' : 'Disabled'} color={s.enabled && s.hasPassword ? 'success' : 'default'} size="small" /></TableCell>
            <TableCell><Stack direction="row" gap={.5} alignItems="center">
              <Tooltip title="Edit"><IconButton size="small" onClick={() => startEditSender(s)}><EditOutlined fontSize="small" /></IconButton></Tooltip>
              {!s.defaultSender && <Button size="small" onClick={() => execute('default', () => api.put(`${BASE}/default-sender`, { senderId: s.id }), 'Default sender changed')} disabled={Boolean(busy) || !s.enabled}>Set default</Button>}
              {!s.defaultSender && <Tooltip title="Delete sender"><IconButton size="small" color="error" disabled={Boolean(busy)} onClick={() => { if (window.confirm(`Delete sender ${s.email}?`)) execute('delete', () => api.delete(`${BASE}/senders/${s.id}`), 'Sender deleted'); }}><DeleteOutlineRounded fontSize="small" /></IconButton></Tooltip>}
            </Stack></TableCell>
          </TableRow>)}
      </TableBody></Table></TableContainer>
      <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mt: 1.2 }}>
        <Button size="small" variant="outlined" startIcon={<CheckCircleOutlineRounded />} disabled={!defaultSender?.enabled || !defaultSender?.hasPassword || Boolean(busy)}
          onClick={() => execute('connection', () => api.post(`${BASE}/connection-test`, { senderId: defaultSender.id }), 'SMTP connection and authentication successful')}>Test connection</Button>
        <Button size="small" variant="outlined" startIcon={<SendOutlined />} disabled={!readySenders.length || !status?.enabled || Boolean(busy)}
          onClick={() => { setTestSender(defaultSender?.id || readySenders[0].id); setTestDialog(true); }}>Send test email</Button>
        <Typography sx={{ ...muted, ml: { sm: 1 } }}>Default: {status?.smtpGatewayHost}:{status?.smtpGatewayPort} ({status?.smtpGatewaySecurity})</Typography>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
        <Box sx={{ minWidth: { md: 195 } }}>
          <Typography sx={heading}>Website URL for emails</Typography>
          <Typography sx={muted}>Opens the exact booking from Outlook</Typography>
        </Box>
        <TextField size="small" fullWidth label="Meeting Room website" placeholder="https://meeting.company.com"
          value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} disabled={websiteLinkSupported === false} helperText="Use a URL reachable by recipients. localhost works only on your PC."
          inputProps={{ maxLength: 2048 }} />
        <Stack direction="row" gap={1} sx={{ alignSelf: { md: 'flex-start' }, pt: { md: .2 } }}>
          <Button size="small" variant="outlined" onClick={() => setWebsiteUrl(window.location.origin)} disabled={Boolean(busy) || websiteLinkSupported === false}>Use this site</Button>
          <Button size="small" variant="contained" startIcon={<SaveOutlined />} disabled={!websiteUrlDirty || !websiteUrlValid || Boolean(busy) || websiteLinkSupported === false}
            onClick={() => execute('website', () => api.put(`${BASE}/website-link`, { url: websiteUrl.trim() }), 'Website link saved for future emails')}>Save URL</Button>
        </Stack>
      </Stack>
      {websiteLinkSupported !== false && !websiteUrlSaved && <Alert severity="info" sx={{ mt: 1 }}>Set and save the website URL to include View Booking / Review Booking buttons in new notifications.</Alert>}
    </Paper>}

    {tab === 1 && <Paper sx={panelSx}>
      {sectionHeader('Admin notification recipients', 'Choose exactly which extra email addresses receive manager notifications',
        <Button variant="contained" startIcon={<AddRounded />} disabled={recipients.length >= 30} onClick={() => { setRecipientDialog(-1); setRecipientForm({ email: '', name: '', enabled: true }); }}>Add email</Button>)}
      <Alert severity="info" sx={{ mb: 2 }}>The booking owner always receives a separate user email. Only checked recipients below (and assigned room managers) receive the administrative version, subject to Notification Rules.</Alert>
      <TableContainer><Table size="small"><TableHead><TableRow>
        <TableCell sx={{ fontWeight: 800, bgcolor: '#F7F9FC' }}>Email address</TableCell>
        <TableCell sx={{ fontWeight: 800, bgcolor: '#F7F9FC' }}>Name / Department</TableCell>
        <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#F7F9FC' }}>Receive mail</TableCell>
        <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#F7F9FC' }}>Action</TableCell>
      </TableRow></TableHead><TableBody>
        {recipients.length === 0 ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5, color: '#8190A0' }}>No additional admin recipients selected yet.</TableCell></TableRow> :
          recipients.map((r, idx) => <TableRow key={r.email} hover>
            <TableCell><Typography fontSize=".8rem" fontWeight={700}>{r.email}</Typography></TableCell>
            <TableCell><Typography fontSize=".76rem" color="text.secondary">{r.name || '—'}</Typography></TableCell>
            <TableCell align="center"><Switch size="small" checked={Boolean(r.enabled)} onChange={(_, v) => setRecipients(list => list.map((x, i) => i === idx ? { ...x, enabled: v } : x))} /></TableCell>
            <TableCell align="center"><Tooltip title="Edit"><IconButton size="small" onClick={() => { setRecipientDialog(idx); setRecipientForm({ ...r }); }}><EditOutlined fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Remove"><IconButton color="error" size="small" onClick={() => setRecipients(list => list.filter((_, i) => i !== idx))}><DeleteOutlineRounded fontSize="small" /></IconButton></Tooltip></TableCell>
          </TableRow>)}
      </TableBody></Table></TableContainer>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap" sx={{ mt: 2 }}>
        <Typography sx={muted}>{activeCount} of {recipients.length} selected · Maximum 30 emails</Typography>
        <Stack direction="row" gap={1}><Button variant="text" disabled={!recipientsDirty || Boolean(busy)} onClick={() => setRecipients(recipientSaved)}>Discard</Button>
          <Button startIcon={<SaveOutlined />} variant="contained" disabled={!recipientsDirty || Boolean(busy)} onClick={() => execute('recipients', () => api.put(`${BASE}/admin-recipients`, { recipients }), 'Recipient list saved')}>Save recipients</Button></Stack>
      </Stack>
    </Paper>}

    {tab === 2 && <Paper sx={panelSx}>
      {sectionHeader('Notification rules', 'Choose which booking events also notify selected Admin recipients')}
      <TableContainer><Table><TableHead><TableRow>
        <TableCell sx={{ fontWeight: 800, bgcolor: '#F7F9FC' }}>Booking event</TableCell>
        <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#F7F9FC' }}>User email</TableCell>
        <TableCell align="center" sx={{ fontWeight: 800, bgcolor: '#F7F9FC' }}>Admin email</TableCell>
      </TableRow></TableHead><TableBody>
        {EVENT_INFO.map(e => <TableRow key={e.id}>
          <TableCell><Typography fontWeight={700} fontSize=".8rem">{e.label}</Typography><Typography sx={muted}>{e.subtitle}</Typography></TableCell>
          <TableCell align="center"><Chip size="small" icon={<CheckCircleOutlineRounded />} color="success" variant="outlined" label="Always" /></TableCell>
          <TableCell align="center"><Switch checked={Boolean(rules[e.id])} onChange={(_, v) => setRules(prev => ({ ...prev, [e.id]: v }))} /></TableCell>
        </TableRow>)}
      </TableBody></Table></TableContainer>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
        <Typography sx={muted}>Admin emails use a different template; Outlook Accept is sent only to the booking owner upon approval.</Typography>
        <Button variant="contained" startIcon={<SaveOutlined />} disabled={!rulesDirty || Boolean(busy)} onClick={() => execute('rules', () => api.put(`${BASE}/notification-rules`, rules), 'Notification rules saved')}>Save rules</Button>
      </Stack>
    </Paper>}

    {tab === 3 && <Paper sx={panelSx}>
      {sectionHeader('Email template preview', 'Actual backend templates with sample booking data — changes require a source update')}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ mb: 2 }}>
        <TextField select label="Booking event" value={templateEvent} onChange={e => setTemplateEvent(e.target.value)} size="small" sx={{ minWidth: 275 }}>
          {EVENT_INFO.map(e => <MenuItem key={e.type} value={e.type}>{e.label}</MenuItem>)}
        </TextField>
        <Chip label="Preview data only — no messages sent" variant="outlined" sx={{ alignSelf: 'center' }} />
      </Stack>
      {websiteLinkSupported !== false && !websiteUrlSaved && <Alert severity="warning" sx={{ mb: 2 }}>Configure Website URL in SMTP Settings so new emails include the View Booking / Review Booking button.</Alert>}
      {previewBusy ? <Box py={5} textAlign="center"><CircularProgress size={28} /></Box> : template &&
        <Grid container spacing={2}>
          {[{ title: 'User notification', subject: template.userSubject, html: template.userHtml },
            { title: 'Admin notification', subject: template.adminSubject, html: template.adminHtml }].map((x, i) =>
            <Grid item xs={12} lg={6} key={x.title}>
              <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 1.5, borderBottom: '1px solid #E6EBF2', bgcolor: '#F8FAFD' }}>
                  <Chip size="small" label={x.title} color={i ? 'primary' : 'success'} sx={{ mb: 1 }} />
                  <Typography fontSize=".75rem" fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{x.subject}</Typography>
                </Box>
                <iframe title={x.title} srcDoc={x.html} sandbox="" style={{ width: '100%', minHeight: 570, border: 0, background: '#F1F5F9' }} />
              </Card>
            </Grid>)}
        </Grid>}
      <Alert severity="info" sx={{ mt: 2 }}>On APPROVED, the real User email also includes an iCalendar invitation. Outlook generates Accept / Tentative / Decline; these controls cannot be shown inside the HTML-only preview.</Alert>
    </Paper>}

    {tab === 4 && <Paper sx={panelSx}>
      {sectionHeader('Email delivery history', '100 most recent queued, delivered and failed emails',
        <Stack direction="row" gap={1}>
          <Button startIcon={<RefreshOutlined />} size="small" variant="outlined" disabled={Boolean(busy)} onClick={() => execute('reload', async () => {}, 'History refreshed')}>Refresh</Button>
          <Button startIcon={<OutboxOutlined />} size="small" variant="contained" disabled={!status?.enabled || Boolean(busy)} onClick={() => execute('process', () => api.post(`${BASE}/outbox/process`), 'Delivery worker processed queued messages')}>Process queue</Button>
        </Stack>)}
      <TableContainer sx={{ maxHeight: 620 }}><Table stickyHeader size="small"><TableHead><TableRow>
        {['Created at', 'Event', 'Recipient', 'Subject', 'Status', 'Attempts', 'Action'].map(h => <TableCell sx={{ fontWeight: 800, bgcolor: '#F7F9FC' }} key={h}>{h}</TableCell>)}
      </TableRow></TableHead><TableBody>
        {outbox.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: '#8190A0' }}>No delivery events yet.</TableCell></TableRow> :
          outbox.map(m => <TableRow key={m.id} hover>
            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '.72rem' }}>{m.createdAt ? m.createdAt.replace('T', ' ').slice(0, 16) : '—'}</TableCell>
            <TableCell><Chip size="small" label={m.eventType} variant="outlined" /></TableCell>
            <TableCell sx={{ fontSize: '.75rem' }}>{m.recipientEmail}</TableCell>
            <TableCell sx={{ minWidth: 190 }}><Tooltip title={m.subject || ''}><Typography fontSize=".73rem" noWrap sx={{ maxWidth: 265 }}>{m.subject}</Typography></Tooltip></TableCell>
            <TableCell><Tooltip title={m.lastError || ''}><Chip size="small" label={m.status} color={m.status === 'SENT' ? 'success' : m.status === 'FAILED' ? 'error' : m.status === 'RETRY' ? 'warning' : 'default'} /></Tooltip></TableCell>
            <TableCell align="center">{m.attempts}</TableCell>
            <TableCell>{m.status === 'FAILED' && <Button size="small" disabled={Boolean(busy)} onClick={() => execute('retry', () => api.post(`${BASE}/outbox/${m.id}/retry`), 'Email queued for retry')}>Retry</Button>}</TableCell>
          </TableRow>)}
      </TableBody></Table></TableContainer>
      <Typography sx={{ ...muted, mt: 1.5 }}>Email delivery status indicates SMTP acceptance, not confirmation the message reached the recipient's inbox.</Typography>
    </Paper>}

    <Dialog fullWidth maxWidth="sm" open={Boolean(senderEditor)} onClose={() => !busy && setSenderEditor(null)}>
      <DialogTitle sx={heading}>{senderEditor?.id ? 'Edit SMTP sender' : 'Add SMTP sender'}</DialogTitle>
      {senderEditor && <DialogContent dividers><Grid container spacing={2} sx={{ pt: .5 }}>
        <Grid item xs={12}><TextField fullWidth required label="Sender email (From)" type="email" value={senderEditor.email} onChange={e => setSenderEditor(s => ({ ...s, email: e.target.value }))} /></Grid>
        <Grid item xs={12}><TextField fullWidth required label="Display name" value={senderEditor.displayName} onChange={e => setSenderEditor(s => ({ ...s, displayName: e.target.value }))} /></Grid>
        <Grid item xs={12} sm={8}><TextField fullWidth required label="SMTP server" value={senderEditor.smtpHost} onChange={e => setSenderEditor(s => ({ ...s, smtpHost: e.target.value }))} /></Grid>
        <Grid item xs={12} sm={4}><TextField fullWidth required label="SMTP port" type="number" value={senderEditor.smtpPort} onChange={e => setSenderEditor(s => ({ ...s, smtpPort: e.target.value }))} /></Grid>
        <Grid item xs={12} sm={6}><TextField select fullWidth label="Encryption" value={senderEditor.smtpSecurity} onChange={e => setSenderEditor(s => ({ ...s, smtpSecurity: e.target.value }))}>
          <MenuItem value="STARTTLS">STARTTLS</MenuItem><MenuItem value="SSL_TLS">SSL/TLS</MenuItem>
        </TextField></Grid>
        <Grid item xs={12} sm={6}><Box sx={{ pl: 1, pt: .5 }}><FormControlLabel label="Enabled" control={<Switch checked={senderEditor.enabled} onChange={(_, v) => setSenderEditor(s => ({ ...s, enabled: v }))} />} /></Box></Grid>
        <Grid item xs={12}><TextField fullWidth required label="SMTP username" autoComplete="off" value={senderEditor.smtpUsername} onChange={e => setSenderEditor(s => ({ ...s, smtpUsername: e.target.value }))} /></Grid>
        <Grid item xs={12}><TextField fullWidth type="password" autoComplete="new-password" required={!senderEditor.id} label={senderEditor.id ? 'New password (leave blank to keep existing)' : 'SMTP password'}
          value={senderEditor.smtpPassword} onChange={e => setSenderEditor(s => ({ ...s, smtpPassword: e.target.value }))} /></Grid>
      </Grid><Alert severity="info" sx={{ mt: 2 }}>SMTP credentials are encrypted server-side; your password is never returned to the browser. TLS is required.</Alert></DialogContent>}
      <DialogActions sx={{ p: 2 }}><Button onClick={() => setSenderEditor(null)} disabled={Boolean(busy)}>Cancel</Button>
        <Button variant="contained" startIcon={<SaveOutlined />} disabled={Boolean(busy)} onClick={saveSender}>{busy === 'sender' ? 'Saving...' : 'Save sender'}</Button></DialogActions>
    </Dialog>

    <Dialog open={recipientDialog !== null} onClose={() => setRecipientDialog(null)} fullWidth maxWidth="xs">
      <DialogTitle sx={heading}>{recipientDialog === -1 ? 'Add admin email' : 'Edit admin email'}</DialogTitle>
      <DialogContent dividers><Stack gap={2} sx={{ pt: .5 }}>
        <TextField fullWidth autoFocus label="Email address" type="email" value={recipientForm.email} onChange={e => setRecipientForm(f => ({ ...f, email: e.target.value }))} />
        <TextField fullWidth label="Name / Department (optional)" value={recipientForm.name} onChange={e => setRecipientForm(f => ({ ...f, name: e.target.value }))} />
        <FormControlLabel label="Receive admin notifications" control={<Switch checked={recipientForm.enabled} onChange={(_, v) => setRecipientForm(f => ({ ...f, enabled: v }))} />} />
      </Stack></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setRecipientDialog(null)}>Cancel</Button>
        <Button variant="contained" onClick={saveRecipient}>Add to list</Button></DialogActions>
    </Dialog>

    <Dialog open={testDialog} onClose={() => setTestDialog(false)} fullWidth maxWidth="xs">
      <DialogTitle sx={heading}>Send SMTP test email</DialogTitle><DialogContent dividers><Stack gap={2} sx={{ pt: .5 }}>
        <TextField select label="Sender account" fullWidth value={testSender} onChange={e => setTestSender(e.target.value)}>
          {readySenders.map(s => <MenuItem key={s.id} value={s.id}>{s.email}</MenuItem>)}
        </TextField>
        <TextField label="Send test to" placeholder="phupt.st@youngonevn.com" fullWidth type="email" value={testRecipient} onChange={e => setTestRecipient(e.target.value)} />
      </Stack></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setTestDialog(false)}>Cancel</Button>
        <Button variant="contained" startIcon={<SendOutlined />} disabled={Boolean(busy) || !emailPattern.test(testRecipient.trim())} onClick={async () => {
          const ok = await execute('test', () => api.post(`${BASE}/test`, { senderId: testSender, recipientEmail: testRecipient.trim() }), 'Test email queued. Check Email History for delivery status.');
          if (ok) setTestDialog(false);
        }}>Queue test email</Button></DialogActions>
    </Dialog>
    <Snackbar open={Boolean(toast)} autoHideDuration={4500} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert onClose={() => setToast('')} severity="success" sx={{ width: '100%' }}>{toast}</Alert>
    </Snackbar>
  </Box>;
}
