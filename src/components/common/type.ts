import { CesiumViewer } from '@aus-platform/cesium';

export type SceneModeChangeProps = {
  viewer: CesiumViewer;
};

export type InfoModeProps = {
  viewer: CesiumViewer;
};

export type ExportToWKTorJsonProps = {
  viewer: CesiumViewer;
};

export type ImportWKTorGeoJSONProps = {
  viewer: CesiumViewer;
};

export enum GEOMETRY_TYPE {
  MULTIPOLYGON = 'MultiPolygon',
  POLYGON = 'Polygon',
  LINE = 'LineString',
  MULTILINE = 'MultiLineString',
  POINT = 'Point',
  MULTIPOINT = 'MultiPoint',
  NONE = 'None'
}
