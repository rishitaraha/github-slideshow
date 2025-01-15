/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  plugins: [react(), cesium({ rebuildCesium: true })]
});
