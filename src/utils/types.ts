import { BBox } from 'geojson';
import { ExportedWKTType } from '../tools/drawing/types';

export enum GEOMETRY_TYPE {
  MULTIPOLYGON = 'MultiPolygon',
  POLYGON = 'Polygon',
  LINE = 'LineString',
  MULTILINE = 'MultiLineString',
  POINT = 'Point',
  MULTIPOINT = 'MultiPoint',
  TEXT = 'Label',
}

export type WKTJsonType = {
  polygon: ExportedWKTType[] | undefined;
  multiPolygon: ExportedWKTType[] | undefined;
  line: ExportedWKTType[] | undefined;
  multiLine: ExportedWKTType[] | undefined;
  point: ExportedWKTType[] | undefined;
  multiPoint: ExportedWKTType[] | undefined;
};

export type GeometryIDType = {
  polygonIds: string[] | undefined;
  lineIds: string[] | undefined;
  pointIds: string[] | undefined;
};

export enum HALIGN {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  CENTER = 'CENTER',
}

export enum VALIGN {
  TOP = 'TOP',
  MIDDLE = 'MIDDLE',
  BOTTOM = 'BOTTOM',
}

export type LabelSVGType = {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  horizontalAlign?: HALIGN;
  verticalAlign?: VALIGN;
  paddingHorizontal?: number;
  paddingVertical?: number;
  opacity?: number;
  scale?: number;
};

export type SimplifyOptions = {
  tolerance: number;
  highQuality: boolean;
};

export type CameraViewBoundsOptions = {
  bounds: BBox;
  zoom: number;
};
