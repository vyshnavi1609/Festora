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

        // role requests
        if (req.method === 'GET' && req.url.startsWith('/api/role-requests')) {
          res.setHeader('Content-Type', 'application/json');
          // we don't filter by user; just return all for simplicity
          return res.end(JSON.stringify(mock.roleRequests || []));
        }

        if (req.method === 'POST' && req.url === '/api/role-requests') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const newReq = {
                id: (mock.roleRequests.length ? mock.roleRequests[mock.roleRequests.length-1].id+1 : 1),
                requester_id: data.requester_id,
                requester_name: mock.users.find(u=>u.id===data.requester_id)?.full_name || 'unknown',
                target_user_id: data.target_user_id,
                target_name: mock.users.find(u=>u.id===data.target_user_id)?.full_name || 'unknown',
                requested_role: data.requested_role,
                description: data.description || null,
                status: 'pending',
                club_id: data.club_id || null,
                club_name: data.club_name || null,
                created_at: new Date().toISOString()
              };
              mock.roleRequests.push(newReq);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(newReq));
            } catch (e) {
              res.statusCode = 400;
              res.end('invalid');
            }
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/api/role-requests/approve') {
          let body = '';
          req.on('data', c=> body+=c);
          req.on('end', () => {
            const { requestId } = JSON.parse(body);
            const idx = mock.roleRequests.findIndex(r=>r.id===requestId);
            if (idx !== -1) mock.roleRequests[idx].status = 'approved';
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }
        if (req.method === 'POST' && req.url === '/api/role-requests/reject') {
          let body = '';
          req.on('data', c=> body+=c);
          req.on('end', () => {
            const { requestId } = JSON.parse(body);
            const idx = mock.roleRequests.findIndex(r=>r.id===requestId);
            if (idx !== -1) mock.roleRequests[idx].status = 'rejected';
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          });
          return;
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