import { FeatureInfoType } from '../tools';
import { CesiumViewerType, FeatureType } from '../types';
import { GEOMETRY_TYPE } from './types';

export function getFeature(
  featureInfo: FeatureInfoType,
  viewer: CesiumViewerType,
): FeatureType | undefined {
  if (!viewer) {
    return;
  }

  const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
    viewer.drawingTools;
  const { textDraw } = viewer.textTool;
  let feature;

  switch (featureInfo.type) {
    case GEOMETRY_TYPE.POLYGON:
      feature = polygonDrawingTools.getPolygon(featureInfo.id);
      break;
    case GEOMETRY_TYPE.LINE:
      feature = lineDrawingTools.getLine(featureInfo.id);
      break;
    case GEOMETRY_TYPE.POINT:
      feature = pointDrawingTools.getPoint(featureInfo.id);
      break;
    case GEOMETRY_TYPE.TEXT:
      feature = textDraw.getTextboxById(featureInfo.id);
    default:
      break;
  }

  return feature;
}

export interface ReturnFeatureType {
  feature?: FeatureType;
  type?: GEOMETRY_TYPE;
}

export function getFeatureFromIdWithType(
  id: string,
  viewer: CesiumViewerType,
): ReturnFeatureType | undefined {
  if (!viewer) {
    return;
  }

  const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
    viewer.drawingTools;
  const { textDraw } = viewer.textTool;

  let feature;

  const [featureId] = id.split('|');
  feature = polygonDrawingTools.polygonDrawing.getPolygonById(featureId);
  if (feature) {
    return { feature: feature, type: GEOMETRY_TYPE.POLYGON };
  }
  feature = lineDrawingTools.lineDrawing.getLineById(featureId);
  if (feature) {
    return { feature: feature, type: GEOMETRY_TYPE.LINE };
  }
  feature = pointDrawingTools.pointDrawing.getPointById(featureId);
  if (feature) {
    return { feature: feature, type: GEOMETRY_TYPE.POINT };
  }
  feature = textDraw.getTextboxById(featureId);
  if (feature) {
    return { feature: feature, type: GEOMETRY_TYPE.TEXT };
  }

  return;
}
