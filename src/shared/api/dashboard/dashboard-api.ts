import { useQuery } from '@tanstack/react-query';
import { ApiErrorResponse } from '../types';
import { ApiResponse, DashboardQueryKeys } from '..';
import api from '../api';
import {
  DashboardSafetyIndexKpiData,
  DashboardStockVolumeKpiData,
  PlanningKpiData,
  ProductionKpiData,
} from './types';
import {
  planningKpiResponseMapper,
  productionKpiResponseMapper,
  safetyIndexKpiResponseMapper,
  stockVolumeKpiResponseMapper,
} from './mapper';

// APIs.
export const getProductionKpiRequest = async (
  siteId: string,
  financialYearEnding: number,
): Promise<ApiResponse<ProductionKpiData>> => {
  const response = await api.get<any, ApiResponse>(
    '/dashboard/production-kpi/',
    {
      params: {
        site_id: siteId,
        financial_year_ending: financialYearEnding,
      },
    },
  );
  response.data = productionKpiResponseMapper(response.data);
  return response;
};

export const getPlanningKpiRequest = async (
  siteId: string,
  financialYearEnding: number,
  month: number,
): Promise<ApiResponse<PlanningKpiData>> => {
  const response = await api.get<any, ApiResponse>('/dashboard/planning-kpi/', {
    params: {
      site_id: siteId,
      financial_year_ending: financialYearEnding,
      month,
    },
  });
  response.data = planningKpiResponseMapper(response.data);

  return response;
};

export const getSafetyIndexKpiRequest = async (
  siteId: string,
  financialYearEnding: number,
): Promise<ApiResponse<DashboardSafetyIndexKpiData>> => {
  const response = await api.get<any, ApiResponse>(
    '/dashboard/safety-index-kpi/',
    {
      params: {
        site_id: siteId,
        financial_year_ending: financialYearEnding,
      },
    },
  );
  response.data = safetyIndexKpiResponseMapper(response.data);
  return response;
};

export const getStockVolumeKpiRequest = async (
  siteId: string,
  financialYearEnding: number,
): Promise<ApiResponse<DashboardStockVolumeKpiData>> => {
  const response = await api.get<any, ApiResponse>(
    '/dashboard/stock-volume-kpi/',
    {
      params: {
        site_id: siteId,
        financial_year_ending: financialYearEnding,
      },
    },
  );
  response.data = stockVolumeKpiResponseMapper(response.data);
  return response;
};

// Hooks.
export const useProductionKPI = (siteId: string, financialYearEnding: number) =>
  useQuery<any, ApiErrorResponse, ApiResponse<ProductionKpiData>>({
    queryKey: [
      DashboardQueryKeys.ProductionKpiQueryKey,
      `Production-KPI-${siteId}-${financialYearEnding}`,
    ],
    queryFn: () => getProductionKpiRequest(siteId, financialYearEnding),
  });

export const usePlanningKPI = (
  siteId: string,
  financialYearEnding: number,
  month: number,
) =>
  useQuery<any, ApiErrorResponse, ApiResponse<PlanningKpiData>>({
    queryKey: [
      DashboardQueryKeys.PlanningKpiQueryKey,
      `Planning-KPI-${siteId}-${financialYearEnding}-${month}`,
    ],
    queryFn: () => getPlanningKpiRequest(siteId, financialYearEnding, month),
  });

export const useSafetyIndexKPI = (
  siteId: string,
  financialYearEnding: number,
) =>
  useQuery<any, ApiErrorResponse, ApiResponse<DashboardSafetyIndexKpiData>>({
    queryKey: [
      DashboardQueryKeys.SafetyIndexQueryKey,
      `Safety-Index-KPI-${siteId}-${financialYearEnding}`,
    ],
    queryFn: () => getSafetyIndexKpiRequest(siteId, financialYearEnding),
  });

export const useStockVolumeKPI = (
  siteId: string,
  financialYearEnding: number,
) =>
  useQuery<any, ApiErrorResponse, ApiResponse<DashboardStockVolumeKpiData>>({
    queryKey: [
      DashboardQueryKeys.StockVolumeQueryKey,
      `Stock-Volume-KPI-${siteId}-${financialYearEnding}`,
    ],
    queryFn: () => getStockVolumeKpiRequest(siteId, financialYearEnding),
  });
