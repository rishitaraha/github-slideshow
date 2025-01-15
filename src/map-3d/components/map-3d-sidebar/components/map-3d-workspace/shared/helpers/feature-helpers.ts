import {
  Line,
  Point,
  Polygon,
  StyleOptions,
  Textbox,
} from '@aus-platform/cesium';
import { isNil } from 'lodash';
import { WorkspaceLayer } from '../../../../shared';
import { Feature, FeatureObj, FeatureType } from 'shared/api';
import { DrawingTools } from 'map-3d/shared/map-3d-tools';

export const addOrToggleFeatures = (
  features: Feature[],
  layerId: string,
  drawingTools: DrawingTools,
  styleOptions: StyleOptions,
) => {
  for (const feature of features) {
    if (!isNil(feature.feature)) {
      toggleFeatureVisibility(feature.feature, drawingTools);
    } else {
      let featureObj: FeatureObj = null;
      // Check geometry of the wkt and import by geometry.
      switch (feature.type) {
        case FeatureType.Polygon: {
          const importedPolygons = drawingTools.polygonTool.importWKT(
            feature.geometry,
            feature.id,
            { layerId, isLayer: true },
            styleOptions.polygonStyleOptions?.label,
            styleOptions,
          );
          if (importedPolygons) {
            featureObj = importedPolygons[0];
          }
          break;
        }
        case FeatureType.LineString: {
          const importedLines = drawingTools.lineTool.importWKT(
            feature.geometry,
            feature.id,
            {
              layerId,
              isLayer: true,
            },
            styleOptions.lineStyleOptions?.label,
            styleOptions,
          );
          if (importedLines) {
            featureObj = importedLines[0];
          }
          break;
        }
        case FeatureType.Point: {
          const importedPoints = drawingTools.pointTool.importWKT(
            feature.geometry,
            feature.id,
            {
              layerId,
              isLayer: true,
            },
            styleOptions.pointStyleOptions?.label,
          );

          if (importedPoints) {
            featureObj = importedPoints[0];
          }
          break;
        }
        case FeatureType.Textbox: {
          if (feature?.properties?.text) {
            const importedTextboxes = drawingTools.textboxTool.importWKT(
              feature.geometry,
              feature.properties?.text,
              feature.id,
              {
                layerId,
                isLayer: true,
              },
              styleOptions,
            );
            if (importedTextboxes) {
              featureObj = importedTextboxes[0];
            }
          }

          break;
        }
      }
      feature.feature = featureObj;
    }
  }
};

export const toggleFeatureVisibility = (
  feature: FeatureObj,
  drawingTools: DrawingTools,
) => {
  if (feature instanceof Polygon) {
    drawingTools.polygonTool.getPolygon(feature.id)?.toggleVisibility();
  } else if (feature instanceof Line) {
    drawingTools.lineTool.getLine(feature.id)?.toggleVisibility();
  } else if (feature instanceof Point) {
    drawingTools.pointTool.getPoint(feature.id)?.toggleVisibility();
  } else if (feature instanceof Textbox) {
    drawingTools.textboxTool.getTextbox(feature.id)?.toggleVisibility();
  }
};

export const toggleFeaturesVisibility = (
  features: Feature[],
  drawingTools: DrawingTools,
) => {
  for (const feature of features) {
    if (feature.feature) {
      toggleFeatureVisibility(feature.feature, drawingTools);
    }
  }
};

export const removeFeature = (
  feature: FeatureObj,
  drawingTools: DrawingTools,
) => {
  if (feature instanceof Polygon) {
    drawingTools.polygonTool.deleteById(feature.id);
  } else if (feature instanceof Line) {
    drawingTools.lineTool.deleteById(feature.id);
  } else if (feature instanceof Point) {
    drawingTools.pointTool.deletePoint(feature.id);
  } else if (feature instanceof Textbox) {
    drawingTools.textboxTool.deleteById(feature.id);
  }
};

export const removeAllFeatures = (
  layer: WorkspaceLayer,
  drawingTools?: DrawingTools | null,
) => {
  const features = layer.features ?? [];
  if (drawingTools) {
    for (const feature of features) {
      if (feature.feature) {
        removeFeature(feature.feature, drawingTools);
      }
    }
  }
};
