// Runtime network helper.
// All deploy-specific values live in the root .env file.
const requiredEnv = (name) => {
  const value = import.meta.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const toPort = (name) => {
  const value = Number(requiredEnv(name));
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Invalid port in ${name}: ${import.meta.env[name]}`);
  }
  return value;
};

export const NETWORK_CONFIG = Object.freeze({
  serverIp: requiredEnv('VITE_SERVER_IP'),
  frontendPort: toPort('VITE_FRONTEND_PORT'),
  backendPort: toPort('VITE_BACKEND_PORT'),
  protocol: requiredEnv('VITE_PROTOCOL'),
});

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function resolveBackendHost(browserHostname) {
  return LOCAL_HOSTS.has(browserHostname) ? 'localhost' : NETWORK_CONFIG.serverIp;
}

export function getRuntimeNetwork(
  browserHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
) {
  const backendHost = resolveBackendHost(browserHostname);
  const apiBaseUrl = `${NETWORK_CONFIG.protocol}://${backendHost}:${NETWORK_CONFIG.backendPort}`;
  const wsProtocol = NETWORK_CONFIG.protocol === 'https' ? 'wss' : 'ws';

  return Object.freeze({
    backendHost,
    apiBaseUrl,
    apiUrl: `${apiBaseUrl}/api`,
    appEventWsUrl: `${wsProtocol}://${backendHost}:${NETWORK_CONFIG.backendPort}/ws/app-events`,
  });
}

export const RUNTIME_NETWORK = getRuntimeNetwork();
