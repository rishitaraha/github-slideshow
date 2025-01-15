import {
  Cartesian2,
  Cartesian3,
  Color,
  Ellipsoid,
  VerticalOrigin,
  PointPrimitive,
  Scene,
  PrimitiveCollection,
  BillboardCollection,
} from 'cesium';
import { Line, Polygon, Point, Textbox } from '../entities';
import { PolygonPrimitive, PolylinePrimitive } from '../primitives';
import { LabelSVGType } from '../utils';

export type PointOptions = {
  color: Color;
  disableDepthTestDistance: number;
  pixelSize: number;
  position: Cartesian3;
  show: boolean;
};

export type LabelOptions = {
  backgroundColor: Color;
  backgroundPadding: Cartesian2;
  disableDepthTestDistance: number;
  fillColor: Color;
  font: string;
  horizontalOrigin: number;
  pixelOffset: Cartesian2;
  position: Cartesian3;
  scale: number;
  show: boolean;
  showBackground: boolean;
  verticalOrigin: VerticalOrigin;
};

export type TextboxConstructorOptions = {
  id: string;
  name: string;
  show: boolean;
  scene: Scene;
  labelOptions: LabelOptions;
  labelCollection: BillboardCollection;
  position: Cartesian3;
  properties?: Record<string, any>;
  locale?: string | string[];
  fontSize?: number;
  fontFamily?: string;
  type: FeatureIdentity;
  scale?: number;
};

export interface PolylineOptions {
  color: Color;
  ellipsoid: Ellipsoid;
  dashed: boolean;
  dashLength?: number;
  show?: boolean;
  width?: number;
  depthFailColor?: Color;
  id?: string;
  positions?: Cartesian3[];
  loop?: boolean;
  clampToGround?: boolean;
  classificationType?: any;
  allowPicking?: boolean;
}

export interface PolygonOptions {
  color: Color;
  clampToGround?: boolean;
}

/**
 * Vertex interface which construct a polygon
 * mainVertexPointPrimitive: Vertex which construct a polygon
 * Reference https://cesium.com/learn/cesiumjs/ref-doc/PointPrimitive.html?classFilter=pointpri
 */
export interface Vertex extends PointPrimitive {
  vertexIndex: number;
  isMainVertex: boolean;
  polylinePrimitive: PolylinePrimitive;
  polygonPrimitive: PolygonPrimitive | undefined;
  object: Line | Polygon;
  mainVertexPointPrimitive: Vertex;
}

/**
 * Line is constructed from vertex and edges.
 * LineConstructorOptions is options for vertex, edges.
 */
export type LineConstructorOptions = {
  id: string;
  name?: string;
  show?: boolean;
  scene: Scene;
  primitives: PrimitiveCollection;
  pointOptions: PointOptions;
  polylineOptions: {
    color: Color;
  };
  labelOptions?: LabelOptions | LabelSVGType;
  positions?: Cartesian3[] | undefined;
  createVertices: boolean;
  locale?: string | string[];
  properties?: Record<string, any>;
  type: FeatureIdentity;
};

/**
 * Polygon is constructed from vertex and line edges.
 * PolygonConstructorOptions is options for vertex, edges and polygon itself.
 */
export type PolygonConstructorOptions = {
  id: string;
  name?: string;
  show?: boolean;
  scene: Scene;
  primitives: PrimitiveCollection;
  pointOptions: PointOptions;
  polylineOptions: {
    color: Color;
  };
  polygonOptions: {
    color: Color;
  };
  labelOptions?: LabelOptions | LabelSVGType;
  positions?: Cartesian3[];
  createVertices: boolean;
  locale?: string | string[];
  properties?: Record<string, any>;
  type: FeatureIdentity;
  isReduceNumberOfVertex: boolean;
};

export type PointConstructorOptions = {
  id: string;
  name?: string;
  show?: boolean;
  scene: Scene;
  primitives: PrimitiveCollection;
  primitive: PointPrimitive;
  pointOptions: PointOptions;
  labelOptions?: LabelOptions | LabelSVGType;
  locale?: string | string[];
  position: Cartesian3;
  isShowShape: boolean;
  properties?: Record<string, any>;
  type: FeatureIdentity;
};

export type FeatureType = Polygon | Line | Point | Textbox;

export enum FeatureIdentity {
  POLYGON = 'Polygon',
  LINE = 'Line',
  POINT = 'Point',
  TEXTBOX = 'Textbox',
  NONE = 'None',
}
export type BaseFeatureConstructorOptions =
  | PolygonConstructorOptions
  | LineConstructorOptions
  | PointConstructorOptions
  | TextboxConstructorOptions;

export enum FeatureStatus {
  VIEW = 'VIEW',
  ACTIVE = 'ACTIVE',
  EDIT = 'EDIT',
}
