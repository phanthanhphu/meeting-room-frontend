import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import './index.css';

// NATF favicon: apply the centered calendar icon without replacing index.html.
// BASE_URL keeps the asset path correct if Vite is deployed under a subpath.
const faviconHref = `${import.meta.env.BASE_URL}meeting-room-favicon-centered.png?v=4`;
let faviconLink = document.querySelector('link[rel~="icon"]');
if (!faviconLink) {
  faviconLink = document.createElement('link');
  faviconLink.rel = 'icon';
  document.head.appendChild(faviconLink);
}
faviconLink.type = 'image/png';
faviconLink.setAttribute('sizes', '64x64');
faviconLink.href = faviconHref;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppDataProvider><App /></AppDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
