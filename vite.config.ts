import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'index.ts'),
      name: 'Cesium',
      fileName: 'cesium',
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        dir: resolve(__dirname, 'dist'),
        format: 'es',
      },
    },
  },
  optimizeDeps: {
    include: ['uuid'],
  },
});
