import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { apiDataResponseMapper, apiPayloadMapper } from '../utils';
import { mapTaskObject } from './mapper';
import {
  IterationDataset,
  IterationDatasetIdPayload,
  IterationDatasetResponse,
  UpdateIterationDatasetCrsPayload,
} from './types';

const iterationDatasetUrl = '/processing/iteration-dataset/';

// Requests.
const getIterationDatasetRequest = async (
  payload: IterationDatasetIdPayload,
): Promise<ApiResponse<IterationDataset>> => {
  const response = await api.get<
    IterationDatasetResponse,
    ApiResponse<IterationDatasetResponse>
  >(`${iterationDatasetUrl}${payload.iterationDatasetId}/`);

  const responseData = apiDataResponseMapper<
    IterationDatasetResponse,
    IterationDataset
  >(response.data);

  responseData.tasks = responseData.tasks?.map(mapTaskObject);

  return { ...response, data: responseData };
};

const createIterationDatasetRequest = async (
  iterationId,
): Promise<ApiResponse<IterationDataset>> => {
  const response = await api.post<any, ApiResponse<any>>(
    `${iterationDatasetUrl}`,
    {
      iteration: iterationId,
    },
  );

  response.data = apiDataResponseMapper<
    IterationDatasetResponse,
    IterationDataset
  >(response.data.processing_data);

  return response;
};

const updateIterationDatasetRequest = async (
  payload: UpdateIterationDatasetCrsPayload,
): Promise<ApiResponse<IterationDataset>> => {
  const data = apiPayloadMapper(payload);
  const response = await api.patch<any, ApiResponse<any>>(
    `${iterationDatasetUrl}${payload.iterationDatasetId}/`,
    data,
  );

  return { ...response, data: apiDataResponseMapper(response.data) };
};

// Hooks.
export const useIterationDatasetRequest = (
  payload: IterationDatasetIdPayload,
  enabled = false,
) =>
  useQuery<ApiResponse<IterationDataset>, ApiErrorResponse>({
    queryKey: [`${iterationDatasetUrl}`, payload],
    queryFn: async () => getIterationDatasetRequest(payload),
    enabled,
  });

export const useCreateIterationDatasetRequest = () =>
  useMutation<ApiResponse<IterationDataset>, ApiErrorResponse, string>({
    mutationFn: async (iterationId: string) =>
      createIterationDatasetRequest(iterationId),
  });

export const useUpdateIterationDatasetRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, UpdateIterationDatasetCrsPayload>({
    mutationFn: async (payload: UpdateIterationDatasetCrsPayload) =>
      updateIterationDatasetRequest(payload),
  });
