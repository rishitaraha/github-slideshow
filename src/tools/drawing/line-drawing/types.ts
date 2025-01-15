import { PrimitiveCollection } from 'cesium';
import { Line } from '../../../entities';
import { PolylineOptions, PointOptions, LabelOptions } from '../../../types';
import { MapToolConstructorOptions } from '../../base';

/**
 * Options for line drawing tool
 */
export interface LineDrawingConstructorOptions
  extends MapToolConstructorOptions {
  lines: Line[];
  primitives: PrimitiveCollection;
  pointOptions: PointOptions;
  polylineOptions: PolylineOptions;
  labelOptions?: LabelOptions;
  markerOptions: PointOptions;
  local?: string | string[];
  properties?: Record<string, any>;
}
