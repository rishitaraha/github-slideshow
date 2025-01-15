import { Point } from '@aus-platform/cesium';

export type PointListener = (point: Point[]) => void;
export type PointToolEventListener = PointListener | VoidFunction;
