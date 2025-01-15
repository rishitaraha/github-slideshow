import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { FileDataType } from '../files';
import { CapturedDsmCogInfo } from '../iterations';
import { AreaCategory, LayerType } from '../layers';
import { CustomDate } from 'shared/utils';
import { BatchJobStatus } from 'shared/enums';
import { SmartDetectOutput } from 'src/map-3d/components/map-3d-sidebar/components/map-3d-smart-detect/enums';

type WorkspaceProject = {
  id: string;
  name: string;
};

type WorkspaceSite = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  canManageIterationsAndLayers: boolean;
};

type CameraConfig = {
  latitude: number;
  longitude: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
};

export type WorkspaceDSMLayer = {
  id: string;
  name: string;
  capturedDsmCog: CapturedDsmCogInfo;
  show: boolean;
  zIndex: number;
  site: WorkspaceSite;
};

type ShareableWorkspaceLayer = {
  show: boolean;
  zIndex: number;
  id?: string;
  dsmIterationId?: string;
};

export type ShareableWorkspacePayload = {
  projectId: string;
  camera: CameraConfig;
  terrainIterationId: string | undefined;
  selectedIterationId: string | undefined;
  layers: ShareableWorkspaceLayer[];
  dsmLayers?: string[];
};

export type WorkspaceRequestPayload = {
  workspaceId: string | undefined;
};

export type ShareableWorkspaceResponse = {
  slug: string;
};

export type WorkspaceResponseLayer = {
  id: string;
  site: WorkspaceSite;
  iteration: {
    id: string;
    name: string;
    capturedDsm: FileDataType;
    capturedDsmCog: CapturedDsmCogInfo;
  };
  name: string;
  type: LayerType;
  status: string;
  zIndex: number;
  show: boolean;
  areaCategory: AreaCategory;
  files: FileDataType[];
  tiles: FileDataType;
  accessTags: string[];
  createdAt: CustomDate;
  canManageLayers: boolean;
  canEditFeatures: boolean;
};

export type WorkspaceIteration = {
  id: string;
  name: string;
  capturedDsm: {
    status: StatusIndicatorLevel;
  };
  capturedDsmCog: CapturedDsmCogInfo;
};

export type WorkspaceMappedResponse = {
  project: WorkspaceProject;
  selectedSite: WorkspaceSite;
  terrainSite: WorkspaceSite;
  selectedIteration: WorkspaceIteration;
  terrainIteration: {
    id: string;
    name: string;
    date: CustomDate;
    terrainTiles: {
      path: string;
      status: BatchJobStatus;
    };
  };
  camera: CameraConfig;
  workspaceLayers: WorkspaceResponseLayer[];
  dsmLayers: WorkspaceDSMLayer[];
};

export type SmartDetectCreatePayload = {
  iteration: string;
  inputOrthoLayer: string;
  inputAOILayer?: string;
  smartAreaWkt?: string;
  smartDetectOutputs: {
    outputType: SmartDetectOutput;
    name: string;
  }[];
};
