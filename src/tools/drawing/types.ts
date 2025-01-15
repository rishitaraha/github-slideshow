import { Cartesian3, Color, PointPrimitive } from 'cesium';

export type PointPrimitiveOptions = {
  pixelSize: number;
  color: Color;
  position?: Cartesian3;
  disableDepthTestDistance?: number;
  show: boolean;
  outlineColor: Color;
  outlineWidth: number;
};

export enum PointState {
  DEFAULT = 1,
  HOVER = 2,
  ACTIVE = 3,
}

export type SnapPointOptions = {
  segStartIdx: number;
  position: Cartesian3;
};

export type ExportedWKTType = {
  id: string;
  wkt: string;
  text?: string;
};

export type CesiumPointPrimitive = {
  _properties?: Record<string, any>;
  _pointPrimitive: PointPrimitive;
};

export enum EditActionType {
  add = 'Added',
  modify = 'Modified',
  remove = 'Removed',
}

export enum UndoRedoAction {
  none = 0,
  undo = 1,
  redo = 2,
}

export type EditAction = {
  id: string;
  geometryType: 'Polygon' | 'Line';
  vertexId: number;
  vertexPosition?: Cartesian3;
  action: EditActionType;
  modifiedPosition?: Cartesian3;
};
