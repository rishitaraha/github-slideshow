import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api';
import { ApiErrorResponse, ApiResponse } from '../../types';
import {
  apiDataResponseMapper,
  apiPayloadMapper,
  dynamicFieldsPayloadMapper,
} from '../../utils';
import {
  AddHaulRoadPayload,
  HaulRoad,
  HaulRoadAttribute,
  HaulRoadAttributeResponseData,
  HaulRoadList,
  HaulRoadListResponseData,
  HaulRoadResponseData,
  HaulRoadsPayload,
  HaulRoadTypeList,
  HaulRoadTypeResponseData,
} from './types';

// Apis.
export const getHaulRoads = async (
  payload: HaulRoadsPayload,
): Promise<HaulRoadList> => {
  const dynamicFieldsPayload = dynamicFieldsPayloadMapper(payload);
  const mappedPayload = apiPayloadMapper(payload);
  const response = await api.get<
    HaulRoadListResponseData,
    ApiResponse<HaulRoadListResponseData>
  >('/workspaces/analytics/haul-roads/', {
    params: { ...mappedPayload, ...dynamicFieldsPayload },
  });
  return apiDataResponseMapper(response.data);
};

export const getHaulRoad = async (haulRoadId: string): Promise<HaulRoad> => {
  const response = await api.get<
    HaulRoadResponseData,
    ApiResponse<HaulRoadResponseData>
  >(`/workspaces/analytics/haul-roads/${haulRoadId}/`);
  return apiDataResponseMapper(response.data);
};

export const getHaulRoadType = async (): Promise<HaulRoadTypeList> => {
  const response = await api.get<
    HaulRoadTypeResponseData,
    ApiResponse<HaulRoadListResponseData>
  >('/workspaces/analytics/haul-roads/types/');
  return response.data;
};

export const addHaulRoadRequest = async (
  payload: AddHaulRoadPayload,
): Promise<ApiResponse> => {
  const mappedPayload = apiPayloadMapper(payload);
  const response = api.post<any, ApiResponse>(
    '/workspaces/analytics/haul-roads/',
    mappedPayload,
  );
  return response;
};

export const getHaulRoadAttributes = async (
  haulRoadId: string,
): Promise<HaulRoadAttribute[]> => {
  const response = await api.get<
    HaulRoadAttributeResponseData,
    ApiResponse<HaulRoadAttributeResponseData>
  >(`/workspaces/analytics/haul-roads/${haulRoadId}/attributes/`);
  return apiDataResponseMapper(response.data);
};

export const deleteHaulRoadRequest = async (haulRoadId: string) => {
  const response = await api.delete<any, ApiResponse>(
    `/workspaces/analytics/haul-roads/${haulRoadId}/`,
  );
  return response;
};

// Hooks.
export const useHaulRoads = (payload: HaulRoadsPayload) =>
  useQuery<HaulRoadList, ApiErrorResponse>({
    queryKey: [payload],
    queryFn: () => getHaulRoads(payload),
  });

export const useHaulRoad = (haulRoadId: string) =>
  useQuery<HaulRoad, ApiErrorResponse>({
    queryKey: [haulRoadId],
    queryFn: () => getHaulRoad(haulRoadId),
  });

export const useHaulRoadTypes = () =>
  useQuery<HaulRoadTypeList, ApiErrorResponse>({
    queryKey: ['haulRoadTypes'],
    queryFn: () => getHaulRoadType(),
  });

export const useAddHaulRoad = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: async (payload: AddHaulRoadPayload) =>
      addHaulRoadRequest(payload),
  });

export const useHaulRoadAttributes = (haulRoadId: string) =>
  useQuery<any[], ApiErrorResponse>({
    queryKey: ['haulRoadAttributes', haulRoadId],
    queryFn: () => getHaulRoadAttributes(haulRoadId),
  });

export const useDownloadHaulRoadAttributes = () => {
  return useMutation<any, ApiErrorResponse, string>({
    mutationFn: async (haulRoadId: string) => {
      const response = await api.get<ApiResponse, any>(
        `/workspaces/analytics/haul-roads/${haulRoadId}/attributes/download/`,
        {
          responseType: 'blob',
        },
      );
      return response;
    },
  });
};

export const useDeleteHaulRoads = () =>
  useMutation<any, ApiErrorResponse, string>({
    mutationFn: async (haulRoadId: string) => deleteHaulRoadRequest(haulRoadId),
  });
