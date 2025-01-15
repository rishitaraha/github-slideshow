import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';

import { ApiErrorResponse, ApiResponse } from '../types';
import {
  apiDataResponseMapper,
  apiPayloadMapper,
  infiniteQueryPageHandler,
} from '..';
import {
  DeleteGeotagImagePayload,
  GeotagImageListPayload,
  GeotagImageListResponse,
  GeotagImageListResponseData,
  GeotagImageIdPayload,
  GeotagImageObj,
  PatchGeotagImageBulkPayload,
  PatchGeotagImagePayload,
  UploadGeotagDataPayload,
  GeotagImagePresignedUrlResponseData,
  GeotagImagePresignedUrlResponse,
  GeotagImageDownloadPayload,
} from './types';

export const uploadGeotagImageFileData = async (
  payload: UploadGeotagDataPayload,
) => {
  const mappedPayload = apiPayloadMapper(payload);
  // FormData request requires this handling.
  const formData = new FormData();

  Object.keys(mappedPayload).forEach((key) => {
    if (key !== 'column_order') {
      formData.append(key, mappedPayload[key]);
    }
  });

  formData.set('geotag_image_file', payload.geotagImageFile);

  payload.columnOrder.forEach((col) => {
    formData.append('column_order', col);
  });

  return api.post<any, ApiResponse, FormData>(
    `/processing/geotag-images/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
};

export const getGeotagImageListRequest = async (
  payload: GeotagImageListPayload,
): Promise<ApiResponse<GeotagImageListResponse>> => {
  const response: ApiResponse<GeotagImageListResponseData> = await api.get(
    `/processing/geotag-images/`,
    {
      params: apiPayloadMapper(payload),
    },
  );
  const mappedResponse: ApiResponse<GeotagImageListResponse> = {
    data: apiDataResponseMapper(response.data),
    meta: response.meta,
  };

  return mappedResponse;
};

export const patchGeotagImageRequest = async (
  payload: PatchGeotagImagePayload,
): Promise<ApiResponse<GeotagImageObj>> => {
  const { geotagImageId, ...payloadData } = payload;
  const response = await api.patch<any, ApiResponse>(
    `/processing/geotag-images/${geotagImageId}/`,
    apiPayloadMapper(payloadData),
  );
  return {
    ...response,
    data: apiDataResponseMapper(response.data.geotag_image),
  };
};

export const patchGeotagImageBulkRequest = async (
  payload: PatchGeotagImageBulkPayload,
): Promise<ApiResponse<GeotagImageListResponse>> => {
  const mappedPayload = apiPayloadMapper(payload);

  const response = await api.patch<any, ApiResponse>(
    `/processing/geotag-images/bulk/`,
    {
      ...mappedPayload,
    },
  );
  return {
    ...response,
    data: apiDataResponseMapper(response.data),
  };
};

export const getGeotagImagePresignedUrlRequest = async (
  payload: GeotagImageIdPayload,
): Promise<ApiResponse<GeotagImagePresignedUrlResponse>> => {
  const response = await api.get<
    any,
    ApiResponse<GeotagImagePresignedUrlResponseData>
  >(`/processing/geotag-images/${payload.id}/presigned-url/`);
  return {
    ...response,
    data: apiDataResponseMapper(response.data),
  };
};

const deleteGeotagImageBulkRequest = async (
  payload: DeleteGeotagImagePayload,
) => {
  const mappedPayload = apiPayloadMapper(payload);
  return api.post<any, ApiResponse>('/processing/geotag-images/delete/', {
    ...mappedPayload,
  });
};

export const downloadGeotagImageRequest = async (
  payload: GeotagImageDownloadPayload,
): Promise<Blob> => {
  const mappedPayload = apiPayloadMapper(payload);
  const params = new URLSearchParams();

  Object.keys(mappedPayload).forEach((key) => {
    if (key !== 'geotag_column_order') {
      params.append(key, mappedPayload[key]);
    }
  });

  payload.geotagColumnOrder.forEach((col) => {
    params.append('geotag_column_order', col);
  });

  const response = await api.get<any, Blob>(
    `/processing/geotag-images/download/`,
    {
      params,
    },
  );

  return new Blob([response], { type: 'text/csv' });
};

export const useUploadGeotagImageFileRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: async (payload: UploadGeotagDataPayload) =>
      uploadGeotagImageFileData(payload),
  });

export const useGetGeotagImageListRequest = (payload: GeotagImageListPayload) =>
  useQuery<ApiResponse<GeotagImageListResponse>, ApiErrorResponse>({
    queryKey: ['/processing/geotag-images/', payload],
    queryFn: () => getGeotagImageListRequest(payload),
  });

export const useInfiniteGetGeotagImageListRequest = (
  initialPayload: GeotagImageListPayload,
  enabled: boolean = true,
) =>
  useInfiniteQuery<ApiResponse<GeotagImageListResponse>, ApiErrorResponse>({
    queryKey: ['/processing/geotag-images/', initialPayload],
    queryFn: ({ pageParam }) => {
      const pageNumber = (pageParam as number) ?? 0;
      const payload = { ...initialPayload, pageNumber };
      return getGeotagImageListRequest(payload);
    },
    initialPageParam: 0,
    getNextPageParam: infiniteQueryPageHandler,
    gcTime: 0,
    enabled,
  });

export const useGetGeotagImagePresignedUrlRequest = (
  payload: GeotagImageIdPayload,
) =>
  useQuery<ApiResponse<GeotagImagePresignedUrlResponse>, ApiErrorResponse>({
    queryKey: [
      `/processing/geotag-images/${payload.id}/presigned-url/`,
      payload,
    ],
    queryFn: () => getGeotagImagePresignedUrlRequest(payload),
  });

export const usePatchGeotagImageRequest = () =>
  useMutation<ApiResponse<GeotagImageObj>, ApiErrorResponse, any>({
    mutationFn: async (payload: PatchGeotagImagePayload) =>
      patchGeotagImageRequest(payload),
  });

export const usePatchBulkGeotagImageRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: async (payload: PatchGeotagImageBulkPayload) =>
      patchGeotagImageBulkRequest(payload),
  });

export const useDeleteBulkGeotagImageRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: async (payload: DeleteGeotagImagePayload) =>
      deleteGeotagImageBulkRequest(payload),
  });
