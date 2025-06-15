import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: false, // Allow fallback to other ports if 3000 is busy
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});