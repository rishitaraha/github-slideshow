import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SceneMode } from 'cesium';
import { RootState } from '../../../app/store';
import { CesiumProxy } from '../../../shared/cesium';
import { MapTool } from '../../components/map-3d-container/map-3d-tools';
import { map3DInitialState } from './constants';

export const map3DSlice = createSlice({
  name: 'map3D',
  initialState: map3DInitialState,
  reducers: {
    setCurrentSceneMode: (state, action: PayloadAction<SceneMode>) => {
      Object.assign(state, { currentSceneMode: action.payload });
    },
    setCesiumProxy: (state, action: PayloadAction<CesiumProxy | null>) => {
      Object.assign(state, { cesiumProxy: action.payload });
    },
    destroyMeasureTool: (state) => {
      Object.assign(state, {
        measureTool: null,
      });
    },
    setCurrentActiveMapTool: (state, action: PayloadAction<MapTool>) => {
      Object.assign(state, { currentActiveMapTool: action.payload });
    },
    destroyFeatureInfoTool: (state) => {
      Object.assign(state, {
        featureInfoTool: null,
      });
    },
    resetMap3D: (state) => {
      state.cesiumProxy?.destroy();
      Object.assign(state, map3DInitialState);
    },
    setIsElevationProfileSelectLayersActive: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      Object.assign(state, {
        isElevationProfileSelectLayersActive: action.payload,
      });
    },
    setIsWorkspaceLoading: (state, action: PayloadAction<boolean>) => {
      state.isWorkspaceLoading = action.payload;
    },
  },
});

// Actions.
export const {
  setCesiumProxy,
  resetMap3D,
  destroyMeasureTool,
  setCurrentActiveMapTool,
  destroyFeatureInfoTool,
  setCurrentSceneMode,
  setIsElevationProfileSelectLayersActive,
  setIsWorkspaceLoading,
} = map3DSlice.actions;

// Selector.
export const selectMap3DState = (state: RootState) => state.map3d.map3d;

// Reducer.
export const map3dReducer = map3DSlice.reducer;
