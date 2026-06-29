import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Planix uses a dedicated port (5180) to avoid colliding with other local
    // apps on Vite's default 5173. strictPort makes a conflict fail loudly
    // instead of silently drifting to another port.
    port: 5180,
    strictPort: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
