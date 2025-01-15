import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialSwipeMap3DState } from './constants';
import { SwipeMap3DState, SwipeMapLayerList } from './types';
import { RootState } from 'app/store';
import { BoundingBox, CesiumSplitViewerProxy } from 'shared/cesium';
import { IterationListItem } from 'src/shared/api';

export const swipeMap3DSlice = createSlice({
  name: 'swipeMap3dSlice',
  initialState: initialSwipeMap3DState,
  reducers: {
    setSplitViewer: (state, action: PayloadAction<CesiumSplitViewerProxy>) => {
      Object.assign(state, { splitViewer: action.payload });
    },
    setIsLeftSidecardOpen: (state, action: PayloadAction<boolean>) => {
      state.isLeftSidecardOpen = action.payload;
    },
    setIsRightSidecardOpen: (state, action: PayloadAction<boolean>) => {
      state.isRightSidecardOpen = action.payload;
    },
    setLeftIteration: (
      state,
      action: PayloadAction<IterationListItem | null>,
    ) => {
      Object.assign(state, { leftIteration: action.payload });
    },
    setRightIteration: (
      state,
      action: PayloadAction<IterationListItem | null>,
    ) => {
      Object.assign(state, { rightIteration: action.payload });
    },
    setSelectedSite: (
      state,
      action: PayloadAction<SwipeMap3DState['selectedSite']>,
    ) => {
      Object.assign(state, { selectedSite: action.payload });
    },
    setLayersBoundingBox: (state, action: PayloadAction<BoundingBox>) => {
      Object.assign(state, { layersBoundingBox: action.payload });
    },
    resetBoundingBox: (state) => {
      Object.assign(state, { layersBoundingBox: null });
    },
    resetDataset: (state) => {
      const { splitViewer } = state;

      // Only resetting the dataset related fields, not split viewer.
      const resettedDataset = {
        ...initialSwipeMap3DState,
        splitViewer,
      };

      Object.assign(state, resettedDataset);
    },
    setRightPropertyLayerId: (state, action: PayloadAction<string>) => {
      state.rightPropertyLayerId = action.payload;
    },
    setLeftPropertyLayerId: (state, action: PayloadAction<string>) => {
      state.leftPropertyLayerId = action.payload;
    },
    setLeftLayerList: (state, action: PayloadAction<SwipeMapLayerList>) => {
      Object.assign(state, { leftLayerList: action.payload });
    },
    setRightLayerList: (state, action: PayloadAction<SwipeMapLayerList>) => {
      Object.assign(state, { rightLayerList: action.payload });
    },
  },
});

// Actions.
export const {
  setSplitViewer,
  setIsLeftSidecardOpen,
  setIsRightSidecardOpen,
  setSelectedSite,
  setLeftIteration,
  setRightIteration,
  setLayersBoundingBox,
  resetDataset,
  resetBoundingBox,
  setLeftPropertyLayerId,
  setRightPropertyLayerId,
  setLeftLayerList,
  setRightLayerList,
} = swipeMap3DSlice.actions;

// Selector.
export const selectSwipeMap3D = (state: RootState) => state.swipeMap3D;

// Reducer.
export const swipeMap3DReducer = swipeMap3DSlice.reducer;
