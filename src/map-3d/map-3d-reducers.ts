import { combineReducers } from '@reduxjs/toolkit';
import {
  map3dDatasetReducer,
  map3dSidebarReducer,
  map3dReducer,
  map3dWorkspaceReducer,
  map3dHeapReducer,
  elevationToolReducer,
} from '../map-3d/shared/map-3d-slices';
import { hraReducer } from './shared/map-3d-slices/hra-slice';

export const map3dReducers = combineReducers({
  map3dWorkspace: map3dWorkspaceReducer,
  map3dDataset: map3dDatasetReducer,
  map3dSidebar: map3dSidebarReducer,
  map3dHeap: map3dHeapReducer,
  elevationTool: elevationToolReducer,
  map3d: map3dReducer,
  hra: hraReducer,
});
