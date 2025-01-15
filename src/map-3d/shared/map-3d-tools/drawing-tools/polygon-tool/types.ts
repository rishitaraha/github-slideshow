import { Polygon } from '@aus-platform/cesium';

export type PolygonListener = (polygon: Polygon[]) => void;
export type PolygonToolEventListener = PolygonListener | VoidFunction;
