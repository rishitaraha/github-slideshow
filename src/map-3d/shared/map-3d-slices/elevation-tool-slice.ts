import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store';
import { ILineTool } from '../map-3d-tools';
import { ElevationToolReduxState } from './types';

const elevationToolInitialState: ElevationToolReduxState = {
  lineTool: null,
};

export const elevationToolSlice = createSlice({
  name: 'elevationToolSlice',
  initialState: elevationToolInitialState,
  reducers: {
    setElevationLineTool: (state, action: PayloadAction<ILineTool | null>) => {
      Object.assign(state, { lineTool: action.payload });
    },

    resetElevationTool: (state) => {
      state.lineTool?.destroy();
      Object.assign(state, elevationToolInitialState);
    },
  },
});

// Actions.
export const { setElevationLineTool, resetElevationTool } =
  elevationToolSlice.actions;

// Selectors.
export const selectElevationTool = (state: RootState) =>
  state.map3d.elevationTool;

export const elevationToolReducer = elevationToolSlice.reducer;
