import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from '@rollup/plugin-commonjs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    commonjs() // Plugin para manejar módulos CommonJS
  ],
  define: {
    global: 'globalThis',
    // Evitar errores de require
    'process.env': {},
  },
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-image'
    ],
    // Forzar pre-bundling de dependencias problemáticas
    force: true
  },
  // Configuración para manejar CommonJS y ESM
  ssr: {
    noExternal: []
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
    sourcemap: false, // Desactivar sourcemaps para producción
    // Configurar rollup para manejar CommonJS
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    // Agregar timestamp para forzar invalidación de caché
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}-v4-FIXED.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}-v4-FIXED.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}-v4-FIXED.[ext]`,
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      }
    }
  },
  base: '/',
  server: {
    port: 5173,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  }
})
