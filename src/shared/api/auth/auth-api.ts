import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { loginResponseMapper, ssoLoginResponseMapper } from './mappers';
import {
  LoginRequestPayload,
  LoginResponse,
  LogoutRequestPayload,
  ssoLoginRequestPayload,
  SSOLoginResponse,
} from './types';

// Api.
export const loginRequest = async (
  payload: LoginRequestPayload,
): Promise<ApiResponse<LoginResponse>> => {
  const res = await api.post<any, ApiResponse>('/auth/login/', payload);
  res.data = loginResponseMapper(res);
  return res;
};

export const SSOLoginRequest = async (
  payload: ssoLoginRequestPayload,
): Promise<ApiResponse<SSOLoginResponse>> => {
  const res = await api.post<any, ApiResponse>('/auth/login/cognito/', payload);
  res.data = ssoLoginResponseMapper(res);
  return res;
};

export const logoutRequest = async (
  payload: LogoutRequestPayload,
): Promise<ApiResponse> => await api.post('/auth/logout/', payload);

// Hooks.
export const useLoginRequest = () =>
  useMutation<ApiResponse<LoginResponse>, ApiErrorResponse, any>({
    mutationFn: async (payload: LoginRequestPayload) => loginRequest(payload),
  });

export const useSSOLoginRequest = () =>
  useMutation<ApiResponse<SSOLoginResponse>, ApiErrorResponse, any>({
    mutationFn: async (payload: ssoLoginRequestPayload) =>
      SSOLoginRequest(payload),
  });

export const useLogoutRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any, LogoutRequestPayload>({
    mutationFn: async (payload: LogoutRequestPayload) => logoutRequest(payload),
  });
