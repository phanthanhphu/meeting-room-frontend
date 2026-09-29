import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const frontendPort = Number(env.VITE_FRONTEND_PORT);

  if (!Number.isInteger(frontendPort) || frontendPort < 1 || frontendPort > 65535) {
    throw new Error(`Invalid or missing VITE_FRONTEND_PORT in .env: ${env.VITE_FRONTEND_PORT ?? ''}`);
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: frontendPort,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: frontendPort,
      strictPort: true,
    },
  };
});
