import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

/*
 * This checkEnvVariables function is responsible for checking if required environment variables are set or not.
 * @param {string} mode - The mode in which app is building or serving
 */
const checkEnvVariables = (mode: string) => {
  // Load environment variables from .env files according to the app mode.
  dotenv.config({ path: __dirname + `/config/.env.${mode}.local` });
  dotenv.config({ path: __dirname + `/config/.env.${mode}` });

  const requiredVarsBasedOnMode: string[] = [];

  switch (mode) {
    case 'uat':
    case 'production': {
      requiredVarsBasedOnMode.push('VITE_SENTRY_DSN');
      break;
    }
  }

  const requiredEnvVars = [
    'VITE_BACKEND_URL',
    'VITE_CESIUM_ACCESS_TOKEN',
    'VITE_MAPBOX_ACCESS_TOKEN',
    'VITE_MAPBOX_USERNAME',
    'VITE_PROCESSING_URL',
    'VITE_TILE_SERVER_URL',
    ...requiredVarsBasedOnMode,
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  } else {
    console.info('All required environment variables are set 🎉 \n');
  }
};

export default defineConfig(({ mode }) => {
  if (mode !== 'test') {
    checkEnvVariables(mode);
  }

  return {
    logLevel: 'info',
    build: {
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('cesium')) {
                return 'cesium';
              }
              if (id.includes('@aus-platform/design-system')) {
                return 'design-system';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
    plugins: [
      react(),
      cesium({
        rebuildCesium: true,
      }),
    ],
    envDir: 'config/',
    resolve: {
      alias: {
        src: '/src',
        app: '/src/app/',
        'map-3d': '/src/map-3d/',
        shared: '/src/shared/',
      },
      // Reduce the number of files being resolved.
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    optimizeDeps: {
      // Pre-bundling of specific libraries for better build performance.
      include: [
        'react',
        'react-dom',
        '@aus-platform/cesium',
        '@aus-platform/design-system',
      ],
    },
  };
});
