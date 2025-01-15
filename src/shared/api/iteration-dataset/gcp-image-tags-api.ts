import { useMutation } from '@tanstack/react-query';
import { ApiErrorResponse, ApiResponse } from '../types';
import { apiDataResponseMapper, apiPayloadMapper } from '../utils';
import api from '../api';
import {
  GcpIdPayload,
  TagGcpImagePayload,
  TaggedGcpImagesResponse,
} from './types';

export const updateGcpImageTagsRequest = async (
  payload: TagGcpImagePayload,
): Promise<ApiResponse<TagGcpImagePayload>> => {
  const response = await api.put<any, ApiResponse<TaggedGcpImagesResponse>>(
    `processing/gcp-image-tags/update/`,
    apiPayloadMapper(payload),
  );
  return {
    ...response,
    data: apiDataResponseMapper<TaggedGcpImagesResponse, TagGcpImagePayload>(
      response.data,
    ),
  };
};

export const deleteGcpImageTagsRequest = async (
  payload: GcpIdPayload,
): Promise<ApiResponse<TagGcpImagePayload>> =>
  await api.delete<any, ApiResponse>(
    `processing/gcp-image-tags/delete/?gcp=${payload.gcpId}`,
    apiPayloadMapper(payload),
  );

export const useUpdateGcpTags = () =>
  useMutation<
    ApiResponse<TagGcpImagePayload>,
    ApiErrorResponse,
    TagGcpImagePayload
  >({
    mutationFn: async (payload: TagGcpImagePayload) =>
      updateGcpImageTagsRequest(payload),
  });

export const useDeleteGcpImageTags = () =>
  useMutation<ApiResponse, ApiErrorResponse, GcpIdPayload>({
    mutationFn: async (payload: GcpIdPayload) =>
      deleteGcpImageTagsRequest(payload),
  });
