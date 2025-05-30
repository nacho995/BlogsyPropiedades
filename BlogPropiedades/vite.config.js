import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-image'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  esbuild: {
    target: 'es2020'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    target: 'es2020',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}-v14-LOGIN-FIXED.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}-v14-LOGIN-FIXED.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}-v14-LOGIN-FIXED.[ext]`,
      },
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
      // Forzar resolución de React
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  }
})
