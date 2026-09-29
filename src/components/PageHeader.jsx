import { Box, Stack, Typography } from '@mui/material';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ mb: 1.1 }}>
      <Box>
        <Typography sx={{ color: '#173B63', fontSize: '1.05rem', fontWeight: 800 }}>{title}</Typography>
        {subtitle ? <Typography sx={{ mt: 0.15, color: '#71849A', fontSize: '0.74rem', fontWeight: 600 }}>{subtitle}</Typography> : null}
      </Box>
      {actions ? <Box>{actions}</Box> : null}
    </Stack>
  );
}
