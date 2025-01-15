import { IconIdentifier, SideBarOption } from '@aus-platform/design-system';
import { CesiumTerrainProvider } from 'cesium';
import { BatchJobStatus } from 'shared/enums';

export enum Map3DDrawingMode {
  Line = 'line',
  Polygon = 'polygon',
}

export type Map3DSideBarContextType = {
  activeOptionHandler: (
    option: SideBarOption,
    identifier: IconIdentifier,
  ) => void;
  hideSidecard: () => void;
};

export type Map3DTerrainProviderType = {
  terrainProvider?: CesiumTerrainProvider;
  show: boolean;
  processing?: boolean;
};

export type Map3DCapturedDsmLayerType = {
  iterationId: string;
  name: string;
  isProcessing: boolean;
  sourceFilePath: string;
  createdAt: string;
  status: BatchJobStatus;
};
