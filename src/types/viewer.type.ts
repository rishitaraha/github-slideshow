import { Viewer } from 'cesium';
import { CesiumLayerTool } from '../tools/layers/cesium-layer-tool';
import {
  FeatureInfoTool,
  DrawingTools,
  SelectTools,
  StyleFeatureTool,
  TextTool,
} from '../tools';
import { MapTool, MapTools } from '../tools/base';
import CanvasEventHandler from '../shared/canvas-event-handler';
import { ZoomMode } from './enums';

export type CesiumViewerType = Viewer & {
  _mapTool: MapTools;
  _canvasEventHandler: CanvasEventHandler;
  setMapTool: (mapTool: MapTool) => boolean;
  deactivateCurrentMapTool: () => void;
  drawingTools: DrawingTools;
  selectTools: SelectTools;
  styleTools: StyleFeatureTool;
  textTool: TextTool;
  layerTool: CesiumLayerTool;
  infoTool: FeatureInfoTool;
  zoom: (mode: ZoomMode) => void;
};

export type SplitViewerConstructorOptions = {
  cesiumContainerLeft: HTMLElement;
  cesiumContainerRight: HTMLElement;
  slider: HTMLDivElement;
  token: string;
  optionsLeft: Viewer.ConstructorOptions;
  optionsRight: Viewer.ConstructorOptions;
};

export type SplitViewerFlyToOptions = {
  longitude: string;
  latitude: string;
  height?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
};
