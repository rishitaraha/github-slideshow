import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialSwipeMapDatasetState } from './constants';
import { RootState } from 'src/app/store';
import { IterationListItem } from 'shared/api';

export const swipeMapDatasetSlice = createSlice({
  name: 'swipeMapDatasetSlice',
  initialState: initialSwipeMapDatasetState,
  reducers: {
    setLeftIteration: (
      state,
      action: PayloadAction<IterationListItem | null>,
    ) => {
      state.leftIteration = action.payload;
    },

    setRightIteration: (
      state,
      action: PayloadAction<IterationListItem | null>,
    ) => {
      state.rightIteration = action.payload;
    },

    resetDataset: (state) => {
      Object.assign(state, initialSwipeMapDatasetState);
    },
  },
});

// Actions.
export const { setLeftIteration, setRightIteration, resetDataset } =
  swipeMapDatasetSlice.actions;

// Selector.
export const selectSwipeMapDataset = (state: RootState) =>
  state.swipeMap.swipeMapDataset;

// Reducer.
export const swipeMapDatasetReducer = swipeMapDatasetSlice.reducer;
