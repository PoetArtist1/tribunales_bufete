import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), globalCssPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

const globalCssPath = path.resolve(__dirname, '../global.css');

function globalCssPlugin() {
  return {
    name: 'global-css-single-source',
    configureServer(server) {
      server.middlewares.use('/global.css', (req, res, next) => {
        if (!fs.existsSync(globalCssPath)) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/css');
        res.end(fs.readFileSync(globalCssPath, 'utf-8'));
      });
    },
    buildStart() {
      this.addWatchFile(globalCssPath);
    },
    generateBundle() {
      if (!fs.existsSync(globalCssPath)) {
        return;
      }
      this.emitFile({
        type: 'asset',
        fileName: 'global.css',
        source: fs.readFileSync(globalCssPath, 'utf-8'),
      });
    },
  };
}
