import { STATUS_CHIP_COLORS } from '../constants/statuses.js';
import { Chip } from '@mui/material';


export default function StatusChip({ value }) {
  const key = String(value || '').toUpperCase();
  const style = STATUS_CHIP_COLORS[key] || STATUS_CHIP_COLORS.CANCELLED;
  return <Chip label={key || '-'} size="small" sx={{ height: 24, fontSize: '0.68rem', fontWeight: 750, color: style.color, bgcolor: style.bg, border: `1px solid ${style.border}` }} />;
}
