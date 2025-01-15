import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { apiPayloadMapper } from '../utils';
import { processingConnectionResponseMapper } from './mappers';
import {
  CreateProcessingConnectionPayloadType,
  CreateProcessingOrgPayloadType,
  ExportFilesFromProcessingPayloadType,
  ProcessingConnectionData,
} from './types';

// APIs.
export const getProcessingConnection = async (): Promise<
  ApiResponse<ProcessingConnectionData>
> => {
  const res = await api.get<any, ApiResponse>(`/processing/connection/`);
  res.data = processingConnectionResponseMapper(res);
  return res;
};

export const createProcessingConnectionRequest = async (
  payload: CreateProcessingConnectionPayloadType,
): Promise<ApiResponse<ProcessingConnectionData>> => {
  const response = await api.post<any, ApiResponse>('/processing/connect/', {
    processing_org_id: payload.processingOrgId,
    connection_token: payload.connectionToken,
  });

  response.data = processingConnectionResponseMapper(response);

  return response;
};

export const disconnectProcessingRequest = async (): Promise<ApiResponse> => {
  return await api.delete(`/processing/disconnect/`);
};

export const createProcessingOrgRequest = async (
  payload: CreateProcessingOrgPayloadType,
): Promise<ApiResponse<ProcessingConnectionData>> => {
  const response = await api.post<any, ApiResponse>('/processing/org/', {
    processing_org_name: payload.orgName,
  });

  response.data = processingConnectionResponseMapper(response);

  return response;
};

export const exportFilesFromProcessingRequest = async (
  payload: ExportFilesFromProcessingPayloadType,
): Promise<ApiResponse> => {
  const mappedPayload = apiPayloadMapper(payload);
  return await api.post<any, ApiResponse>('/processing/export/', mappedPayload);
};

// Hooks.
export const useProcessingConnection = (enabled = true) =>
  useQuery<any, ApiErrorResponse, ApiResponse<ProcessingConnectionData>>({
    queryKey: ['processingConnection'],
    queryFn: getProcessingConnection,
    enabled,
  });

export const useCreateProcessingConnection = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: createProcessingConnectionRequest,
  });

export const useDisconnectProcessing = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: disconnectProcessingRequest,
  });

export const useCreateProcessingOrg = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: createProcessingOrgRequest,
  });

export const useExportFilesFromProcessing = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: exportFilesFromProcessingRequest,
  });
