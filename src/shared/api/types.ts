import { UseQueryOptions } from '@tanstack/react-query';
import { FileStatus } from '../enums';

export type ApiResponse<T = any> = {
  meta: ApiError;
  data: T;
};

export type ApiErrorResponse<T = any> = {
  meta: ApiError;
  data: T;
};

export type ApiErrorResponseMessage = {
  message: string;
  slug: string;
};

export type ApiFormErrorDetails = {
  form: ApiErrorResponseMessage;
};
export type ApiFieldErrorsDetails = Record<
  string,
  Array<ApiErrorResponseMessage>
>;

export type ApiError = ApiErrorResponseMessage & {
  status_code: number;
  type: ApiErrorType;
  details?: ApiFormErrorDetails | ApiFieldErrorsDetails;
};

export enum ApiErrorType {
  InvalidToken = 'InvalidToken',
  ValidationError = 'ValidationError',
  SystemError = 'SystemError',
  TokenBlacklisted = 'TokenBlacklisted',
  IntegrityError = 'IntegrityError',
  Unauthorized = 'Unauthorized',
  ServerError = 'ServerError',
  NetworkError = 'NetworkError',
  AuthenticationFailed = 'AuthenticationFailed',
}

export type RefreshTokenResponse = {
  access: string;
};

export enum RequestStatus {
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

export enum UnhandledApiErrorMessage {
  NetworkError = 'Network Error',
  InternalServerError = 'Internal Server Error',
}

export type FileDetails = {
  id: string;
  name: string;
  status: FileStatus;
  size: string | null;
  downloadUrl: string | null;
};

export type Pagination = {
  page?: number;
  pageSize?: number;
};

export type AuthHeader = {
  Authorization?: string | null;
  'X-Org-Access-Token'?: string | null;
};

export type DynamicFields<T = any> = {
  includeFields?: Array<keyof T>;
  excludeFields?: Array<keyof T>;
};

export type CustomQueryType<Response, Payload = any, Error = any> = Omit<
  UseQueryOptions<any, ApiErrorResponse<Error>, ApiResponse<Response>>,
  'queryKey'
> & {
  payload?: Payload;
};
