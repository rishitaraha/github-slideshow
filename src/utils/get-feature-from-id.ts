import { CesiumViewerType, FeatureType } from '../types';

export function getFeatureFromId(
  id: string,
  viewer: CesiumViewerType,
): FeatureType | undefined {
  const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
    viewer.drawingTools;
  const { textTool } = viewer;

  let feature;

  feature = polygonDrawingTools.polygonDrawing.getPolygonById(id);
  if (feature) {
    return feature;
  }

  feature = lineDrawingTools.lineDrawing.getLineById(id);
  if (feature) {
    return feature;
  }

  feature = pointDrawingTools.pointDrawing.getPointById(id);
  if (feature) {
    return feature;
  }

  feature = textTool.textDraw.getTextboxById(id);
  if (feature) {
    return feature;
  }

  return;
}
