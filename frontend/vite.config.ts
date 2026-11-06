import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        bypass: (req) => {
          if (req.url && req.url.startsWith('/oauth2/redirect')) {
            return '/index.html';
          }
        },
      },
      '/login': {
        target: 'http://127.0.0.1:8080',
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
});
