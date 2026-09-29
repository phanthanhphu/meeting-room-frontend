import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import LoginRounded from '@mui/icons-material/LoginRounded';
import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import backgroundLogin from '../assets/images/background/background_login.png';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loginType, setLoginType] = useState('DOMAIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError(loginType === 'DOMAIN'
        ? 'Please enter your Domain email/account and Windows password.'
        : 'Please enter your system username/email and password.');
      return;
    }
    setSubmitting(true);
    const result = await login(identifier.trim(), password, loginType);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate(location.state?.from || '/dashboard', { replace: true });
  };

  const selectType = (type) => {
    setLoginType(type);
    setPassword('');
    setError('');
  };

  return (
    <Box sx={{
      minHeight: '100vh', position: 'relative', display: 'grid', placeItems: 'center', overflow: 'auto', p: { xs: 2, md: 3.5 },
      bgcolor: '#EAF2F8',
      backgroundImage: `linear-gradient(100deg,rgba(238,246,252,.78) 0%,rgba(232,243,251,.64) 48%,rgba(222,239,250,.72) 100%),url(${backgroundLogin})`,
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed'
    }}>
      <Box sx={{
        width: 'min(980px, calc(100vw - 32px))', minHeight: { md: 560 }, overflow: 'hidden', borderRadius: '26px',
        display: 'grid', gridTemplateColumns: { xs: '1fr', md: '44% 56%' },
        boxShadow: '0 28px 80px rgba(20,64,102,.22)', border: `1px solid ${alpha('#FFFFFF', .72)}`,
        bgcolor: alpha('#FFFFFF', .86), backdropFilter: 'blur(14px)'
      }}>
        <Box sx={{
          display: { xs: 'none', md: 'flex' }, position: 'relative', overflow: 'hidden', p: 5.5,
          background: 'linear-gradient(145deg,rgba(16,77,145,.96) 0%,rgba(18,85,165,.92) 55%,rgba(35,116,190,.88) 100%)',
          color: '#fff'
        }}>
          <Box sx={{ position: 'absolute', width: 300, height: 300, top: -130, right: -120, borderRadius: '50%', bgcolor: alpha('#FFFFFF', .08) }} />
          <Box sx={{ position: 'absolute', width: 220, height: 220, bottom: -110, left: -80, borderRadius: '50%', bgcolor: alpha('#8ED7FF', .12) }} />
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
            <Box>
              <Box sx={{ width: 54, height: 54, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: alpha('#FFFFFF', .14), border: `1px solid ${alpha('#FFFFFF', .22)}`, mb: 3 }}>
                <MeetingRoomOutlined sx={{ fontSize: 30 }} />
              </Box>
              <Typography sx={{ fontSize: '2.3rem', lineHeight: 1.04, letterSpacing: -1.1, fontWeight: 800 }}>Meeting Room</Typography>
              <Typography sx={{ mt: .35, fontSize: '1.55rem', lineHeight: 1.15, letterSpacing: -.45, fontWeight: 500, color: alpha('#FFFFFF', .92) }}>Booking System</Typography>
              <Typography sx={{ mt: 2.2, maxWidth: 315, fontSize: '.93rem', lineHeight: 1.7, color: alpha('#FFFFFF', .78) }}>Book rooms, manage schedules and collaborate efficiently in one internal workspace.</Typography>

              <Stack spacing={1.15} sx={{ mt: 3.5 }}>
                <Stack direction="row" spacing={1.1} alignItems="center"><EventAvailableOutlined sx={{ fontSize: 19, color: '#BFE7FF' }} /><Typography sx={{ fontSize: '.79rem', color: alpha('#FFFFFF', .88) }}>Simple room reservation</Typography></Stack>
                <Stack direction="row" spacing={1.1} alignItems="center"><GroupsOutlined sx={{ fontSize: 19, color: '#BFE7FF' }} /><Typography sx={{ fontSize: '.79rem', color: alpha('#FFFFFF', .88) }}>Clear approval workflow</Typography></Stack>
              </Stack>
            </Box>
            <Typography sx={{ fontSize: '.72rem', letterSpacing: .35, color: alpha('#FFFFFF', .56) }}>INTERNAL ROOM MANAGEMENT</Typography>
          </Box>
        </Box>

        <Box sx={{ minHeight: { xs: 590, md: 560 }, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 3, sm: 5.5, md: 6 }, py: 4.5, bgcolor: alpha('#FFFFFF', .96) }}>
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.08, letterSpacing: -.8, color: '#143B63' }}>Welcome back</Typography>
            <Typography sx={{ mt: .8, fontSize: '.91rem', color: '#6C8096' }}>Sign in to Meeting Room Booking System</Typography>

            <Box component="form" onSubmit={submit} noValidate sx={{ mt: 3 }}>
              <Stack spacing={1.8}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Button
                    type="button"
                    variant={loginType === 'DOMAIN' ? 'contained' : 'outlined'}
                    startIcon={<BusinessOutlined />}
                    onClick={() => selectType('DOMAIN')}
                    sx={{ minHeight: 48, borderRadius: 2.2, textTransform: 'none', justifyContent: 'flex-start', fontWeight: 800 }}
                  >Domain Account</Button>
                  <Button
                    type="button"
                    variant={loginType === 'SYSTEM' ? 'contained' : 'outlined'}
                    startIcon={<AdminPanelSettingsOutlined />}
                    onClick={() => selectType('SYSTEM')}
                    sx={{ minHeight: 48, borderRadius: 2.2, textTransform: 'none', justifyContent: 'flex-start', fontWeight: 800, color: loginType === 'SYSTEM' ? undefined : '#526B83' }}
                  >System Account</Button>
                </Box>

                <Typography sx={{ fontSize: '.73rem', color: '#71849A', mt: -.5 }}>
                  {loginType === 'DOMAIN'
                    ? 'Use your Windows/Domain account. If you enter nguyenvana.st, the system treats it as nguyenvana.st@youngonevn.com after successful authentication.'
                    : 'Use the local system account created by an administrator.'}
                </Typography>

                <TextField
                  label={loginType === 'DOMAIN' ? 'Domain email / account' : 'System username or email'}
                  placeholder={loginType === 'DOMAIN' ? 'nguyenvana.st or nguyenvana.st@youngonevn.com' : 'admin@youngonevn.com'}
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }} fullWidth autoComplete="username"
                  InputLabelProps={{ sx: { fontWeight: 700, color: '#526B83' } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: alpha('#1255A5', .62), fontSize: 20 }} /></InputAdornment> }}
                  sx={{ '& .MuiOutlinedInput-root': { height: 52, borderRadius: 2.3, bgcolor: '#fff', '& fieldset': { borderColor: '#D7E2EC' }, '&:hover fieldset': { borderColor: '#9CB8D4' }, '&.Mui-focused fieldset': { borderColor: '#1255A5', borderWidth: 1.5 } } }}
                />
                <TextField
                  label={loginType === 'DOMAIN' ? 'Windows / Domain password' : 'System password'}
                  placeholder="Enter your password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }} type={showPw ? 'text' : 'password'} fullWidth autoComplete="current-password"
                  InputLabelProps={{ sx: { fontWeight: 700, color: '#526B83' } }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: alpha('#1255A5', .62), fontSize: 20 }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton aria-label="Show password" onClick={() => setShowPw((v) => !v)} edge="end">{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                  }}
                  error={Boolean(error)} helperText={error}
                  sx={{ '& .MuiOutlinedInput-root': { height: 52, borderRadius: 2.3, bgcolor: '#fff', '& fieldset': { borderColor: '#D7E2EC' }, '&:hover fieldset': { borderColor: '#9CB8D4' }, '&.Mui-focused fieldset': { borderColor: '#1255A5', borderWidth: 1.5 } } }}
                />
                <Button
                  type="submit" disabled={submitting} variant="contained" startIcon={<LoginRounded />}
                  sx={{ height: 52, mt: .2, borderRadius: 2.3, fontWeight: 800, fontSize: '.96rem', textTransform: 'none', bgcolor: '#1255A5', boxShadow: '0 12px 26px rgba(18,85,165,.24)', '&:hover': { bgcolor: '#0D478D', boxShadow: '0 14px 30px rgba(18,85,165,.3)' } }}
                >{submitting ? 'Signing in...' : (loginType === 'DOMAIN' ? 'Sign in with Domain' : 'Sign in with System Account')}</Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 2.6, pt: 2, borderTop: '1px solid #E8EEF5' }}>
              <Typography sx={{ fontSize: '.72rem', color: '#91A0AF', textAlign: 'center' }}>For authorized Youngone users only</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
