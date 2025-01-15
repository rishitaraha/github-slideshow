import { DashboardQueryKeys, queryClient } from '../shared/api';

/**
 * By default exact is false in react query.
 * Thus it matches the query keys which partially match as well.
 */
export const refetchDashboardKPIs = () => {
  queryClient.refetchQueries({
    queryKey: [DashboardQueryKeys.ProductionKpiQueryKey],
    exact: true,
  });
  queryClient.refetchQueries({
    queryKey: [DashboardQueryKeys.PlanningKpiQueryKey],
    exact: true,
  });
  queryClient.refetchQueries({
    queryKey: [DashboardQueryKeys.SafetyIndexQueryKey],
    exact: true,
  });
  queryClient.refetchQueries({
    queryKey: [DashboardQueryKeys.StockVolumeQueryKey],
    exact: true,
  });
};
