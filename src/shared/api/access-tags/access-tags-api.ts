import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { accessTagListMapper } from './mapper';
import {
  AccessTagList,
  AccessTagListPayload,
  AddAccessTagPayload,
  DeleteAccessTagPayload,
  UpdateAccessTagPayload,
} from './types';

// APIs.
export const getAccessTagListRequest = async (
  payload?: AccessTagListPayload,
): Promise<ApiResponse> => {
  const response = await api.get<any, ApiResponse>('/access-tags/', {
    params: {
      page: payload?.page,
      page_size: payload?.pageSize,
    },
  });
  response.data = accessTagListMapper(response.data);
  return response;
};

export const addAccessTagRequest = async (
  payload: AddAccessTagPayload,
): Promise<ApiResponse> => {
  return api.post<any, ApiResponse>('/access-tags/', {
    name: payload.tagName,
    color: payload.color,
  });
};

export const updateAccessTagRequest = async (
  payload: UpdateAccessTagPayload,
): Promise<ApiResponse> => {
  return api.patch<any, ApiResponse>(`/access-tags/${payload.id}/`, {
    name: payload.tagName,
    color: payload.color,
  });
};

export const deleteAccessTagRequest = async (
  payload: DeleteAccessTagPayload,
): Promise<ApiResponse> => await api.delete(`/access-tags/${payload.id}/`);

// Hooks.
export const useAccessTagList = (
  payload?: AccessTagListPayload,
  enabled?: boolean,
) =>
  useQuery<any, ApiErrorResponse, ApiResponse<AccessTagList>>({
    queryKey: ['access-tags', payload],
    queryFn: () => getAccessTagListRequest(payload),
    enabled,
  });

export const useAddAccessTagRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, AddAccessTagPayload>({
    mutationFn: async (payload: AddAccessTagPayload) =>
      addAccessTagRequest(payload),
  });

export const useUpdateAccessTagRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, UpdateAccessTagPayload>({
    mutationFn: async (payload: UpdateAccessTagPayload) =>
      updateAccessTagRequest(payload),
  });

export const useDeleteAccessTagRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, DeleteAccessTagPayload>({
    mutationFn: async (payload: DeleteAccessTagPayload) =>
      deleteAccessTagRequest(payload),
  });
