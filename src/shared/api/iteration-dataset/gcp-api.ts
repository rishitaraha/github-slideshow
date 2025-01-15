import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiErrorResponse, ApiResponse } from '../types';
import api from '../api';
import { apiDataResponseMapper, apiPayloadMapper } from '../utils';
import {
  DeleteGcpDataPayload,
  GCPBulkUpdatePayload,
  DatasetParamPayload,
  GCPList,
  GCPListPayload,
  GCPListResponse,
  GCPUpdatePayload,
  UploadGCPPayload,
  GcpIdPagePayload,
  ImagesObjList,
  ImageUrlsListResponse,
} from './types';

// Apis.
const gcpListRequest = async (
  payload: GCPListPayload,
): Promise<ApiResponse<GCPList>> => {
  const paramsPayload = apiPayloadMapper(payload);
  const response = await api.get<ApiResponse, any>(`/processing/gcps/`, {
    params: {
      ...paramsPayload,
    },
  });

  response.data = apiDataResponseMapper<GCPListResponse, GCPList>(
    response.data,
  );
  return response;
};

const gcpUpdateRequest = async (
  payload: GCPUpdatePayload,
): Promise<ApiResponse> => {
  const id = payload.id;
  const paramsPayload = apiPayloadMapper(payload.body);
  const response = await api.patch<ApiResponse, any>(
    `/processing/gcps/${id}/`,
    {
      gcp: paramsPayload,
    },
  );

  return response;
};

const gcpBulkUpdateRequest = async (
  payload: GCPBulkUpdatePayload,
): Promise<ApiResponse> => {
  const paramsPayload = apiPayloadMapper(payload);
  const response = await api.patch<ApiResponse, any>(
    `/processing/gcps/bulk/`,
    paramsPayload,
  );

  return response;
};

export const bulkDeleteGcpRequest = async (
  payload: DeleteGcpDataPayload,
): Promise<ApiResponse<any>> => {
  return api.post<ApiResponse, any>(
    'processing/gcps/delete/',
    apiPayloadMapper(payload),
  );
};

const uploadGCPRequest = async (
  payload: UploadGCPPayload,
): Promise<ApiResponse> => {
  const requestPayload = apiPayloadMapper(payload);
  const formData = new FormData();

  Object.keys(requestPayload).forEach((requestPayloadKey) => {
    if (requestPayloadKey === 'gcp_file') {
      formData.append(requestPayloadKey, payload.gcpFile);
    } else {
      formData.append(requestPayloadKey, requestPayload[requestPayloadKey]);
    }
  });

  const response = await api.post<ApiResponse, any>(
    `/processing/gcps/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response;
};

export const downloadGcpRequest = async (
  payload: DatasetParamPayload,
): Promise<ApiResponse> => {
  return api.get<ApiResponse, any>('processing/gcps/download/', {
    params: apiPayloadMapper(payload),
  });
};

export const getGcpImagesListRequest = async (
  payload: GcpIdPagePayload,
): Promise<ImagesObjList> => {
  const { gcpId, ...payloadData } = payload;
  const response = await api.get<any, ApiResponse<ImageUrlsListResponse>>(
    `processing/gcps/${gcpId}/images/`,
    {
      params: apiPayloadMapper(payloadData),
    },
  );
  return apiDataResponseMapper<ImageUrlsListResponse, ImagesObjList>(
    response.data,
  );
};

// Hooks.
export const useGCPList = (payload: GCPListPayload) =>
  useQuery<ApiResponse<GCPList>, ApiErrorResponse>({
    queryKey: ['/processing/gcps/', 'list', payload],
    queryFn: async () => gcpListRequest(payload),
  });

export const useGCPUpdate = () =>
  useMutation<ApiResponse, ApiErrorResponse, GCPUpdatePayload>({
    mutationFn: async (payload: GCPUpdatePayload) => gcpUpdateRequest(payload),
  });

export const useGCPBulkUpdate = () =>
  useMutation<ApiResponse, ApiErrorResponse, GCPBulkUpdatePayload>({
    mutationFn: async (payload: GCPBulkUpdatePayload) =>
      gcpBulkUpdateRequest(payload),
  });

export const useGcpBulkDelete = () =>
  useMutation<ApiResponse, ApiErrorResponse, DeleteGcpDataPayload>({
    mutationFn: async (payload: DeleteGcpDataPayload) =>
      bulkDeleteGcpRequest(payload),
  });

export const useUploadGCP = () =>
  useMutation<ApiResponse, ApiErrorResponse, UploadGCPPayload>({
    mutationFn: async (payload: UploadGCPPayload) => uploadGCPRequest(payload),
  });

export const useGcpDownloadRequest = (
  payload: DatasetParamPayload,
  enabled = false,
) =>
  useQuery<any, ApiErrorResponse>({
    queryKey: ['processing/gcps/download/', payload],
    queryFn: () => downloadGcpRequest(payload),
    enabled,
  });

export const useGcpImagesListRequest = (
  payload: GcpIdPagePayload,
  enabled = true,
) =>
  useQuery<ImagesObjList, ApiErrorResponse>({
    queryKey: [`processing/gcps/${payload.gcpId}/images/`, payload],
    queryFn: () => getGcpImagesListRequest(payload),
    enabled,
  });
