import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5500, // Match your port
    strictPort: true,
    headers: {
      'Content-Type': 'text/css' // For CSS files
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  base: './' 
});