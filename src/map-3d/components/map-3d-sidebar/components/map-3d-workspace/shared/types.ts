import { CesiumProxy } from '../../../../../../shared/cesium';
import { DrawingTools } from '../../../../../shared/map-3d-tools';
import {
  SelectLayerListItem,
  WorkspaceLayer,
  WorkspaceLayerListObj,
} from '../../../shared';

export type ToggleLayerHelperProps = {
  layer: WorkspaceLayer;
  id: string;
  setLayer: (selectLayer: WorkspaceLayerListObj) => void;
  isActive?: boolean;
  drawingTools?: DrawingTools | null;
  cesiumProxy?: CesiumProxy | null;
};

export type ToggleMapLayerHelperProps = {
  layer: SelectLayerListItem;
  id: string;
  setLayer: (selectLayer: WorkspaceLayerListObj) => void;
  isActive?: boolean;
  drawingTools?: DrawingTools | null;
  cesiumProxy?: CesiumProxy | null;
};
