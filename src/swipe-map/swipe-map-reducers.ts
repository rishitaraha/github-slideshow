import { combineReducers } from '@reduxjs/toolkit';
import { swipeMapDatasetReducer } from './swipe-map-slices';

// @FIXME - we don't really need to use combine reducer in case of single reducers.
export const swipeMapReducers = combineReducers({
  swipeMapDataset: swipeMapDatasetReducer,
});
