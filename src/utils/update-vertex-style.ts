import { PointPrimitive } from 'cesium';
import { PointState } from '../tools';
import DrawingSettings from '../tools/drawing/drawing-tool-settings';

export function updateVertexStyle(
  vertex: PointPrimitive,
  pointState?: PointState,
) {
  const statePointOptions = DrawingSettings.getPointOptions(pointState);

  vertex.color = statePointOptions.color;
  vertex.outlineColor = statePointOptions.outlineColor;
  vertex.pixelSize = statePointOptions.pixelSize;
  vertex.outlineWidth = statePointOptions.outlineWidth;
}
