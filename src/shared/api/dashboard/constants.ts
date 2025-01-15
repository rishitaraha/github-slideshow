import { Month } from './types';

export const financialYearMonths: Month[] = [
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
  'jan',
  'feb',
  'mar',
];

export enum DashboardQueryKeys {
  ProductionKpiQueryKey = 'DashboardProductionKPI',
  PlanningKpiQueryKey = 'DashboardPlanningKPI',
  SafetyIndexQueryKey = 'SafetyIndexKPI',
  StockVolumeQueryKey = 'StockVolumeKPI',
}
