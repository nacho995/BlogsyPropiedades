import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tdz from './public/vite-plugin-tdz-fix'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tdz(), // TDZ fix debe ser el primer plugin
    react()
  ],
  define: {
    global: {}, // Esto crea un objeto vacío para 'global'
  },
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-image'
    ],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console.logs para diagnóstico
      },
    },
    sourcemap: true,
    // Inyectar código específico para evitar TDZ
    rollupOptions: {
      output: {
        banner: '/* TDZ fix banner - init global vars */\n' +
               'window.y = window.y || {};\n' +
               'window.b = window.b || {};\n' +
               'window.wi = window.wi || {};\n' +
               'window.Fp = window.Fp || {};',
      }
    }
  },
  base: '/',
  server: {
    port: 5173,
    host: true,
    cors: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  }
})
