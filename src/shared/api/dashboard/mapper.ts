import { apiDataResponseMapper } from '../utils';
import { financialYearMonths } from './constants';
import {
  ProductionKpiData,
  DashboardProductionKpiResponse,
  MonthlyKpi,
  ProductionData,
  ProductionResponse,
  PlanningKpiResponse,
  PlanningKpiData,
  TotalAreaResponse,
  TotalAreaData,
  SafetyIndexResponse,
  SafetyIndexData,
  DashboardSafetyIndexKpiData,
  DashboardSafetyIndexKpiResponse,
  DashboardStockVolumeKpiResponse,
  DashboardStockVolumeKpiData,
  StockVolumeResponse,
  StockVolumeData,
} from './types';

export const monthlyKpiResponseMapper = <
  Data extends object,
  Response extends object,
>(
  responseData: MonthlyKpi<Response>,
): MonthlyKpi<Data> => {
  const mappedData = {};

  financialYearMonths.forEach((month) => {
    const kpiDataOfMonth = {
      [month]: apiDataResponseMapper<Response, Data>(responseData[month]),
    };
    Object.assign(mappedData, kpiDataOfMonth);
  });

  return mappedData as MonthlyKpi<Data>;
};

/*
  Production KPI.
*/

export const productionKpiResponseMapper = (
  responseData: DashboardProductionKpiResponse,
): ProductionKpiData => {
  return {
    siteId: responseData.site_id,
    financialYear: responseData.financial_year,
    financialYearEnding: responseData.financial_year_ending,
    monthlyProduction: responseData.monthly_production
      ? monthlyKpiResponseMapper<ProductionData, ProductionResponse>(
          responseData.monthly_production,
        )
      : null,
  };
};

/*
  Planning KPI.
*/
export const planningKpiResponseMapper = (
  responseData: PlanningKpiResponse,
): PlanningKpiData => {
  return {
    siteId: responseData.site_id,
    financialYear: responseData.financial_year,
    financialYearEnding: responseData.financial_year_ending,
    month: responseData.month,
    totalArea: responseData.total_area
      ? apiDataResponseMapper<TotalAreaResponse, TotalAreaData>(
          responseData.total_area,
        )
      : null,
  };
};

/*
  Safety Index KPI.
*/
export const safetyIndexKpiResponseMapper = (
  responseData: DashboardSafetyIndexKpiResponse,
): DashboardSafetyIndexKpiData => {
  return {
    siteId: responseData.site_id,
    financialYear: responseData.financial_year,
    financialYearEnding: responseData.financial_year_ending,
    monthlySafetyIndex: responseData.monthly_safety_index
      ? monthlyKpiResponseMapper<SafetyIndexData, SafetyIndexResponse>(
          responseData.monthly_safety_index,
        )
      : null,
  };
};

/*
  Stock Volume KPI.
*/
export const stockVolumeKpiResponseMapper = (
  responseData: DashboardStockVolumeKpiResponse,
): DashboardStockVolumeKpiData => {
  return {
    siteId: responseData.site_id,
    financialYear: responseData.financial_year,
    financialYearEnding: responseData.financial_year_ending,
    monthlyStockVolume: responseData.monthly_stock_volume
      ? monthlyKpiResponseMapper<StockVolumeData, StockVolumeResponse>(
          responseData.monthly_stock_volume,
        )
      : null,
  };
};
