import { Paper } from '@mui/material';

export default function MainCard({ children, sx = {}, content = true }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid #E3EAF2',
        borderRadius: 2.25,
        bgcolor: '#FFFFFF',
        overflow: 'hidden',
        boxShadow: '0 4px 18px rgba(22, 56, 93, 0.035)',
        ...(content ? { p: 1.5 } : {}),
        ...sx
      }}
    >
      {children}
    </Paper>
  );
}
