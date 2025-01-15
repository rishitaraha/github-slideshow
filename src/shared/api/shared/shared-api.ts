import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { LoginModeResponse } from '../auth';
import { ApiResponse, ApiErrorResponse } from '../types';
import { apiDataResponseMapper, apiPayloadMapper } from '../utils';
import { CompleteMultiPartUploadPayload, DownloadFileResponse } from './types';

export const getEnvVariables = async (): Promise<ApiResponse> => {
  const response = await api.get<any, ApiResponse>('/environment/');
  response.data = apiDataResponseMapper(response.data);
  return response;
};

export const useFileDownload = () =>
  useMutation({
    mutationFn: (fileId: string) => downloadFileRequest(fileId),
  });

export const downloadFileRequest = async (
  fileId: string,
): Promise<DownloadFileResponse> => {
  const res = await api.get<ApiResponse>(`/files/${fileId}/download-file/`);
  return apiDataResponseMapper(res.data);
};

export const completeMultiPartUploadRequest = async (
  payload: CompleteMultiPartUploadPayload,
): Promise<ApiResponse> => {
  const { url, ...rest } = payload;
  return await api.post(url, apiPayloadMapper({ ...rest }));
};

export const useCompleteMultiPartUploadRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, CompleteMultiPartUploadPayload>({
    mutationFn: async (payload: CompleteMultiPartUploadPayload) =>
      completeMultiPartUploadRequest(payload),
  });

export const useEnvironment = (enabled = false) =>
  useQuery<ApiResponse, ApiErrorResponse, ApiResponse<LoginModeResponse>>({
    queryKey: ['env-variables'],
    queryFn: () => getEnvVariables(),
    enabled,
  });
