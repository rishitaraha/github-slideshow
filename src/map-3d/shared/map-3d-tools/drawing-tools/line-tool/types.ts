import { Line } from '@aus-platform/cesium';

export type LineListener = (line: Line[]) => void;
export type LineToolEventListener = LineListener | VoidFunction;
