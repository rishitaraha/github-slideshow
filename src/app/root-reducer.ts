import { combineReducers } from '@reduxjs/toolkit';
import { dashboardReducers } from '../dashboard/dashboard-reducers';
import { map3dReducers } from '../map-3d/map-3d-reducers';
import { swipeMapReducers } from '../swipe-map/swipe-map-reducers';
import { swipeMap3DReducer } from 'src/swipe-map-3d';

const rootReducer = combineReducers({
  map3d: map3dReducers,
  dashboard: dashboardReducers,
  swipeMap: swipeMapReducers,
  swipeMap3D: swipeMap3DReducer,
});

export default rootReducer;
