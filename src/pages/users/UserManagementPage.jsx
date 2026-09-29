import { useMemo, useState } from 'react';
import { Box, Button, Chip, IconButton, Stack, Tab, Tabs, Tooltip } from '@mui/material';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import LockResetOutlined from '@mui/icons-material/LockResetOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import ToggleOnOutlined from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlined from '@mui/icons-material/ToggleOffOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import DomainVerificationOutlined from '@mui/icons-material/DomainVerificationOutlined';
import MainCard from '../../components/MainCard';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import AddUserDialog from './AddUserDialog';
import EditUserDialog from './EditUserDialog';
import ResetPasswordDialog from './ResetPasswordDialog';

export default function UserManagementPage() {
  const { user: sessionUser, isAdmin } = useAuth();
  const { users, addUser, updateUser, deleteUser, toggleUser, resetUserPassword } = useAppData();
  const [sourceTab, setSourceTab] = useState('SYSTEM');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isSelf = (row) => row.id === sessionUser?.id;
  const systemUsers = useMemo(() => users.filter((row) => (row.accountSource || 'SYSTEM') === 'SYSTEM'), [users]);
  const domainUsers = useMemo(() => users.filter((row) => row.accountSource === 'DOMAIN'), [users]);
  const visibleUsers = sourceTab === 'DOMAIN' ? domainUsers : systemUsers;

  if (!isAdmin) return null;

  const columns = [
    { key: 'username', label: sourceTab === 'DOMAIN' ? 'Domain ID' : 'User ID' },
    { key: 'domainAccount', label: 'Domain Account', render: (r) => r.domainAccount || '—' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department', render: (r) => r.department || '—' },
    { key: 'role', label: 'Role', render: (r) => {
      const tone = {
        ADMIN: { color: '#5B21B6', bgcolor: '#F3EEFF' },
        ROOM_MANAGER: { color: '#8A4B08', bgcolor: '#FFF5E6' },
        VIEWER: { color: '#536A80', bgcolor: '#F2F5F7' },
        USER: { color: '#315E9B', bgcolor: '#EEF4FF' }
      }[r.role] || { color: '#315E9B', bgcolor: '#EEF4FF' };
      return <Chip label={r.role} size="small" sx={{ height: 23, fontSize: '.65rem', fontWeight: 750, ...tone }} />;
    } },
    { key: 'active', label: 'Status', render: (r) => <Chip label={r.active ? 'Active' : 'Disabled'} size="small" sx={{ height: 23, fontSize: '.65rem', fontWeight: 750, color: r.active ? '#107D4F' : '#61758B', bgcolor: r.active ? '#EAF8F2' : '#F3F6F8' }} /> },
    {
      key: 'actions', label: 'Actions', align: 'right', sortable: false,
      render: (r) => <Stack direction="row" justifyContent="flex-end">
        <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditTarget(r)}><EditOutlined sx={{ fontSize: 17 }} /></IconButton></Tooltip>
        {sourceTab === 'SYSTEM' && <Tooltip title="Reset System Password"><IconButton size="small" onClick={() => setResetTarget(r)}><LockResetOutlined sx={{ fontSize: 18 }} /></IconButton></Tooltip>}
        <Tooltip title={isSelf(r) ? 'Cannot disable your own account' : (r.active ? 'Disable' : 'Enable')}><span><IconButton disabled={isSelf(r)} size="small" color={r.active ? 'warning' : 'success'} onClick={async () => { await toggleUser(r.id); }}>{r.active ? <ToggleOnOutlined sx={{ fontSize: 19 }} /> : <ToggleOffOutlined sx={{ fontSize: 19 }} />}</IconButton></span></Tooltip>
        <Tooltip title={isSelf(r) ? 'Cannot delete your own account' : 'Delete'}><span><IconButton disabled={isSelf(r)} size="small" color="error" onClick={() => setDeleteTarget(r)}><DeleteOutlineOutlined sx={{ fontSize: 17 }} /></IconButton></span></Tooltip>
      </Stack>
    }
  ];

  return <Box sx={{ p: .55 }}>
    <PageHeader
      title="User Management"
      subtitle="System accounts created by Admin and Domain accounts created automatically after the first successful AD login"
      actions={sourceTab === 'SYSTEM' ? <Button size="small" variant="contained" startIcon={<PersonAddAltOutlined />} onClick={() => setAddOpen(true)}>Add System User</Button> : null}
    />

    <MainCard content={false}>
      <Box sx={{ px: 1.5, pt: 1.2, borderBottom: '1px solid #E5ECF3' }}>
        <Tabs value={sourceTab} onChange={(_, value) => setSourceTab(value)} sx={{ minHeight: 44 }}>
          <Tab value="SYSTEM" icon={<BadgeOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`System Accounts (${systemUsers.length})`} sx={{ minHeight: 44, textTransform: 'none', fontWeight: 750 }} />
          <Tab value="DOMAIN" icon={<DomainVerificationOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`Domain Accounts (${domainUsers.length})`} sx={{ minHeight: 44, textTransform: 'none', fontWeight: 750 }} />
        </Tabs>
      </Box>

      <DataTable
        rows={visibleUsers}
        searchFields={[
          { key: 'username', label: sourceTab === 'DOMAIN' ? 'Domain ID' : 'User ID' },
          { key: 'domainAccount', label: 'Domain Account' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' }
        ]}
        filters={[
          { key: 'role', label: 'Role', options: ['USER', 'VIEWER', 'ROOM_MANAGER', 'ADMIN'] },
          { key: 'department', label: 'Department', options: [...new Set(visibleUsers.map((r) => r.department).filter(Boolean))] }
        ]}
        columns={columns}
      />
    </MainCard>

    <AddUserDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={addUser} />
    <EditUserDialog open={Boolean(editTarget)} user={editTarget} onClose={() => setEditTarget(null)} onSave={updateUser} />
    <ResetPasswordDialog open={Boolean(resetTarget)} user={resetTarget} onClose={() => setResetTarget(null)} onReset={resetUserPassword} />
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete User" message={deleteTarget ? `Delete ${deleteTarget.name}?` : ''} confirmText="Delete" onClose={() => setDeleteTarget(null)} onConfirm={async () => { if (await deleteUser(deleteTarget.id)) setDeleteTarget(null); }} />
  </Box>;
}
