import { EQUIPMENT_STATUS } from '../constants/statuses.js';
import { useId, useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Tooltip, Typography } from '@mui/material';
import TvOutlined from '@mui/icons-material/TvOutlined';
import VideocamOutlined from '@mui/icons-material/VideocamOutlined';
import SpeakerOutlined from '@mui/icons-material/SpeakerOutlined';
import PresentToAllOutlined from '@mui/icons-material/PresentToAllOutlined';
import CableOutlined from '@mui/icons-material/CableOutlined';
import DevicesOtherOutlined from '@mui/icons-material/DevicesOtherOutlined';
import MicNoneOutlined from '@mui/icons-material/MicNoneOutlined';
import CastOutlined from '@mui/icons-material/CastOutlined';
import WifiOutlined from '@mui/icons-material/WifiOutlined';
import DrawOutlined from '@mui/icons-material/DrawOutlined';

export { EQUIPMENT_CATEGORIES } from '../constants/equipment.js';

export function equipmentIcon(name = '', category = '') {
  const normalized = String(name).toLowerCase();
  if (/projector|beam/.test(normalized)) return CastOutlined;
  if (/microphone|\bmic\b/.test(normalized)) return MicNoneOutlined;
  if (/whiteboard|blackboard|flipchart|board/.test(normalized)) return DrawOutlined;
  if (/wi.?fi|wireless/.test(normalized)) return WifiOutlined;
  if (/\btv\b|display|monitor|screen/.test(normalized)) return TvOutlined;
  if (/camera|webcam|video/.test(normalized)) return VideocamOutlined;
  if (/speaker|audio|sound/.test(normalized)) return SpeakerOutlined;
  if (/hdmi|cable|usb|adapter/.test(normalized)) return CableOutlined;
  return ({ DISPLAY: TvOutlined, VIDEO: VideocamOutlined, AUDIO: SpeakerOutlined, PRESENTATION: PresentToAllOutlined, CONNECTIVITY: CableOutlined }[category] || DevicesOtherOutlined);
}

export function EquipmentIcon({ item, size = 19, color = '#2563EB' }) {
  const Icon = equipmentIcon(item?.name, item?.category);
  return <Icon sx={{ fontSize: size, color }} />;
}

// Shared equipment preview used by Meeting Rooms, Room Management and Booking Dialog.
// A compact list opens a read-only modal when some devices are hidden by `limit`.
export function EquipmentPills({ ids = [], equipment = [], limit = 3, emptyLabel = 'No equipment assigned', small = false, roomName = '' }) {
  const [showAll, setShowAll] = useState(false);
  const dialogTitleId = useId();
  const found = (ids || []).map((id) => equipment.find((item) => item.id === id)).filter(Boolean);
  if (!found.length) return <Typography sx={{ fontSize: '.74rem', color: '#94A3B8' }}>{emptyLabel}</Typography>;

  const visible = limit ? found.slice(0, limit) : found;
  const hiddenCount = found.length - visible.length;

  return <>
    <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.65} alignItems="center">
      {visible.map((item) => <Tooltip key={item.id} title={`${item.name}${item.status === EQUIPMENT_STATUS.MAINTENANCE ? ' · Under maintenance' : ''}`}>
        <Chip icon={<EquipmentIcon item={item} size={small ? 15 : 16} color={item.status === EQUIPMENT_STATUS.MAINTENANCE ? '#B45309' : '#3B70BC'} />}
          label={item.name} size="small" variant="outlined"
          sx={{ height: small ? 25 : 29, maxWidth: small ? 140 : 210, borderRadius: 1.6, fontSize: small ? '.66rem' : '.72rem', fontWeight: 650, bgcolor: item.status === EQUIPMENT_STATUS.MAINTENANCE ? '#FFFBEB' : '#F8FAFF', borderColor: item.status === EQUIPMENT_STATUS.MAINTENANCE ? '#FDE68A' : '#E2EAF5', color: '#415775', '& .MuiChip-icon': { ml: 0.75 }, '& .MuiChip-label': { textOverflow: 'ellipsis', overflow: 'hidden' } }} />
      </Tooltip>)}
      {hiddenCount > 0 && <Button
        size="small"
        variant="text"
        aria-label={`Show all ${found.length} equipment items${roomName ? ` in ${roomName}` : ''}`}
        onClick={() => setShowAll(true)}
        sx={{ minWidth: 0, px: 0.45, py: 0.1, fontSize: small ? '.72rem' : '.76rem', fontWeight: 750, textTransform: 'none', lineHeight: 1.6, color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
      >+{hiddenCount} more</Button>}
    </Stack>
    {hiddenCount > 0 && <Dialog
      open={showAll}
      onClose={() => setShowAll(false)}
      aria-labelledby={dialogTitleId}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle id={dialogTitleId} sx={{ pb: 1, color: '#17345A', fontWeight: 800 }}>
        {roomName ? `Equipment in ${roomName}` : 'All equipment'}
        <Typography sx={{ mt: 0.5, fontSize: '.78rem', color: '#7185A0' }}>
          {found.length} equipment item{found.length !== 1 ? 's' : ''} assigned to this room
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        <Stack spacing={1}>
          {found.map((item) => <Stack
            key={item.id}
            direction="row"
            spacing={1.3}
            alignItems="center"
            sx={{ px: 1.5, py: 1.2, borderRadius: 2, border: '1px solid #E2EAF5', bgcolor: '#F8FAFF' }}
          >
            <EquipmentIcon item={item} size={22} color={item.status === EQUIPMENT_STATUS.MAINTENANCE ? '#B45309' : '#3275CC'} />
            <Typography sx={{ flex: 1, minWidth: 0, fontSize: '.85rem', fontWeight: 650, color: '#314B6B', overflowWrap: 'anywhere' }}>
              {item.name}
            </Typography>
            {item.status === EQUIPMENT_STATUS.MAINTENANCE && <Chip size="small" label="Under maintenance" sx={{ bgcolor: '#FFFBEB', color: '#B45309', fontSize: '.67rem' }} />}
            {item.status === 'INACTIVE' && <Chip size="small" label="Inactive" sx={{ fontSize: '.67rem' }} />}
          </Stack>)}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={() => setShowAll(false)} variant="contained" sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>}
  </>;
}
