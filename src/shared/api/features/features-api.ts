import { omit } from 'lodash';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { apiDataResponseMapper, apiPayloadMapper } from '../utils';
import {
  featureInfoPayloadMapper,
  featureInfoResponseMapper,
  featureListResponseMapper,
} from './mappers';
import {
  AddFeaturePayload,
  BulkAddFeaturesPayload,
  BulkDeleteFeatures,
  BulkDeleteFeaturesPayload,
  BulkFeatures,
  BulkUpdateFeaturesPayload,
  Feature,
  FeatureInfo,
  FeatureList,
  FeatureListResponseData,
  FeatureType,
  UpdateFeatureInfoPayload,
  UpdateFeaturePayload,
} from './types';

export const getFeatureListRequest = async (
  layerId: string | null,
  type?: FeatureType,
): Promise<ApiResponse<FeatureList>> => {
  const response = await api.get<any, ApiResponse<FeatureListResponseData>>(
    'features/',
    {
      params: { layer_id: layerId, type },
    },
  );

  response.data = featureListResponseMapper(response.data);

  // Type Assertion.
  return <ApiResponse<FeatureList>>response;
};

export const addFeatureRequest = async (
  payload: AddFeaturePayload,
): Promise<ApiResponse<Feature>> => {
  return await api.post<any, ApiResponse<Feature>>(
    'features/',
    apiPayloadMapper(payload),
  );
};

export const bulkAddFeaturesRequest = async (
  payload: BulkAddFeaturesPayload,
): Promise<ApiResponse> => {
  const response = await api.post<any, ApiResponse>(`features/bulk/`, payload);
  response.data = apiDataResponseMapper(response.data);
  return response;
};

export const deleteFeatureRequest = async (
  featureId: string,
): Promise<ApiResponse> => {
  return await api.delete<any, ApiResponse>(`features/${featureId}`);
};

export const bulkDeleteFeatureRequest = async (
  payload: BulkDeleteFeaturesPayload,
): Promise<ApiResponse> => {
  const response = await api.delete<any, ApiResponse>(`features/bulk/`, {
    params: {
      ids: payload.join(','),
    },
  });

  response.data = apiDataResponseMapper(response.data);
  return response;
};

export const updateFeatureRequest = async (
  payload: UpdateFeaturePayload,
): Promise<ApiResponse> => {
  return await api.patch<any, ApiResponse>(
    `features/${payload.id}`,
    omit(payload, 'id'),
  );
};

export const bulkUpdateFeatureRequest = async (
  payload: BulkUpdateFeaturesPayload,
): Promise<ApiResponse> => {
  return await api.patch<any, ApiResponse>(`features/bulk/`, payload);
};

export const getFeatureInfoRequest = async (
  featureId: string,
): Promise<ApiResponse<FeatureInfo>> => {
  const response = await api.get<any, ApiResponse>(`features/${featureId}/`);

  response.data = featureInfoResponseMapper(response.data);

  return response;
};

export const updateFeatureInfoRequest = async (
  payload: UpdateFeatureInfoPayload,
): Promise<ApiResponse<FeatureInfo>> => {
  const formDataPayload = featureInfoPayloadMapper(payload);

  const response = await api.patch<any, ApiResponse>(
    `/features/${payload.id}/info/`,
    formDataPayload,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  response.data = featureInfoResponseMapper(response.data);
  return response;
};

export const deleteImageRequest = async (imageId: string) => {
  return await api.delete<any, ApiResponse>(`/features/info/image/${imageId}/`);
};

// Hooks.
export const useFeatureList = (
  layerId: string | null,
  type?: FeatureType,
  enabled = false,
) =>
  useQuery<ApiResponse<FeatureList>, ApiErrorResponse>({
    queryKey: ['features', layerId, type],
    queryFn: () => getFeatureListRequest(layerId, type),
    enabled,
  });

export const useAddFeature = () =>
  useMutation<ApiResponse<Feature>, ApiErrorResponse, AddFeaturePayload>({
    mutationFn: async (payload: AddFeaturePayload) =>
      addFeatureRequest(payload),
  });

export const useBulkAddFeatures = () =>
  useMutation<
    ApiResponse<BulkFeatures>,
    ApiErrorResponse,
    BulkAddFeaturesPayload
  >({
    mutationFn: async (payload: BulkAddFeaturesPayload) =>
      bulkAddFeaturesRequest(payload),
  });

export const useDeleteFeature = () =>
  useMutation<ApiResponse<Feature>, ApiErrorResponse, string>({
    mutationFn: async (featureId) => deleteFeatureRequest(featureId),
  });

export const useUpdateFeature = () =>
  useMutation<ApiResponse<Feature>, ApiErrorResponse, UpdateFeaturePayload>({
    mutationFn: async (payload: UpdateFeaturePayload) =>
      updateFeatureRequest(payload),
  });

export const useBulkUpdateFeatures = () =>
  useMutation<
    ApiResponse<Feature>,
    ApiErrorResponse,
    BulkUpdateFeaturesPayload
  >({
    mutationFn: async (payload: BulkUpdateFeaturesPayload) =>
      bulkUpdateFeatureRequest(payload),
  });

export const useBulkDeleteFeatures = () =>
  useMutation<
    ApiResponse<BulkDeleteFeatures>,
    ApiErrorResponse,
    BulkDeleteFeaturesPayload
  >({
    mutationFn: async (payload: BulkDeleteFeaturesPayload) =>
      bulkDeleteFeatureRequest(payload),
  });

export const useFeatureInfo = (featureId: string, enabled = false) =>
  useQuery<any, ApiErrorResponse, ApiResponse<FeatureInfo>>({
    queryKey: ['feature', featureId],
    queryFn: () => getFeatureInfoRequest(featureId),
    enabled,
  });

export const useUpdateFeatureInfo = () =>
  useMutation<
    ApiResponse<FeatureInfo>,
    ApiErrorResponse,
    UpdateFeatureInfoPayload
  >({ mutationFn: updateFeatureInfoRequest });

export const useDeleteImage = () =>
  useMutation<ApiResponse<{ imageId: string }>, ApiErrorResponse, string>({
    mutationFn: async (imageId) => deleteImageRequest(imageId),
  });
