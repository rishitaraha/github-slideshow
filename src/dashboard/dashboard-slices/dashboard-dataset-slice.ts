import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SelectOption } from '@aus-platform/design-system';
import { SiteListItem } from '../../shared/api';
import { CesiumProxy } from '../../shared/cesium';
import { refetchDashboardKPIs } from '../helpers';
import { initialDashboardDatasetState } from './constants';
import { RootState } from 'app/store';

export const dashboardDatasetSlice = createSlice({
  name: 'dashboardDatasetSlice',
  initialState: initialDashboardDatasetState,
  reducers: {
    setProject: (state, action: PayloadAction<SelectOption>) => {
      Object.assign(state, {
        project: action.payload,
        site: null,
      });
    },

    setSite: (state, action: PayloadAction<SelectOption<SiteListItem>>) => {
      Object.assign(state, { site: action.payload });
    },

    setCesiumProxy: (state, action: PayloadAction<CesiumProxy>) => {
      Object.assign(state, { cesiumProxy: action.payload });
    },

    setUserSiteManagePermission: (state, action: PayloadAction<boolean>) => {
      Object.assign(state, { userHasManageSitePermission: action.payload });
    },

    resetDataset: (state) => {
      Object.assign(state, initialDashboardDatasetState);
    },

    refetchKPIs: refetchDashboardKPIs,
  },
});

// Actions.
export const {
  setProject,
  setSite,
  setCesiumProxy,
  setUserSiteManagePermission,
  resetDataset,
  refetchKPIs,
} = dashboardDatasetSlice.actions;

// Selector.
export const selectDashboardDataset = (state: RootState) =>
  state.dashboard.dashboardDataset;

//  Reducer.
export const dashboardDatasetReducer = dashboardDatasetSlice.reducer;
