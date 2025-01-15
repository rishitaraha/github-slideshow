import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { isNil } from 'lodash';
import { SelectedTerrainIteration, Map3DDatasetState } from './types';
import { IterationListItem, ProjectListItem, SiteListItem } from 'shared/api';
import { RootState } from 'src/app/store';

export const initialDataset: Map3DDatasetState = {
  selectedProject: null,
  activeWorkspaceSite: null,
  activeWorkspaceIteration: null,
  selectedTerrainSite: null,
  selectedTerrainIteration: null,
  canManageIterationsAndLayers: false,
};

/**
 * TODO: Use spread operator instead of Object.assign
 * https://aarav-unmanned-systems.atlassian.net/browse/RAIN-3572?atlOrigin=eyJpIjoiMjUxZDc2NTM0Mjg0NDE2YWI4OGM1NTFlNmJhMTEyZjkiLCJwIjoiaiJ9
 */
export const map3DDatasetSlice = createSlice({
  name: 'map3DDataset',
  initialState: initialDataset,
  reducers: {
    setSelectedProject: (
      state,
      action: PayloadAction<ProjectListItem | null>,
    ) => {
      state.selectedProject = isNil(action.payload)
        ? null
        : { ...state.selectedProject, ...action.payload };
    },
    setActiveWorkspaceSite: (
      state,
      action: PayloadAction<SiteListItem | null>,
    ) => {
      state.activeWorkspaceSite = isNil(action.payload)
        ? null
        : { ...state.activeWorkspaceSite, ...action.payload };
    },
    setActiveWorkspaceIteration: (
      state,
      action: PayloadAction<IterationListItem | null>,
    ) => {
      state.activeWorkspaceIteration = isNil(action.payload)
        ? null
        : { ...state.activeWorkspaceIteration, ...action.payload };
    },
    setSelectedTerrainSite: (
      state,
      action: PayloadAction<SiteListItem | null>,
    ) => {
      state.selectedTerrainSite = isNil(action.payload)
        ? null
        : {
            ...state.selectedTerrainSite,
            ...action.payload,
          };
    },
    setSelectedTerrainIteration: (
      state,
      action: PayloadAction<SelectedTerrainIteration | null>,
    ) => {
      state.selectedTerrainIteration = isNil(action.payload)
        ? null
        : {
            ...state.selectedTerrainIteration,
            ...action.payload,
          };
    },
    resetDataset: (state) => {
      Object.assign(state, initialDataset);
    },
    setCanManageIterationsAndLayers: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.canManageIterationsAndLayers = action.payload;
    },
  },
});

// Actions.
export const {
  setSelectedProject,
  setActiveWorkspaceSite,
  setActiveWorkspaceIteration,
  setSelectedTerrainSite,
  setSelectedTerrainIteration,
  resetDataset,
  setCanManageIterationsAndLayers,
} = map3DDatasetSlice.actions;

// Selector.
export const selectMap3dDataset = (state: RootState) =>
  state.map3d.map3dDataset;

// Reducer.
export const map3dDatasetReducer = map3DDatasetSlice.reducer;
