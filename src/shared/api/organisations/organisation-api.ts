import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { Organisation } from './type';

// APIs.
export const getMyOrgRequest = async (): Promise<ApiResponse<Organisation>> => {
  return await api.get<any, ApiResponse>(`/organisations/my-org/`);
};

export const uploadLogoRequest = async (
  logo: File,
): Promise<ApiResponse<Organisation>> => {
  const payload = new FormData();
  payload.set('logo', logo, logo.name);
  return await api.post('/organisations/logo/', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Hooks.
export const useMyOrg = () =>
  useQuery<any, ApiErrorResponse, ApiResponse<Organisation>>({
    queryKey: ['organisation'],
    queryFn: getMyOrgRequest,
  });

export const useUploadLogo = () =>
  useMutation<ApiResponse<Organisation>, ApiErrorResponse, any>({
    mutationFn: uploadLogoRequest,
  });
