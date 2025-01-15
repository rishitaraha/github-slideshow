import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiErrorResponse, ApiResponse } from '../types';
import api from '../api';
import { fileMapper, metadataMapper } from './mapper';
import {
  AddFilePayload,
  DeleteFilePayload,
  FileDataType,
  FilePayload,
  MetadataPayload,
  MetadataType,
} from './types';

// Api.
const getFileRequest = async (
  payload: FilePayload,
): Promise<ApiResponse<FileDataType>> => {
  const response = await api.get<ApiResponse, any>(`/files/${payload.id}/`, {
    params: {
      iteration_id: payload.iterationId,
    },
  });
  response.data = fileMapper(response.data);
  return response;
};

const addFileRequest = async (payload: AddFilePayload): Promise<ApiResponse> =>
  await api.post<ApiResponse, any>(`/files/`, payload);

const deleteFileRequest = async (payload: DeleteFilePayload) =>
  await api.delete<ApiResponse, any>(`/files/${payload.id}/`);

const getMetadataRequest = async (
  payload: MetadataPayload,
): Promise<ApiResponse> => {
  const { fileId, iterationId } = payload;
  const res = await api.get<ApiResponse, any>(`/files/${fileId}/properties/`, {
    params: {
      iteration_id: iterationId,
    },
  });
  res.data = metadataMapper(res.data);
  return res;
};

// Hook.
export const useAddFile = () =>
  useMutation<ApiResponse, ApiErrorResponse, AddFilePayload>({
    mutationFn: async (payload: AddFilePayload) => addFileRequest(payload),
  });

export const useFile = (payload: FilePayload, enabled = true) =>
  useQuery<ApiResponse, ApiErrorResponse, any>({
    queryKey: [`/file-info/${payload.id}/`, payload],
    queryFn: () => getFileRequest(payload),
    enabled,
  });

export const useDeleteFile = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: deleteFileRequest,
  });

export const useFileMetadata = (payload: MetadataPayload, enabled = false) =>
  useQuery<ApiResponse, ApiErrorResponse, ApiResponse<MetadataType>>({
    queryKey: [`files/${payload.fileId}/`, payload],
    queryFn: () => getMetadataRequest(payload),
    enabled,
  });
