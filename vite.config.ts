import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import fs from 'fs';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  // Automatic Logo Copying for PWA
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const imagesDir = path.resolve(__dirname, 'src/assets/images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    const logoFile = files.find(f => f.startsWith('smart_logo') && f.endsWith('.png'));
    if (logoFile) {
      const logoSrc = path.join(imagesDir, logoFile);
      fs.copyFileSync(logoSrc, path.join(publicDir, 'logo.png'));
      fs.copyFileSync(logoSrc, path.join(publicDir, 'icon-192.png'));
      fs.copyFileSync(logoSrc, path.join(publicDir, 'icon-512.png'));
      fs.copyFileSync(logoSrc, path.join(publicDir, 'apple-touch-icon.png'));
      console.log('Successfully copied PWA and App icons inside public/');
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
