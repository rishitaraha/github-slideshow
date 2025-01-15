import { combineReducers } from '@reduxjs/toolkit';
import { dashboardDatasetReducer } from './dashboard-slices';

export const dashboardReducers = combineReducers({
  dashboardDataset: dashboardDatasetReducer,
});
