import { SceneMode } from 'cesium';
import { Map3DState } from './types';
import { MapTool } from 'src/map-3d/components/map-3d-container/map-3d-tools/enums';

export const map3DInitialState: Map3DState = {
  cesiumProxy: null,
  measureTool: null,
  featureInfoTool: null,
  currentActiveMapTool: MapTool.None,
  currentSceneMode: SceneMode.SCENE3D,
  isElevationProfileSelectLayersActive: false,
  isWorkspaceLoading: false,
};
