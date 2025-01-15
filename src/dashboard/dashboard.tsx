import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';

import { ComponentRoute } from '../shared/types';
import { DashboardMap, KeyPerformanceIndicator } from './components';

import { resetDataset, selectDashboardDataset } from './dashboard-slices';

export const Dashboard: React.FC & ComponentRoute = () => {
  // Selectors
  const dataset = useAppSelector(selectDashboardDataset);

  // Hooks.
  const dispatch = useAppDispatch();

  // useEffects.
  useEffect(() => {
    // Reset dataset and destroy viewer on unmount.
    return () => {
      dataset.cesiumProxy?.destroy();
      dispatch(resetDataset());
    };
  }, []);

  // Render.
  return (
    <div className="dashboard">
      {/* Map */}
      <DashboardMap />

      {/* Key performance indicators (KPIs) */}
      <KeyPerformanceIndicator />
    </div>
  );
};

Dashboard.route = '/dashboard';
