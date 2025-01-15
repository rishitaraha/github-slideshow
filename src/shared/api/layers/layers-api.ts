import { useMutation, useQuery } from '@tanstack/react-query';
import { omit } from 'lodash';
import {
  ApiResponse,
  LayerQueryKey,
  apiDataResponseMapper,
  apiPayloadMapper,
  dynamicFieldsPayloadMapper,
} from '..';
import api from '../api';
import { ApiErrorResponse } from '../types';
import {
  addLayerPayloadMapper,
  contourPayloadMapper,
  layerListResponseMapper,
  layerResponseMapper,
  slopeMapPayloadMapper,
  updateLayerPayloadMapper,
} from './mapper';
import {
  AddLayerPayload,
  ClampToTerrainPayloadType,
  ContourPayloadType,
  ContourResponseType,
  DeleteLayerPayload,
  DownloadVectorLayerPayloadType,
  AddLayerResponse,
  LayerListPayload,
  LayerListResponse,
  LayerResponse,
  SlopeMapPayloadType,
  SlopeMapResponseType,
  UpdateLayer,
  UpdateLayerPayload,
} from './types';

// Apis.
export const getLayerListRequest = async (
  payload: LayerListPayload,
): Promise<LayerListResponse> => {
  const dynamicFieldsPayload = dynamicFieldsPayloadMapper(payload);
  const mappedPayload = apiPayloadMapper(payload);
  const res = await api.get('layers/', {
    params: { ...mappedPayload, ...dynamicFieldsPayload },
  });
  return layerListResponseMapper(res.data);
};

export const getLayerRequest = async (
  layerId: string,
): Promise<LayerResponse> => {
  const res = await api.get(`layers/${layerId}/`);
  return layerResponseMapper(res.data);
};

export const addLayerRequest = async (
  payload: AddLayerPayload,
): Promise<ApiResponse<AddLayerResponse>> => {
  const formData = addLayerPayloadMapper(payload);

  const response = await api.post<any, ApiResponse<any>>('layers/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  response.data = apiDataResponseMapper(response.data);

  return response;
};

export const deleteLayerRequest = async (
  payload: DeleteLayerPayload,
): Promise<ApiResponse> => await api.delete(`/layers/${payload.id}/`);

export const updateLayerRequest = async (
  layerId: string,
  payload: UpdateLayerPayload,
): Promise<ApiResponse<LayerResponse>> => {
  const response = await api.patch<ApiResponse, any>(
    `layers/${layerId}/`,
    updateLayerPayloadMapper(payload),
  );

  response.data = layerResponseMapper(response.data);
  return response;
};

export const generateContourRequest = async (
  contourPayload: ContourPayloadType,
): Promise<ApiResponse<ContourResponseType>> => {
  const response = await api.post<ApiResponse, any>(
    '/layers/generate-contour/',
    contourPayloadMapper(contourPayload),
  );
  response.data = apiDataResponseMapper(response.data);

  return response;
};

export const downloadVectorLayer = async (
  payload: DownloadVectorLayerPayloadType,
): Promise<Blob> => {
  return await api.get(`layers/${payload.layerId}/download/`, {
    responseType: 'blob',
    params: {
      response_format: payload.responseFormat,
    },
  });
};

export const generateSlopeMapRequest = async (
  slopeMapPayload: SlopeMapPayloadType,
): Promise<ApiResponse<SlopeMapResponseType>> => {
  const response = await api.post<ApiResponse, any>(
    '/layers/generate-slope-map/',
    slopeMapPayloadMapper(slopeMapPayload),
  );
  response.data = apiDataResponseMapper(response.data);
  return response;
};

export const clampToTerrainRequest = async (
  payload: ClampToTerrainPayloadType,
): Promise<ApiResponse> => {
  return await api.post<ApiResponse, any>(
    `/layers/${payload.id}/clamp-to-terrain/`,
  );
};

// Hooks.
export const useLayerList = (
  payload: LayerListPayload,
  enabled: boolean = true,
) =>
  useQuery<LayerListResponse, ApiErrorResponse>({
    queryKey: [LayerQueryKey.Layers, omit(payload, ['requestedLayerId'])],
    queryFn: () => getLayerListRequest(payload),
    enabled,
  });

export const useLayer = (
  layerId: string,
  enabled?: boolean,
  queryKey?: string,
) =>
  useQuery<LayerResponse, ApiErrorResponse>({
    queryKey: [
      'layer',
      `${LayerQueryKey.Layers}/${layerId}`,
      layerId,
      queryKey,
    ],
    queryFn: () => getLayerRequest(layerId),
    enabled,
  });

export const useAddLayer = () =>
  useMutation<ApiResponse<AddLayerResponse>, ApiErrorResponse, AddLayerPayload>(
    {
      mutationFn: addLayerRequest,
    },
  );

export const useDeleteLayer = () =>
  useMutation<ApiResponse, ApiErrorResponse, DeleteLayerPayload>({
    mutationFn: deleteLayerRequest,
  });

export const useUpdateLayer = () =>
  useMutation<ApiResponse<LayerResponse>, ApiErrorResponse, UpdateLayer>({
    mutationFn: async (payload: UpdateLayer) =>
      updateLayerRequest(payload.id, payload.data),
  });

export const useGenerateContour = () =>
  useMutation<
    ApiResponse<ContourResponseType>,
    ApiErrorResponse,
    ContourPayloadType
  >({ mutationFn: generateContourRequest });

export const useDownloadVectorLayer = () =>
  useMutation<Blob, ApiErrorResponse, DownloadVectorLayerPayloadType>({
    mutationFn: downloadVectorLayer,
  });

export const useGenerateSlopeMap = () =>
  useMutation<
    ApiResponse<SlopeMapResponseType>,
    ApiErrorResponse,
    SlopeMapPayloadType
  >({ mutationFn: generateSlopeMapRequest });

export const useClampToTerrain = () =>
  useMutation<ApiResponse, ApiErrorResponse, ClampToTerrainPayloadType>({
    mutationFn: clampToTerrainRequest,
  });
