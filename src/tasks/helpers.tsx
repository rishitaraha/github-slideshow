import { EventSourcePolyfill } from 'event-source-polyfill';
import { EnvVariables } from 'src/shared/env-variables';
import { TokenManager } from 'src/shared/helpers';

export const getSseEventSource = (idList: string[], endpoint: string) => {
  const sseUrl = EnvVariables.logServerUrl + endpoint + idList.join();
  // Creating a new sse connection.
  const authHeader = {
    Authorization: `Bearer ${TokenManager.getToken()}`,
  };
  const progressEventSource = new EventSourcePolyfill(sseUrl, {
    headers: authHeader,
  });
  return progressEventSource;
};
