import { Box, Stack } from '@mui/material';

/** Input/filter controls are left aligned; all actions form a right aligned group. */
export default function FilterToolbar({ children, actions, summary, sx = {} }) {
  return <Box sx={{ minWidth: 0, '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': { minHeight: 38 }, ...sx }}>
    <Stack direction={{ xs: 'column', lg: 'row' }} alignItems={{ xs: 'stretch', lg: 'flex-start' }} gap={1.1}>
      <Stack direction="row" useFlexGap flexWrap="wrap" alignItems="center" gap={.9}
        sx={{ flex: '1 1 0%', minWidth: 0, '& > .MuiFormControl-root': { flex: { xs: '1 1 100%', sm: '1 1 155px' }, minWidth: 0, maxWidth: { md: 235 } }, '& .MuiInputBase-root': { width: '100%' } }}>
        {children}
      </Stack>
      {actions && <Stack direction="row" useFlexGap flexWrap="wrap" gap={.8} alignItems="center" justifyContent="flex-end"
        sx={{ ml: 'auto', flex: '0 0 auto', minHeight: 38, '& .MuiButton-root': { whiteSpace: 'nowrap', minHeight: 38 }, '& .MuiIconButton-root': { width: 36, height: 36 } }}>
        {actions}
      </Stack>}
    </Stack>
    {summary && <Box sx={{ mt: .9 }}>{summary}</Box>}
  </Box>;
}
