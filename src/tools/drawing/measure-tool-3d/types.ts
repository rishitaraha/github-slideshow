import { PrimitiveCollection } from 'cesium';
import { MapToolConstructorOptions } from '../../base';
import { PointOptions, PolylineOptions } from '../../../types';

export interface MeasureTool3DOptions extends MapToolConstructorOptions {
  primitives: PrimitiveCollection;
  pointOptions: PointOptions;
  polylineOptions: PolylineOptions;
}
