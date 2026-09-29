import { Chip } from '@mui/material';

const MAP = {
  APPROVED: { color: '#107D4F', bg: '#EAF8F2', border: '#BFE8D7' },
  PENDING: { color: '#B56B00', bg: '#FFF7E8', border: '#F4D7A3' },
  REJECTED: { color: '#B42318', bg: '#FFF1F0', border: '#F5C5C0' },
  CANCELLED: { color: '#61758B', bg: '#F3F6F8', border: '#DDE5EC' },
  ACTIVE: { color: '#107D4F', bg: '#EAF8F2', border: '#BFE8D7' },
  MAINTENANCE: { color: '#B56B00', bg: '#FFF7E8', border: '#F4D7A3' },
  DISABLED: { color: '#61758B', bg: '#F3F6F8', border: '#DDE5EC' }
};

export default function StatusChip({ value }) {
  const key = String(value || '').toUpperCase();
  const style = MAP[key] || MAP.CANCELLED;
  return <Chip label={key || '-'} size="small" sx={{ height: 24, fontSize: '0.68rem', fontWeight: 750, color: style.color, bgcolor: style.bg, border: `1px solid ${style.border}` }} />;
}
