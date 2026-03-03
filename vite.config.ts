import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import mock from './src/mock-data';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    base: "/",                 // ✅ important for Render
    build: {
      outDir: "dist",          // ✅ ensures index.html goes into dist/
      emptyOutDir: true
    },
    server: {
      host: true, // Allow access from other devices on the network
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
      // Dev middleware: serve mock API if backend not available
      middlewareMode: false,
    },

    // Add dev-only middleware to mock /api responses when running vite dev
    configureServer: ({ middlewares }) => {
      middlewares.use((req, res, next) => {
        if (!req.url) return next();
        if (!req.url.startsWith('/api')) return next();

        // Simple routing
        if (req.method === 'GET' && req.url === '/api/events') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(mock.events));
        }

        if (req.method === 'GET' && req.url.startsWith('/api/registrations/user/')) {
          // return array of event ids
          const parts = req.url.split('/');
          const userId = parseInt(parts[parts.length - 1], 10) || 1;
          const regs = mock.registrations.filter(r => r.user_id === userId).map(r => r.event_id);
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(regs));
        }

        if (req.method === 'GET' && req.url.startsWith('/api/likes/user/')) {
          const parts = req.url.split('/');
          const userId = parseInt(parts[parts.length - 1], 10) || 1;
          const liked = mock.likes.filter(l => l.user_id === userId).map(l => l.event_id);
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(liked));
        }

        if (req.method === 'GET' && req.url.startsWith('/api/users/')) {
          const parts = req.url.split('/');
          const id = parseInt(parts[parts.length - 1], 10) || 1;
          const u = mock.users.find(x => x.id === id) || mock.users[0];
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(u));
        }

        // Fallback to proxy if not handled
        return next();
      });
    },
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});