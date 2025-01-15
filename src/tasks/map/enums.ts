import VectorLayer from 'ol/layer/Vector';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import { Style } from 'ol/style';

export enum DrawingType {
  CroppingRegion = 'Cropping Region Tool',
  ClippingBoundary = 'Clipping Boundary Tool',
  SpotCheck = 'Spot Check Tool',
}

export enum MeasureType {
  Area = 'measure-area',
  Distance = 'measure-distance',
}

export enum DrawingStyle {
  YellowVariant = 'yellow-variant',
  BlueVariant = 'blue-variant',
  RedVariant = 'red-variant',
  YellowPin = 'yellow-pin',
}

export enum DrawingTool {
  Polygon = 'Polygon',
  Line = 'LineString',
  Point = 'Point',
}

export enum MapLayerType {
  Checkpoint = 'Tagged Checkpoints',
  UntaggedCheckpoint = 'Untagged Checkpoints',
  ClippingBoundary = 'Clipping Boundary',
  CroppingRegion = 'Cropping Region',
  GCP = 'Tagged Ground Control Points',
  UntaggedGCP = 'Untagged Ground Control Points',
  Geotag = 'Geotags',
  AlignedImages = 'Aligned Images',
  UnalignedImages = 'Unaligned Images',
  Orthomosaic = 'Orthomosaic',
  SurfaceModel = 'Surface Model',
  Satellite = 'Satellite',
  ReferenceLayer = 'Reference Layer',
}

export enum MapPointTypes {
  GCP = 'Ground Control Points',
  Checkpoint = 'Checkpoints',
  Geotag = 'Geotags',
}

export type LayerPresentType = {
  name: MapPointTypes;
  visible: boolean;
  vector: VectorLayer<any>[] | WebGLPointsLayer<any>[];
};

export enum ProcessingPolygonType {
  ClippingBoundary = 'clipping-boundary',
  CroppingRegion = 'cropping-region',
}

export type DrawingToolStyles = {
  lineStyle: Style;
  pointStyle: Style;
  editStyle: Style;
};

export enum MapComponentTool {
  SpotCheckTool = 'SpotCheckTool',
  MeasureTool = 'MeasureTool',
  InspectTool = 'InspectTool',
}

export enum CursorStyle {
  Auto = 'auto',
  CrossHair = 'crosshair',
}
