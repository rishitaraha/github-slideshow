import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ApiErrorResponse,
  ApiResponse,
  CogMetadataType,
  apiDataResponseMapper,
  apiPayloadMapper,
  dynamicFieldsPayloadMapper,
} from '..';

import api from '../api';
import {
  analyticsRequestPayloadMapper,
  elevationProfilePayloadMapper,
  elevationProfileResponseMapper,
  iterationListMapper,
  iterationResponseMapper,
} from './mapper';
import {
  AddIterationPayload,
  AltitudeData,
  AnalyticsRequestPayload,
  DeleteIterationFilePayload,
  DownloadElevationPathPayload,
  GenerateElevationProfilePayload,
  GetAltitudePayload,
  Iteration,
  IterationIdPayload,
  IterationList,
  IterationListRequestPayload,
  IterationMetadataPayload,
  SubtractDsmPayload,
  UpdateIterationPayload,
} from './types';

// Apis.
const getIterationsListRequest = async (
  payload: IterationListRequestPayload,
): Promise<IterationList> => {
  const dynamicFieldsPayload = dynamicFieldsPayloadMapper(payload);
  const mappedPayload = apiPayloadMapper(payload);

  const res = await api.get('/iterations/', {
    params: {
      ...mappedPayload,
      ...dynamicFieldsPayload,
    },
  });
  return iterationListMapper(res.data);
};

const deleteIterationRequest = async (
  payload: IterationIdPayload,
): Promise<ApiResponse> =>
  await api.delete(`/iterations/${payload.iterationId}/`);

export const addIterationRequest = async (
  payload: AddIterationPayload,
): Promise<ApiResponse> =>
  await api.post('/iterations/', {
    name: payload.name,
    date: payload.date,
    site: payload.site,
    info: payload.info,
  });

export const getIterationRequest = async ({
  iterationId,
  requireIterationDataset,
}): Promise<ApiResponse<Iteration>> => {
  const query_param = !requireIterationDataset
    ? '?exclude_fields=iteration_dataset'
    : '';
  const response = await api.get<ApiResponse, any>(
    `/iterations/${iterationId}/${query_param}`,
  );

  return {
    ...response,
    data: iterationResponseMapper(response),
  };
};

export const updateIterationRequest = async (
  payload: UpdateIterationPayload,
): Promise<ApiResponse> => {
  return await api.patch(`/iterations/${payload.id}/`, {
    name: payload.name,
    date: payload.date,
    info: payload.info,
  });
};

export const deleteCapturedDSMRequest = async (
  payload: DeleteIterationFilePayload,
): Promise<ApiResponse> => {
  const { iterationId } = payload;
  return await api.delete(`/iterations/${iterationId}/captured-dsm/`);
};

export const deleteOrthomosaicRequest = async (
  payload: DeleteIterationFilePayload,
): Promise<ApiResponse> => {
  const { iterationId } = payload;
  return await api.delete(`/iterations/${iterationId}/orthomosaic/`);
};

export const generateElevationProfileRequest = async (
  payload: GenerateElevationProfilePayload,
): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse, any>(
    '/iterations/elevation-profile/',
    elevationProfilePayloadMapper(payload),
  );
  response.data = elevationProfileResponseMapper(response.data);
  return response;
};

export const subtractDsmRequest = async (
  payload: SubtractDsmPayload,
): Promise<ApiResponse<Iteration>> => {
  const data = apiPayloadMapper(payload);

  const response = await api.post<ApiResponse<Iteration>, any>(
    '/iterations/subtract-dsm/',
    data,
  );
  return {
    ...response,
    data: apiDataResponseMapper(response.data),
  };
};

export const downloadElevationPathRequest = async (
  payload: DownloadElevationPathPayload,
): Promise<Blob> => {
  return await api.get(`/iterations/download-elevation-path/`, {
    params: apiPayloadMapper(payload),
    responseType: 'blob',
  });
};

export const getCogMetadataRequest = async (
  payload: IterationMetadataPayload,
): Promise<CogMetadataType> => {
  const response = await api.get(
    `iterations/${payload.iterationId}/${payload.fileType}/metadata/`,
  );
  return response.data;
};

export const sendAnalyticsRequest = async (
  payload: AnalyticsRequestPayload,
): Promise<ApiResponse> => {
  const { iterationId } = payload;

  return await api.post<ApiResponse, any>(
    `/iterations/${iterationId}/generate-analytics/`,
    analyticsRequestPayloadMapper(payload),
  );
};

export const getAltitudeRequest = async (
  payload: GetAltitudePayload,
): Promise<ApiResponse<AltitudeData>> => {
  return await api.get(`iterations/altitude/`, {
    params: payload,
    paramsSerializer: {
      indexes: true,
    },
  });
};

// Hooks.
export const useIterationsList = (
  payload: IterationListRequestPayload,
  enabled = true,
) =>
  useQuery<IterationList, ApiErrorResponse>({
    queryKey: ['iterations', payload],
    queryFn: () => getIterationsListRequest(payload),
    enabled,
  });

export const useDeleteIteration = () =>
  useMutation<ApiResponse, ApiErrorResponse, IterationIdPayload>({
    mutationFn: async (payload: IterationIdPayload) =>
      deleteIterationRequest(payload),
  });

export const useAddIterationRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: (payload: AddIterationPayload) => addIterationRequest(payload),
  });

export const useIteration = (
  iterationId: string,
  requireIterationDataset: boolean = false,
  enabled: boolean = false,
) =>
  useQuery<any, ApiErrorResponse, ApiResponse<Iteration>>({
    queryKey: ['iteration', iterationId, requireIterationDataset],
    queryFn: () =>
      getIterationRequest({ iterationId, requireIterationDataset }),
    enabled,
  });

export const useUpdateIteration = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: updateIterationRequest,
  });

export const useDeleteCapturedDSM = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: deleteCapturedDSMRequest,
  });

export const useDeleteOrthomosaic = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: deleteOrthomosaicRequest,
  });

export const useGenerateElevationProfile = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: generateElevationProfileRequest,
  });

export const useSubtractDsm = () =>
  useMutation<ApiResponse<Iteration>, ApiErrorResponse, any>({
    mutationFn: subtractDsmRequest,
  });

export const useDownloadElevationReport = () =>
  useMutation<Blob, ApiErrorResponse, DownloadElevationPathPayload>({
    mutationFn: downloadElevationPathRequest,
  });

// TODO: Remove after DSM as layer.
export const useCogMetadata = (
  payload: IterationMetadataPayload,
  enabled = false,
  queryKey = '',
) =>
  useQuery<CogMetadataType, ApiErrorResponse>({
    queryKey: [
      `iterations/${payload.iterationId}/${payload.fileType}/metadata`,
      payload,
      queryKey,
    ],
    queryFn: () => getCogMetadataRequest(payload),
    enabled,
    staleTime: Infinity,
  });

export const useAnalyticsRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: sendAnalyticsRequest,
  });

export const useAltitude = (payload: GetAltitudePayload, enabled) =>
  useQuery<ApiResponse<AltitudeData>, ApiErrorResponse>({
    queryKey: [`iterations/altitude`, payload],
    queryFn: () => getAltitudeRequest(payload),
    enabled,
  });
