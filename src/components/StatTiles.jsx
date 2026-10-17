import { Box, Paper, Typography } from '@mui/material';

/** The same four-column metric layout across all administration pages. */
export default function StatTiles({ items = [], sx = {} }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, alignItems: 'stretch', gap: 1.25, mb: 1.75, ...sx }}>
    {items.map(({ label, value, count, icon: Icon, color = '#3275CC', bg = '#EFF6FF' }) => (
      <Paper key={label} elevation={0} sx={{ p: { xs: 1.2, md: 1.4 }, border: '1px solid #E3EAF3', borderRadius: 2.2, boxShadow: '0 3px 12px rgba(29,58,91,.035)', display: 'flex', alignItems: 'center', gap: { xs: .85, sm: 1.1 }, minWidth: 0, minHeight: 82, height: '100%' }}>
        {Icon && <Box sx={{ display: 'grid', placeItems: 'center', flexShrink: 0, width: { xs: 34, sm: 39 }, height: { xs: 34, sm: 39 }, borderRadius: 2, bgcolor: bg, color }}><Icon sx={{ fontSize: { xs: 19, sm: 21 } }} /></Box>}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap title={String(value ?? count ?? 0)} sx={{ fontSize: { xs: '1.13rem', sm: '1.35rem' }, lineHeight: 1.16, fontWeight: 800, color: '#18385D', fontVariantNumeric: 'tabular-nums' }}>{value ?? count ?? 0}</Typography>
          <Typography sx={{ mt: .35, fontSize: { xs: '.66rem', sm: '.72rem' }, lineHeight: 1.35, fontWeight: 650, color: '#71849A', overflowWrap: 'anywhere' }}>{label}</Typography>
        </Box>
      </Paper>
    ))}
  </Box>;
}
