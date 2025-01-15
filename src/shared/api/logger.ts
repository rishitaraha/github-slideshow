import * as Sentry from '@sentry/react';
import { ApiErrorResponse } from './types';

// https://tanstack.com/query/v4/docs/react/guides/custom-logger
const customLogger = {
  log: (message) => {
    console.log(message);
  },
  warn: (message) => {
    console.warn(message);
  },
  error: (error: ApiErrorResponse) => {
    if (error.meta?.status_code >= 500) {
      Sentry.captureMessage(error.meta.message, 'error');
    }
  },
};

export default customLogger;
