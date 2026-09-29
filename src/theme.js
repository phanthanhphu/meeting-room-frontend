import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4680FF', dark: '#3F78FF', light: '#7EA6FF', contrastText: '#fff' },
    secondary: { main: '#5B6B79' },
    success: { main: '#2CA87F' },
    warning: { main: '#E58A00' },
    error: { main: '#DC2626' },
    info: { main: '#3EC9D6' },
    background: { default: '#F4F7FB', paper: '#FFFFFF' },
    text: { primary: '#172033', secondary: '#61758B' },
    divider: '#E6EDF4'
  },
  typography: {
    fontFamily: "'Inter var', Inter, ui-sans-serif, system-ui, sans-serif",
    h1: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.22 },
    h2: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.28 },
    h3: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.32 },
    h4: { fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.38 },
    h5: { fontWeight: 700, fontSize: '1rem', lineHeight: 1.45 },
    h6: { fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.5 },
    body1: { fontSize: '0.8125rem', lineHeight: 1.52 },
    body2: { fontSize: '0.75rem', lineHeight: 1.5 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 650, lineHeight: 1.45 },
    subtitle2: { fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 },
    button: { fontSize: '0.75rem', fontWeight: 650, textTransform: 'none' }
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 8, boxShadow: 'none' } }
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTableCell: {
      styleOverrides: {
        head: { backgroundColor: '#F7F9FC', color: '#40566E', fontWeight: 750, fontSize: '0.72rem', borderColor: '#E7EDF4' },
        body: { color: '#2D4358', fontSize: '0.75rem', borderColor: '#EEF2F6' }
      }
    }
  }
});

export default theme;
