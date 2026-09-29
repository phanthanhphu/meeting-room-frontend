import { Box, InputAdornment, TextField } from '@mui/material';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

export default function SearchBar({ placeholder = 'Search...', width = 280 }) {
  return (
    <Box sx={{ width: { xs: '100%', sm: width } }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18, color: '#71849A' }} /></InputAdornment> }}
        sx={{ '& .MuiOutlinedInput-root': { height: 36, borderRadius: 1.5, bgcolor: '#FFFFFF', '& fieldset': { borderColor: '#DCE5EE' } } }}
      />
    </Box>
  );
}
