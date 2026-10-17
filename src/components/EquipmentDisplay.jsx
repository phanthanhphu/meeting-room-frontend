import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
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

export const EQUIPMENT_CATEGORIES = [
  { value: 'DISPLAY', label: 'Displays & projectors' },
  { value: 'VIDEO', label: 'Video conferencing' },
  { value: 'AUDIO', label: 'Audio equipment' },
  { value: 'PRESENTATION', label: 'Presentation tools' },
  { value: 'CONNECTIVITY', label: 'Connectivity' },
  { value: 'OTHER', label: 'Other equipment' }
];

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

export function EquipmentPills({ ids = [], equipment = [], limit = 3, emptyLabel = 'No equipment assigned', small = false }) {
  const found = ids.map((id) => equipment.find((item) => item.id === id)).filter(Boolean);
  if (!found.length) return <Typography sx={{ fontSize: '.74rem', color: '#94A3B8' }}>{emptyLabel}</Typography>;
  const visible = limit ? found.slice(0, limit) : found;
  return <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.65} alignItems="center">
    {visible.map((item) => <Tooltip key={item.id} title={`${item.name}${item.status === 'MAINTENANCE' ? ' · Under maintenance' : ''}`}>
      <Chip icon={<EquipmentIcon item={item} size={small ? 15 : 16} color={item.status === 'MAINTENANCE' ? '#B45309' : '#3B70BC'} />}
        label={item.name} size="small" variant="outlined"
        sx={{ height: small ? 25 : 29, maxWidth: small ? 140 : 210, borderRadius: 1.6, fontSize: small ? '.66rem' : '.72rem', fontWeight: 650, bgcolor: item.status === 'MAINTENANCE' ? '#FFFBEB' : '#F8FAFF', borderColor: item.status === 'MAINTENANCE' ? '#FDE68A' : '#E2EAF5', color: '#415775', '& .MuiChip-icon': { ml: 0.75 }, '& .MuiChip-label': { textOverflow: 'ellipsis', overflow: 'hidden' } }} />
    </Tooltip>)}
    {found.length > visible.length && <Tooltip title={found.slice(visible.length).map((item) => item.name).join(', ')}><Box component="span" sx={{ color: '#64748B', fontSize: '.72rem', fontWeight: 700 }}>+{found.length - visible.length} more</Box></Tooltip>}
  </Stack>;
}
