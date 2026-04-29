import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/app/',
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/app/api': { target: 'http://localhost:3001', rewrite: p => p.replace(/^\/app/, '') }
    }
  }
});
