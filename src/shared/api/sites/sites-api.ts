import { useMutation, useQuery } from '@tanstack/react-query';
import { snakeCase } from 'lodash';
import { ApiErrorResponse } from '../types';
import { ApiResponse, apiPayloadMapper, dynamicFieldsPayloadMapper } from '..';
import api from '../api';
import {
  addSitePayloadMapper,
  updateSitePayloadMapper,
  siteListResponseMapper,
  sitePermissionPayloadMapper,
  siteResponseMapper,
  uploadProductionTargetResponseMapper,
  uploadSafetyIndexResponseMapper,
  uploadStockVolumeResponseMapper,
} from './mapper';
import {
  SiteListPayload,
  SitePermissionPayload,
  UploadProductionKpiData,
  UploadKpiPayload,
  UploadSafetyIndexKpiData,
  UploadStockVolumeKpiData,
} from './types';
import {
  DeleteSiteFilePayload,
  AddSitePayload,
  RenameSitePayload,
  SiteIdPayload,
  SitePayload,
  SiteList,
} from '.';

// Apis.
export const addSiteRequest = async (
  payload: AddSitePayload,
): Promise<ApiResponse> =>
  await api.post('/sites/', addSitePayloadMapper(payload));

export const getSiteListRequest = async (
  payload: SiteListPayload,
): Promise<SiteList> => {
  const dynamicFieldsPayload = dynamicFieldsPayloadMapper(payload);
  const mappedPayload = apiPayloadMapper(payload);

  const res = await api.get('/sites/', {
    params: {
      ...mappedPayload,
      ...dynamicFieldsPayload,
    },
  });
  return siteListResponseMapper(res.data);
};

export const getSiteRequest = async ({
  queryKey,
}): Promise<ApiResponse<SitePayload>> => {
  const [, id] = queryKey;
  const res = await api.get<ApiResponse, any>(`/sites/${id.siteId}/`);
  res.data = siteResponseMapper(res);
  return res;
};

export const updateSiteRequest = async (
  payloadData: RenameSitePayload,
): Promise<ApiResponse> =>
  await api.patch(
    `sites/${payloadData.siteId}/`,
    updateSitePayloadMapper(payloadData.payload),
  );

export const deleteSiteRequest = async (
  payload: SiteIdPayload,
): Promise<ApiResponse> => await api.delete(`/sites/${payload.siteId}/`);

export const deleteBaseDSMRequest = async (
  payload: DeleteSiteFilePayload,
): Promise<ApiResponse> => {
  const { siteId } = payload;
  return await api.delete(`/sites/${siteId}/base-dsm/`);
};
export const deleteLegendImageRequest = async (
  payload: DeleteSiteFilePayload,
): Promise<ApiResponse> => {
  const { siteId } = payload;
  return await api.delete(`/sites/${siteId}/legend-image/`);
};

export const sitePermissionRequest = async (
  payload: SitePermissionPayload,
): Promise<ApiResponse> =>
  await api.post(
    `/sites/${payload.id}/permission/`,
    sitePermissionPayloadMapper(payload),
  );

export const uploadProductionTargetRequest = async (
  payload: UploadKpiPayload,
): Promise<ApiResponse<UploadProductionKpiData>> => {
  const formDataPayload = new FormData();
  formDataPayload.set(
    'production_kpi_file',
    payload.csvFile,
    payload.csvFile.name,
  );

  const response = await api.post<any, ApiResponse>(
    `/sites/${payload.siteId}/production-kpi/`,
    formDataPayload,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  response.data = uploadProductionTargetResponseMapper(response.data);

  return response;
};

export const uploadSafetyIndexRequest = async (
  payload: UploadKpiPayload,
): Promise<ApiResponse<UploadSafetyIndexKpiData>> => {
  const formDataPayload = new FormData();
  formDataPayload.set(
    'safety_index_kpi_file',
    payload.csvFile,
    payload.csvFile.name,
  );

  const response = await api.post<any, ApiResponse>(
    `/sites/${payload.siteId}/safety-index-kpi/`,
    formDataPayload,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  response.data = uploadSafetyIndexResponseMapper(response.data);

  return response;
};

export const uploadStockVolumeRequest = async (
  payload: UploadKpiPayload,
): Promise<ApiResponse<UploadStockVolumeKpiData>> => {
  const formDataPayload = new FormData();
  formDataPayload.set(
    'stock_volume_kpi_file',
    payload.csvFile,
    payload.csvFile.name,
  );

  const response = await api.post<any, ApiResponse>(
    `/sites/${payload.siteId}/stock-volume-kpi/`,
    formDataPayload,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  response.data = uploadStockVolumeResponseMapper(response.data);

  return response;
};

export const getFinancialYearsRequest = async (siteId: string) =>
  await api.get<any, ApiResponse<string[]>>(
    `/sites/${siteId}/financial-years/`,
  );

export const downloadKpiTemplate = async (
  payload: string,
): Promise<ApiResponse> => {
  return await api.get<any, ApiResponse>(
    `/sites/kpi-template/${snakeCase(payload)}/`,
    {
      responseType: 'blob',
    },
  );
};

// Hooks.
export const useAddSite = () =>
  useMutation<ApiResponse, ApiErrorResponse, AddSitePayload>({
    mutationFn: async (payload: AddSitePayload) => addSiteRequest(payload),
  });

export const useSiteList = (payload: SiteListPayload, enabled = true) =>
  useQuery<SiteList, ApiErrorResponse>({
    queryKey: ['sites', payload],
    queryFn: () => getSiteListRequest(payload),
    enabled,
  });

export const useSite = (enabled = true, payload: SiteIdPayload) =>
  useQuery<any, ApiErrorResponse, ApiResponse<SitePayload>>({
    queryKey: [`sites`, payload],
    queryFn: getSiteRequest,
    enabled,
  });

export const useUpdateSite = () =>
  useMutation<ApiResponse, ApiErrorResponse, RenameSitePayload>({
    mutationFn: async (payload: RenameSitePayload) =>
      updateSiteRequest(payload),
  });

export const useDeleteSite = () =>
  useMutation<ApiResponse, ApiErrorResponse, SiteIdPayload>({
    mutationFn: async (payload: SiteIdPayload) => deleteSiteRequest(payload),
  });

export const useDeleteBaseDSM = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: deleteBaseDSMRequest,
  });

export const useDeleteSiteLegendImage = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: deleteLegendImageRequest,
  });

export const useSitePermissionRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: async (payload: SitePermissionPayload) =>
      sitePermissionRequest(payload),
  });

export const useUploadProductionTarget = () =>
  useMutation<
    ApiResponse<UploadProductionKpiData>,
    ApiErrorResponse,
    UploadKpiPayload
  >({ mutationFn: uploadProductionTargetRequest });

export const useUploadSafteyIndex = () =>
  useMutation<
    ApiResponse<UploadSafetyIndexKpiData>,
    ApiErrorResponse,
    UploadKpiPayload
  >({ mutationFn: uploadSafetyIndexRequest });

export const useUploadStockVolume = () =>
  useMutation<
    ApiResponse<UploadStockVolumeKpiData>,
    ApiErrorResponse,
    UploadKpiPayload
  >({ mutationFn: uploadStockVolumeRequest });

export const useSiteFinancialYears = (siteId: string, enabled = true) =>
  useQuery<any, ApiErrorResponse, ApiResponse<string[]>>({
    queryKey: [`siteFinancialYears-${siteId}`],
    queryFn: () => getFinancialYearsRequest(siteId),
    enabled,
  });

export const useDownloadKpiTemplate = () =>
  useMutation<any, ApiErrorResponse, string>({
    mutationFn: async (payload: string) => downloadKpiTemplate(payload),
  });
