import { Modify } from '../../../shared/type-utils';

export type Month =
  | 'jan'
  | 'feb'
  | 'mar'
  | 'apr'
  | 'may'
  | 'jun'
  | 'jul'
  | 'aug'
  | 'sep'
  | 'oct'
  | 'nov'
  | 'dec';

// Monthly Kpi data types.
export type MonthlyKpi<T> = {
  [month in Month]: T;
};

/*
  Production KPI.
*/

// Production data types.
export type ProductionResponse = {
  target_overburden_production: number | null;
  target_ore_production: number | null;
  target_composite_volume: number | null;
  target_stripping_ratio: number | null;
  actual_overburden_production: number | null;
  actual_ore_production: number | null;
  actual_composite_volume: number | null;
  actual_stripping_ratio: number | null;
};

export type ProductionData = {
  targetOverburdenProduction: number | null;
  targetOreProduction: number | null;
  targetCompositeVolume: number | null;
  targetStrippingRatio: number | null;
  actualOverburdenProduction: number | null;
  actualOreProduction: number | null;
  actualCompositeVolume: number | null;
  actualStrippingRatio: number | null;
};

// Production KPI types.
export type DashboardProductionKpiResponse = {
  site_id: string;
  financial_year: string;
  financial_year_ending: number;
  monthly_production: MonthlyKpi<ProductionResponse> | null;
};

export type ProductionKpiData = {
  siteId: string;
  financialYear: string;
  financialYearEnding: number;
  monthlyProduction: MonthlyKpi<ProductionData> | null;
};

//Planning KPI.
export type TotalAreaResponse = {
  planned_and_active: number;
  planned_and_inactive: number;
  unplanned_and_active: number;
  unplanned_and_active_beyond_critical_boundary: number;
};

export type TotalAreaData = {
  plannedAndActive: number;
  plannedAndInactive: number;
  unplannedAndActive: number;
  unplannedAndActiveBeyondCriticalBoundary: number;
};

export type PlanningKpiResponse = {
  site_id: string;
  financial_year: string;
  financial_year_ending: number;
  month: string;
  total_area: TotalAreaResponse | null;
};

export type PlanningKpiData = {
  siteId: string;
  financialYear: string;
  financialYearEnding: number;
  month: string;
  totalArea: TotalAreaData | null;
};

// Safety index.
export type SafetyIndexData = {
  haulRoadDistanceUnderGradientIssue: number | null;
  haulRoadDistanceUnderWidthIssue: number | null;
};

export type SafetyIndexResponse = {
  haul_road_distance_under_gradient_issue: number | null;
  haul_road_distance_under_width_issue: number | null;
};

export type DashboardSafetyIndexKpiResponse = Modify<
  Omit<DashboardProductionKpiResponse, 'monthly_production'>,
  {
    monthly_safety_index: MonthlyKpi<SafetyIndexResponse> | null;
  }
>;

export type DashboardSafetyIndexKpiData = Modify<
  Omit<ProductionKpiData, 'monthlyProduction'>,
  {
    monthlySafetyIndex: MonthlyKpi<SafetyIndexData> | null;
  }
>;

// Stock volume.
export type StockVolumeData = {
  stockVolume: number | null;
};

export type StockVolumeResponse = {
  stock_volume: number | null;
};

export type DashboardStockVolumeKpiResponse = Modify<
  Omit<DashboardProductionKpiResponse, 'monthly_production'>,
  {
    monthly_stock_volume: MonthlyKpi<StockVolumeResponse> | null;
  }
>;

export type DashboardStockVolumeKpiData = Modify<
  Omit<ProductionKpiData, 'monthlyProduction'>,
  {
    monthlyStockVolume: MonthlyKpi<StockVolumeData> | null;
  }
>;
