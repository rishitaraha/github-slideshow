import { PrimitiveCollection } from 'cesium';
import { Polygon } from '../../../entities';
import {
  PolylineOptions,
  PolygonOptions,
  PointOptions,
  LabelOptions,
} from '../../../types';
import { MapToolConstructorOptions } from '../../base';

/**
 * Options for polygon drawing tool
 */
export interface PolygonDrawingConstructorOptions
  extends MapToolConstructorOptions {
  primitives: PrimitiveCollection;
  polygons: Polygon[];
  pointOptions: PointOptions;
  polylineOptions: PolylineOptions;
  polygonOptions: PolygonOptions;
  labelOptions?: LabelOptions;
  markerOptions: PointOptions;
  local?: string | string[];
  properties?: Record<string, any>;
}
