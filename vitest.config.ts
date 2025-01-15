import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov', 'cobertura'],
      exclude: [
        ...configDefaults.exclude,
        'src/**/{index,types,type,enums,constants,logger}.ts',
      ],
    },
    server: {
      deps: {
        inline: ['@aus-platform/cesium'],
      },
      sourcemap: true,
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      ...configDefaults.exclude,
      'src/**/{index,types,type,enums,constants,logger}.ts',
    ],
    alias: {
      src: '/src',
      app: '/src/app/',
      'map-3d': '/src/map-3d/',
      shared: '/src/shared/',
    },
  },
});
