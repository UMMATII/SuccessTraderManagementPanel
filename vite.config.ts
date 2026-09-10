import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Vite dev server middleware to run /api/create-employee in local development
function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api/create-employee')) {
          try {
            const { default: handler } = await import('./api/create-employee.ts');
            await handler(req, res);
          } catch (err) {
            console.error('[Vite Dev API Error]:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Local serverless API middleware execution failed' }));
          }
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Populate server-side environment variables for local dev execution
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  process.env.SUPABASE_URL =
    env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      apiDevPlugin(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
    },
  };
});

