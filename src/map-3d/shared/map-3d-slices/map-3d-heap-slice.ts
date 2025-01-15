import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store';
import { IPolygonTool } from '../map-3d-tools';
import { Map3DHeapState } from './types';

const map3DHeapInitialState: Map3DHeapState = {
  polygonTool: null,
};

export const map3DHeapSlice = createSlice({
  name: 'map3DHeap',
  initialState: map3DHeapInitialState,
  reducers: {
    setPolygonTool: (state, action: PayloadAction<IPolygonTool | null>) => {
      Object.assign(state, { polygonTool: action.payload });
    },
    resetMap3DHeap: (state) => {
      state.polygonTool?.destroy();
      Object.assign(state, map3DHeapInitialState);
    },
  },
});

// Actions.
export const { setPolygonTool, resetMap3DHeap } = map3DHeapSlice.actions;

// Selectors.
export const selectMap3dHeap = (state: RootState) => state.map3d.map3dHeap;

export const map3dHeapReducer = map3DHeapSlice.reducer;
