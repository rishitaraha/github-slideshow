import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../api';
import { ApiErrorResponse, ApiResponse } from '../../types';
import {
  addHeapBoundaryPayloadMapper,
  heapListResponseMapper,
  heapResponseMapper,
  updateHeapPayloadMapper,
} from './mapper';
import {
  AddHeapBoundaryPayload,
  DownloadVolumeReportPayload,
  HeapIdPayload,
  HeapListResponseDataObj,
  HeapObj,
  HeapResponseDataTypeObj,
} from './types';

// Apis.
export const getHeapListRequest = async (
  payload: HeapIdPayload,
): Promise<HeapListResponseDataObj> => {
  const res = await api.get('/iterations/heap-boundary/', {
    params: {
      iteration_id: payload.id,
    },
  });
  res.data = heapListResponseMapper(res.data);
  return res;
};

export const deleteHeapRequest = async (
  payload: HeapIdPayload,
): Promise<ApiResponse> =>
  await api.delete(`/iterations/heap-boundary/${payload.id}/`);

export const addHeapRequest = async (
  payload: AddHeapBoundaryPayload,
): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse, any>(
    '/iterations/heap-boundary/',
    addHeapBoundaryPayloadMapper(payload),
  );
  response.data = heapResponseMapper(response.data);
  return response;
};

export const getHeapRequest = async ({
  queryKey,
}): Promise<ApiResponse<HeapResponseDataTypeObj>> => {
  const [, heapId] = queryKey;
  const res = await api.get<ApiResponse, any>(
    `/iterations/heap-boundary/${heapId}/`,
  );
  res.data = heapResponseMapper(res.data);
  return res;
};

export const downloadHeapRequest = async (
  heapId: string,
): Promise<ApiResponse> =>
  await api.get<ApiResponse, any>(
    `/iterations/heap-boundary/${heapId}/download/`,
    {
      responseType: 'blob',
    },
  );

export const updateHeapRequest = async (
  payload: HeapObj,
): Promise<ApiResponse> =>
  await api.patch(
    `/iterations/heap-boundary/${payload.id}/`,
    updateHeapPayloadMapper(payload),
  );

export const recalculateHeapVolumeRequest = async (
  payload: HeapIdPayload,
): Promise<ApiResponse> => {
  const res = await api.post<ApiResponse, any>(
    `/iterations/heap-boundary/${payload.id}/recalculate-volume/`,
  );
  res.data = heapResponseMapper(res.data);
  return res;
};

export const downloadVolumeReportRequest = async (
  payload: DownloadVolumeReportPayload,
): Promise<Blob> =>
  await api.get(
    `/iterations/heap-boundary/volume-report/?ids=${payload.heapIds}&response_format=${payload.responseFormat}`,
    {
      responseType: 'blob',
    },
  );

// Hooks.
export const useHeapList = (payload: HeapIdPayload, enabled = true) =>
  useQuery<HeapListResponseDataObj, ApiErrorResponse>({
    queryKey: ['iterations', payload],
    queryFn: () => getHeapListRequest(payload),
    enabled,
  });

export const useHeap = (heapId: string, enabled?: boolean) =>
  useQuery<any, ApiErrorResponse, ApiResponse<HeapResponseDataTypeObj>>({
    queryKey: ['/iterations/heap-boundary/', heapId],
    queryFn: getHeapRequest,
    enabled,
  });

export const useDownloadHeap = () =>
  useMutation<any, ApiErrorResponse, string>({
    mutationFn: downloadHeapRequest,
  });

export const useAddHeap = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: addHeapRequest,
  });

export const useUpdateHeap = () =>
  useMutation<ApiResponse, ApiErrorResponse, HeapObj>({
    mutationFn: async (payload: HeapObj) => updateHeapRequest(payload),
  });

export const useDeleteHeap = () =>
  useMutation<ApiResponse, ApiErrorResponse, HeapIdPayload>({
    mutationFn: deleteHeapRequest,
  });

export const useRecalculateHeapVolume = () =>
  useMutation<ApiResponse, ApiErrorResponse, HeapIdPayload>({
    mutationFn: recalculateHeapVolumeRequest,
  });

export const useDownloadVolumeReport = () =>
  useMutation<Blob, ApiErrorResponse, DownloadVolumeReportPayload>({
    mutationFn: downloadVolumeReportRequest,
  });
