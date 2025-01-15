export const EnvVariables = {
  backendUrl: !!import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL.toString()
    : undefined,

  analyticsEngineUrl: !!import.meta.env.VITE_ANALYTIC_ENGINE_URL
    ? import.meta.env.VITE_ANALYTIC_ENGINE_URL.toString()
    : undefined,

  mapBoxAccessToken: !!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    ? import.meta.env.VITE_MAPBOX_ACCESS_TOKEN.toString()
    : undefined,

  mapBoxUsername: !!import.meta.env.VITE_MAPBOX_USERNAME
    ? import.meta.env.VITE_MAPBOX_USERNAME.toString()
    : undefined,

  rasterServerUrl: !!import.meta.env.VITE_RASTER_SERVER_URL
    ? import.meta.env.VITE_RASTER_SERVER_URL.toString()
    : undefined,

  cesiumAccessToken: !!import.meta.env.VITE_CESIUM_ACCESS_TOKEN
    ? import.meta.env.VITE_CESIUM_ACCESS_TOKEN.toString()
    : undefined,

  terrainServerUrl: !!import.meta.env.VITE_TERRAIN_SERVER_URL
    ? import.meta.env.VITE_TERRAIN_SERVER_URL.toString()
    : undefined,

  sentryDSN: !!import.meta.env.VITE_SENTRY_DSN
    ? import.meta.env.VITE_SENTRY_DSN.toString()
    : undefined,

  environment: !!import.meta.env.MODE
    ? import.meta.env.MODE.toString()
    : undefined,

  processingUrl: !!import.meta.env.VITE_PROCESSING_URL
    ? import.meta.env.VITE_PROCESSING_URL.toString()
    : undefined,
  vectorServerUrl: !!import.meta.env.VITE_VECTOR_SERVER_URL
    ? import.meta.env.VITE_VECTOR_SERVER_URL.toString()
    : undefined,
};
