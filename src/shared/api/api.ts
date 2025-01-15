import {
  completeTopLoading,
  startTopLoading,
  toast,
} from '@aus-platform/design-system';
import axios, { AxiosError } from 'axios';
import { isNil } from 'lodash';
import { QueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { EnvVariables } from '../env-variables';
import { isAppOpenInIframe } from '../helpers';
import { logout } from '../helpers/auth-helper';
import { OrgMetaManager } from '../helpers/local-storage-managers/org-manager';
import { TokenManager } from '../helpers/local-storage-managers/token-manager';
import { ApiErrorResponse, ApiErrorType, RefreshTokenResponse } from './types';
import { ApiResponse, UnhandledApiErrorMessage } from '.';

// Overriding react query's default error type.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiErrorResponse;
  }
}

const api = axios.create({
  baseURL: EnvVariables.backendUrl,
});

api.interceptors.request.use((req) => {
  if (isAppOpenInIframe() && req.headers) {
    const orgAccessToken = sessionStorage.getItem('orgAccessToken');

    req.headers['X-REQUEST-ID'] = uuidv4();
    req.headers['X-Org-Access-Token'] = orgAccessToken;
  } else if (TokenManager.getToken() && req.headers) {
    req.headers['X-REQUEST-ID'] = uuidv4();
    req.headers['Authorization'] = `Bearer ${TokenManager.getToken()}`;
  }

  if (OrgMetaManager.getOrgId()) {
    const updatedId = OrgMetaManager.getOrgId();
    if (updatedId !== 'undefined' || '') {
      if (req.data) {
        req.data['org_id'] = updatedId;
      } else if (!req.url?.includes('?')) {
        req.url = req.url?.concat('?org_id=', updatedId || '');
      } else {
        req.url = req.url?.concat('&org_id=', updatedId || '');
      }
    }
  }
  startTopLoading();
  return req;
});

api.interceptors.response.use(
  (res) => {
    completeTopLoading();
    return res.data;
  },
  async (error): Promise<ApiErrorResponse | null> => {
    let errorResponse: ApiErrorResponse | null;
    if (isCustomError(error)) {
      errorResponse = error.response.data;
      switch (errorResponse?.meta.type) {
        case ApiErrorType.InvalidToken: {
          OrgMetaManager.removeOrgName();
          OrgMetaManager.removeOrgId();
          const refreshToken = TokenManager.getRefreshToken();
          if (!TokenManager.getToken() || !refreshToken) {
            logout();
          }
          break;
        }

        case ApiErrorType.AuthenticationFailed: {
          logout();
          break;
        }

        case ApiErrorType.TokenBlacklisted: {
          logout();
          break;
        }
      }
    } else if (!isNil(error.response) && error.response.status >= 500) {
      errorResponse = {
        meta: {
          type: ApiErrorType.ServerError,
          status_code: error.response.status,
          message: 'Something went wrong, please try again later.',
          slug: 'internal_server_error',
          details: {},
        },
        data: {},
      };

      // Shows toast for errors and toastId prevents duplicate toasts.
      toast.error(errorResponse.meta.message, {
        toastId: errorResponse.meta.type,
      });
    } else if (
      !isNil(error.message) &&
      error.message === UnhandledApiErrorMessage.NetworkError
    ) {
      errorResponse = {
        meta: {
          type: ApiErrorType.NetworkError,
          status_code: 503,
          message:
            'Network Error Occurred. Please check your internet connection and try again later.',
          slug: 'network_error',
          details: {},
        },
        data: {},
      };
    } else {
      errorResponse = {
        meta: {
          type: ApiErrorType.SystemError,
          status_code: 500,
          slug: 'system_error',
          message: error.message,
          details: {},
        },
        data: {},
      };
    }

    completeTopLoading();

    return Promise.reject(errorResponse);
  },
);

const isCustomError = (error: AxiosError<ApiErrorResponse>) => {
  const errorValues: Array<string> = Object.values(UnhandledApiErrorMessage);
  // Checks if error is Unhandled type.
  return (
    !isNil(error.response?.data?.meta?.type) &&
    !errorValues.includes(error.message)
  );
};

export const handleRefreshToken = async () => {
  try {
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      const res = await api.post<any, ApiResponse<RefreshTokenResponse>>(
        '/auth/token/refresh/',
        {
          refresh: TokenManager.getRefreshToken(),
        },
      );

      if (res.data.access) {
        TokenManager.saveToken(res.data.access);
      }
    } else {
      logout();
    }
  } catch (e: any) {
    if (e.meta?.type === ApiErrorType.InvalidToken) {
      logout();
    }
  }
};

// React Query Configuration.
export const defaultQueryFn = async ({ queryKey }: any) => {
  const response = await api.get<any, ApiResponse<any>>(
    `${EnvVariables.backendUrl}${queryKey[0]}`,
  );
  return response;
};

/**
 * With staleTime: Infinity, gcTime: 0,
 * data stays fresh indefinitely while in use, but is removed from cache when not actively used.
 * 'Actively used' -> the data is shown or needed by a component.
 * On returning to the data, it won't auto-refetch as it's still considered fresh,
 * unless manually triggered.
 * Ref - https://www.codemzy.com/blog/react-query-cachetime-staletime
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: (_, error) => {
        if (error.meta.type === ApiErrorType.InvalidToken) {
          handleRefreshToken();
          return true;
        }
        return false;
      },
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      gcTime: 0,
    },
    mutations: {
      retry: (_, error) => {
        if (error.meta.type === ApiErrorType.InvalidToken) {
          handleRefreshToken();
          return true;
        }
        return false;
      },
    },
  },
});

export default api;
