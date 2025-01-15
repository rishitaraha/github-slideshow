import {
  replayCanvasIntegration,
  replayIntegration,
  init as SentryInit,
} from '@sentry/react';
import { EnvVariables } from './shared/env-variables';

/**
 * Initializes Sentry based on the environment.
 *
 * Sets up Sentry with replay integrations in 'production' for session and canvas recording.
 * Configures Sentry with DSN, environment, and sample rates for error and transaction tracking.
 *
 */
export const setupSentry = () => {
  if (
    EnvVariables.environment === 'production' ||
    EnvVariables.environment === 'uat'
  ) {
    const replay =
      EnvVariables.environment === 'production'
        ? [
            replayIntegration({
              maskAllText: false,
              blockAllMedia: false,
            }),
            // Enable canvas recording with Replay.
            replayCanvasIntegration(),
          ]
        : [];

    SentryInit({
      dsn: EnvVariables.sentryDSN,
      environment: EnvVariables.environment,
      integrations: replay,
      // We don't want to record user sessions w/o error.
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      tracesSampleRate: 1.0,
    });
  }
};
