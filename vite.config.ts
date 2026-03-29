import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Same id in the JS bundle and in dist/version.json after build (override in CI with VITE_BUILD_ID). */
const buildId =
  process.env.VITE_BUILD_ID ?? (process.env.NODE_ENV === 'production' ? String(Date.now()) : 'dev');

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
  },
  plugins: [
    react(),
    {
      name: 'dupoind-version-json',
      closeBundle() {
        if (buildId !== 'dev') {
          writeFileSync(join(process.cwd(), 'dist', 'version.json'), JSON.stringify({ build: buildId }));
        }
      },
    },
  ],
});
