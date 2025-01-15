import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { filter, isNil, omit } from 'lodash';
import { RootState } from '../../../app/store';
import { AccessType } from '../../../sites/components/enums';
import {
  refetchSingleLayer,
  WorkspaceLayer,
  WorkspaceLayerListObj,
} from '../../components';
import { Map3DTerrainProviderType } from '../../types';
import { ActionTools, DrawingTools } from '../map-3d-tools';
import { WorkspaceRightSideCard } from './enums';
import {
  ExitEditableLayerType,
  LayerAccessControl,
  Map3DWorkspaceState,
} from './types';
import { FeatureGeometryType } from 'shared/api';

const map3DWorkspaceInitialState: Map3DWorkspaceState = {
  workspaceLayers: {},
  terrainProvider: undefined,
  layerAccessControl: {
    accessType: AccessType.Advance,
    canManageLayers: true,
  },
  drawingTools: null,
  actionTools: null,
  currentEditableLayerId: null,
  currentPropertyLayerId: null,
  showUnsavedFeaturesModal: false,
  rightSideCard: WorkspaceRightSideCard?.None,
};

export const map3DWorkspaceSlice = createSlice({
  name: 'map3DWorkspace',
  initialState: map3DWorkspaceInitialState,
  reducers: {
    addTerrainLayer: (
      state,
      action: PayloadAction<Map3DTerrainProviderType>,
    ) => {
      Object.assign(state, { terrainProvider: action.payload });
    },

    addWorkspaceLayers: (
      state,
      action: PayloadAction<WorkspaceLayerListObj>,
    ) => {
      Object.assign(state.workspaceLayers, action.payload);
    },

    addWorkspaceLayer: (state, action: PayloadAction<WorkspaceLayer>) => {
      Object.assign(state.workspaceLayers, {
        [action.payload.id]: action.payload,
      });
    },

    setDrawingTools: (state, action: PayloadAction<DrawingTools | null>) => {
      Object.assign(state, { drawingTools: action.payload });
    },

    setActionTools: (state, action: PayloadAction<ActionTools | null>) => {
      Object.assign(state, { actionTools: action.payload });
    },

    setCurrentEditableLayerId: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.currentEditableLayerId = action.payload;
    },

    setCurrentPropertyLayerId: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.currentPropertyLayerId = action.payload;
    },

    setShowUnsavedFeaturesModal: (state, action: PayloadAction<boolean>) => {
      Object.assign(state, { showUnsavedFeaturesModal: action.payload });
    },

    setRightSideCard: (
      state,
      action: PayloadAction<WorkspaceRightSideCard>,
    ) => {
      state.rightSideCard = action.payload;
    },

    setLayerAccessControl: (
      state,
      action: PayloadAction<LayerAccessControl | null>,
    ) => {
      Object.assign(state, { layerAccessControl: action.payload });
    },

    disableEditMode: (state) => {
      state.currentEditableLayerId = null;
    },

    updateWorkspaceLayer: (
      state,
      action: PayloadAction<WorkspaceLayerListObj>,
    ) => {
      Object.assign(state.workspaceLayers, {
        ...state.workspaceLayers,
        ...action.payload,
      });
    },

    refetchLayer: (state, action: PayloadAction<{ id: string }>) => {
      refetchSingleLayer(action.payload.id);
    },

    removeWorkspaceLayers: (state, action: PayloadAction<string[]>) => {
      state.workspaceLayers = omit(state.workspaceLayers, [...action.payload]);
    },

    removeTerrainProvider: (state) => {
      state.terrainProvider = undefined;
    },

    cleanWorkspace: (state) => {
      removeTerrainProvider();
      state.drawingTools?.destroy();
      state.actionTools?.destroy();
      setDrawingTools(null);
      Object.values(state.workspaceLayers).forEach((layer) => {
        layer.features?.forEach((feature) => {
          feature.feature = undefined;
        });
      });
      state.workspaceLayers = {};
    },

    resetMap3DWorkspace: (state) => {
      cleanWorkspace();
      Object.assign(state, map3DWorkspaceInitialState);
    },

    resetPropertiesLayer: (state) => {
      state.currentPropertyLayerId = null;
      state.rightSideCard = WorkspaceRightSideCard.None;
    },
    exitEditableLayer: (
      state,
      action: PayloadAction<ExitEditableLayerType>,
    ) => {
      const { refreshRequired = true } = action.payload;
      const currentEditableLayer =
        state.workspaceLayers[state.currentEditableLayerId || ''];

      if (currentEditableLayer) {
        const drawingTools = state.drawingTools;
        const actionTools = state.actionTools;

        drawingTools?.deleteAllFeatures();
        drawingTools?.deactivateAllTools();
        actionTools?.deactivateAllTools();

        // Load vector tiles.
        if (refreshRequired) {
          currentEditableLayer.refresh?.();
        }

        // Resetting the current editable layer id.
        state.currentEditableLayerId = null;
      }
    },
  },
});

// Actions.
export const {
  setDrawingTools,
  setActionTools,
  setCurrentEditableLayerId,
  setCurrentPropertyLayerId,
  disableEditMode,
  setShowUnsavedFeaturesModal,
  setRightSideCard,
  addTerrainLayer,

  addWorkspaceLayer,
  addWorkspaceLayers,
  updateWorkspaceLayer,
  cleanWorkspace,
  removeWorkspaceLayers,
  removeTerrainProvider,
  refetchLayer,
  setLayerAccessControl,
  resetMap3DWorkspace,
  resetPropertiesLayer,
  exitEditableLayer,
} = map3DWorkspaceSlice.actions;

// Selectors.
const getCurrentEditableLayerId = (state: RootState) =>
  state.map3d.map3dWorkspace.currentEditableLayerId;

const getCurrentPropertyLayerId = (state: RootState) =>
  state.map3d.map3dWorkspace.currentPropertyLayerId;

const getWorkspaceLayers = (state: RootState) =>
  state.map3d.map3dWorkspace.workspaceLayers;

export const selectMap3dWorkspace = (state: RootState) =>
  state.map3d.map3dWorkspace;

// Using derived states - https://redux.js.org/usage/deriving-data-selectors
export const selectWorkspaceActionableLayers = createSelector(
  [getCurrentEditableLayerId, getCurrentPropertyLayerId, getWorkspaceLayers],
  (currentEditableLayerId, currentInfoLayerId, workspaceLayers) => {
    const currentEditableLayer = currentEditableLayerId
      ? workspaceLayers[currentEditableLayerId]
      : null;

    const currentPropertyLayer = currentInfoLayerId
      ? workspaceLayers[currentInfoLayerId]
      : null;

    return { currentEditableLayer, currentPropertyLayer };
  },
);

// Passing arguments in selector - https://stackoverflow.com/a/61220891/13845538
export const selectActiveWorkspaceLayersByFeatureType = createSelector(
  [
    getWorkspaceLayers,
    // Take the second arg, `featureType`, and forward to the output selector.
    (state, featureType: FeatureGeometryType) => featureType,
  ],
  // Output selector gets (`items, featureType)` as args.
  (workspaceLayers, featureType) => {
    const activeLayers = filter(
      workspaceLayers,
      (layer) =>
        !!layer.show &&
        !isNil(layer.featuresCount) &&
        layer.featuresCount[featureType] > 0,
    );

    return activeLayers;
  },
);

export const map3dWorkspaceReducer = map3DWorkspaceSlice.reducer;
