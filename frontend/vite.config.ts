import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const rawTarget = env.VITE_API_URL || 'http://127.0.0.1:8080';
  const proxyTarget = rawTarget.replace(/\/+$/, '').replace(/\/api$/, '') || 'http://127.0.0.1:8080';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/oauth2': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.url && req.url.startsWith('/oauth2/redirect')) {
              return '/index.html';
            }
          },
        },
        '/login': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.url === '/login' || req.url === '/login/') {
              return '/index.html';
            }
          },
        },
      },
    },
  };
});
