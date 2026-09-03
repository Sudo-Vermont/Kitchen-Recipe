import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// Static demo builds (GitHub Pages) have no dev server and no API server.
const isDemo = process.env.VITE_DEMO === 'true';

const rawPort = process.env.PORT ?? (isDemo ? '5000' : undefined);

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

// Clerk needs a backend to issue sessions, so the demo swaps it for a stub
// that reports a signed-out state rather than failing on a missing key.
const demoAliases = isDemo
  ? [
      { find: /^@clerk\/react$/, replacement: path.resolve(import.meta.dirname, 'src/demo/clerk.tsx') },
      { find: /^@clerk\/react\/internal$/, replacement: path.resolve(import.meta.dirname, 'src/demo/clerk.tsx') },
      { find: /^@clerk\/themes$/, replacement: path.resolve(import.meta.dirname, 'src/demo/clerk.tsx') },
    ]
  : [];

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    // Array form so the demo entries can use anchored regexes. `@assets` must
    // come before `@` so the more specific prefix wins.
    alias: [
      ...demoAliases,
      {
        find: '@assets',
        replacement: path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      { find: '@', replacement: path.resolve(import.meta.dirname, 'src') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
