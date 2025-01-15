import { PrimitiveCollection } from 'cesium';
import { MapToolConstructorOptions } from '../../base';
import { PointOptions, PolylineOptions } from '../../../types';
import { Line, Point, Textbox } from '../../../entities';

export interface AdvancedMeasureToolOptions extends MapToolConstructorOptions {
  primitives: PrimitiveCollection;
  pointOptions: PointOptions;
  polylineOptions: PolylineOptions;
}

export type MeasureComponentOptions = {
  startedPoint: Point;
  directLine: Line;
  horizontalLine: Line;
  verticalLine: Line;
  directLineLabel: Textbox;
  horizontalLineLabel: Textbox;
  verticalLineLabel: Textbox;
};
