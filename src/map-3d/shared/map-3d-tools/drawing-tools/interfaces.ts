import { StyleOptions } from '@aus-platform/cesium';
import { Feature } from '../../../../shared/api';
import { ILineTool, LineTool } from './line-tool';
import { IPointTool, PointTool } from './point-tool';
import { IPolygonTool, PolygonTool } from './polygon-tool';
import { ITextboxTool } from './textbox-tool';

// Drawing Tools.
export interface CesiumTools {
  polygonTool: PolygonTool;
  lineTool: LineTool;
  pointTool: PointTool;
}

export interface IDrawingTools {
  activatePolygonTool: (
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
  ) => void;
  activateLineTool: (
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
  ) => void;
  activatePointTool: (
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
  ) => void;
  deactivateCurrentTool: VoidFunction;
  exportNewFeatures: (layerId: string) => Feature[];
  exportEditedFeatures: (layerId: string) => Feature[];
  activateEditingListeners: VoidFunction;
  resetAllDrawnFeatureArrays: (save?: boolean) => void;
  resetAllEditedFeatureArrays: (save?: boolean) => void;
  resetAllDeletedFeatureArrays: (save?: boolean) => void;
  deleteAllFeatures: VoidFunction;
  featureHasProperty: (featureId: string, property: string) => boolean;
  featureExists: (featureId: string) => boolean;

  // Getters.
  polygonTool: IPolygonTool;
  lineTool: ILineTool;
  pointTool: IPointTool;
  currentActiveTool:
    | IPolygonTool
    | ILineTool
    | IPointTool
    | ITextboxTool
    | null;
}
