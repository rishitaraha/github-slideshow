import {
  completeTopLoading,
  startTopLoading,
} from '@aus-platform/design-system';
import axios, { AxiosError, AxiosResponse } from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { isNil } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { EnvVariables } from '../env-variables';
import { TokenManager } from '../helpers/local-storage-managers/token-manager';
import { ApiErrorResponse, ApiErrorType } from './types';
import { handleRefreshToken, UnhandledApiErrorMessage } from '.';

/* 
Custom Axios instance for API calls not managed by React Query.
Includes an interceptor to handle token refresh logic on 401 responses.
 */
const autoRefreshApi = axios.create({
  baseURL: EnvVariables.backendUrl,
});

autoRefreshApi.interceptors.request.use((req) => {
  if (TokenManager.getToken() && req.headers) {
    req.headers['X-REQUEST-ID'] = uuidv4();
    req.headers['Authorization'] = `Bearer ${TokenManager.getToken()}`;
  }
  startTopLoading();
  return req;
});

autoRefreshApi.interceptors.response.use((res) => {
  completeTopLoading();
  return res.data;
});

const isCustomError = (error: AxiosError<ApiErrorResponse>) => {
  const errorValues: Array<string> = Object.values(UnhandledApiErrorMessage);
  // Checks if error is Unhandled type.
  return (
    !isNil(error.response?.data?.meta?.type) &&
    !errorValues.includes(error.message)
  );
};

createAuthRefreshInterceptor(autoRefreshApi, handleRefreshToken, {
  statusCodes: [401],
  shouldRefresh: (error: AxiosError<ApiErrorResponse>) => {
    if (isCustomError(error)) {
      const errorResponse: AxiosResponse | undefined = error.response;
      if (errorResponse?.data?.meta.type === ApiErrorType.InvalidToken) {
        return true;
      }
    }
    if (error?.response?.status === 401) {
      return true;
    }

    return false;
  },
});

export default autoRefreshApi;
