import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store';
import { HRAReduxState, HRATableState } from './types';

const hraInitialState: HRAReduxState = {
  table: {
    show: false,
    data: [],
    haulRoadId: null,
    haulRoadName: undefined,
  },
};

export const hraSlice = createSlice({
  name: 'HRASlice',
  initialState: hraInitialState,
  reducers: {
    setHRATable: (state, action: PayloadAction<HRATableState>) => {
      state.table = action.payload;
    },
  },
});

// Actions.
export const { setHRATable } = hraSlice.actions;

// Selectors.
export const selectHRA = (state: RootState) => state.map3d.hra;

// Reducers.
export const hraReducer = hraSlice.reducer;
