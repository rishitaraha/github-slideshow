import { SideBarOption } from '@aus-platform/design-system';
import { SceneMode } from 'cesium';
import {
  IterationListItem,
  ProjectListItem,
  SiteListItem,
} from '../../../shared/api';
import { CesiumProxy } from '../../../shared/cesium';
import { AccessType } from '../../../sites/components/enums';
import { WorkspaceLayerListObj } from '../../components';
import { MapTool } from '../../components/map-3d-container/map-3d-tools';
import { Map3DTerrainProviderType } from '../../types';
import {
  ActionTools,
  DrawingTools,
  ILineTool,
  IPolygonTool,
} from '../map-3d-tools';
import { IFeatureInfoTool, IMeasureTool } from '../map-3d-tools/interfaces';
import { WorkspaceRightSideCard } from './enums';

export type Map3DState = {
  cesiumProxy: CesiumProxy | null;
  measureTool: IMeasureTool | null;
  featureInfoTool: IFeatureInfoTool | null;
  currentActiveMapTool: MapTool;
  currentSceneMode: SceneMode;
  isElevationProfileSelectLayersActive: boolean;
  isWorkspaceLoading: boolean;
};

export type Map3DSidebarState = {
  activeSidebarOption: SideBarOption | null;
};

export type ExitEditableLayerType = {
  refreshRequired: boolean;
};

export type Map3DWorkspaceState = {
  drawingTools: DrawingTools | null;
  actionTools: ActionTools | null;
  currentEditableLayerId: string | null;
  currentPropertyLayerId: string | null;
  showUnsavedFeaturesModal: boolean;
  rightSideCard: WorkspaceRightSideCard;
  workspaceLayers: WorkspaceLayerListObj;
  terrainProvider: Map3DTerrainProviderType | undefined;
  layerAccessControl: LayerAccessControl;
};

export type LayerAccessControl = {
  accessType: AccessType | null;
  canManageLayers: boolean;
};

export type Map3DHeapState = {
  polygonTool: IPolygonTool | null;
};

export type ElevationToolReduxState = {
  lineTool: ILineTool | null;
};

export type SiteListOption = SiteListItem & {
  canManageSites: boolean;
};

export type SelectedTerrainIteration = IterationListItem & {
  canManageIterations: boolean;
};

export type Map3DDatasetState = {
  selectedProject: ProjectListItem | null;
  activeWorkspaceSite: SiteListItem | null;
  activeWorkspaceIteration: IterationListItem | null;
  selectedTerrainSite: SiteListItem | null;
  selectedTerrainIteration: SelectedTerrainIteration | null;
  canManageIterationsAndLayers: boolean;
};

export type HRAReduxState = {
  table: HRATableState;
};

export type HRATableState = {
  show: boolean;
  data: [];
  haulRoadId: string | null;
  haulRoadName: string | undefined;
};
