import { CesiumViewer } from '@aus-platform/cesium';

export type PolygonDrawingToolProps = {
  id: string;
  enabled: boolean;
  viewer: CesiumViewer;
};

export type LineDrawingToolProps = {
  id: string;
  enabled: boolean;
  viewer: CesiumViewer;
};

export type PointDrawingToolProps = {
  id: string;
  enabled: boolean;
  viewer: CesiumViewer;
};

export type SelectToolProps = {
  id: string;
  enabled: boolean;
  viewer: CesiumViewer;
};

export type StyleToolProps = {
  id: string;
  enabled: boolean;
  viewer: CesiumViewer;
};

export type TextToolProps = {
  id: string;
  enabled: boolean;
  viewer: CesiumViewer;
};

export type LayerToolProps = {
  id: string;
  enabled: boolean;
  viewer: CesiumViewer;
};

export type ToolbarProps = {
  toolbarContainerOption: ToolbarContainerProps;
  polygonDrawingToolOption: PolygonDrawingToolProps | undefined;
  lineDrawingToolOption: LineDrawingToolProps | undefined;
  pointDrawingToolOption: PointDrawingToolProps | undefined;
};

export type ToolbarContainerProps = {
  disp: boolean;
};
