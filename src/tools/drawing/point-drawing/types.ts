import { PrimitiveCollection } from 'cesium';
import { Point } from '../../../entities/point';
import { LabelOptions, PointOptions } from '../../../types';
import { MapToolConstructorOptions } from '../../base';

/**
 * Options for point drawing tool
 */
export interface PointDrawingConstructorOption
  extends MapToolConstructorOptions {
  points: Point[];
  primitives: PrimitiveCollection;
  pointOptions: PointOptions;
  markerOptions: PointOptions;
  labelOptions?: LabelOptions;
  local?: string | string[];
  properties?: Record<string, any>;
}
