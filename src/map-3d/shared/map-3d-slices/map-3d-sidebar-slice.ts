import { SideBarOption } from '@aus-platform/design-system';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store';
import { Map3DSidebarState } from './types';

const map3DSidebarInitialState: Map3DSidebarState = {
  activeSidebarOption: null,
};

export const map3DSidebarSlice = createSlice({
  name: 'map3DSidebar',
  initialState: map3DSidebarInitialState,
  reducers: {
    resetMap3DSidebar: (state) => {
      Object.assign(state, map3DSidebarInitialState);
    },
    setActiveSidebarOption: (
      state,
      action: PayloadAction<SideBarOption | null>,
    ) => {
      Object.assign(state, {
        activeSidebarOption: action.payload,
      });
    },
  },
});

// Actions.
export const { resetMap3DSidebar, setActiveSidebarOption } =
  map3DSidebarSlice.actions;

// Selectors.
export const selectMap3dSidebar = (state: RootState) =>
  state.map3d.map3dSidebar;

export const map3dSidebarReducer = map3DSidebarSlice.reducer;
