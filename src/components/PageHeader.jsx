import { Box, Stack, Typography } from '@mui/material';

/** Reusable unobtrusive page heading. Main content always shares its left edge. */
export default function PageHeader({ title, subtitle, actions, action }) {
  const right = actions ?? action;
  return <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" gap={{ xs: 1, md: 1.8 }}
    sx={{ mb: 1.65, pb: 1.35, borderBottom: '1px solid #E4EBF3', minWidth: 0 }}>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography component="h1" sx={{ color: '#173B63', fontSize: { xs: '1.22rem', sm: '1.42rem' }, letterSpacing: -.4, fontWeight: 800, lineHeight: 1.3 }}>{title}</Typography>
      {subtitle && <Typography sx={{ mt: .4, color: '#71849A', fontSize: '.78rem', lineHeight: 1.45 }}>{subtitle}</Typography>}
    </Box>
    {right && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, '& .MuiButton-root': { whiteSpace: 'nowrap' } }}>{right}</Box>}
  </Stack>;
}
