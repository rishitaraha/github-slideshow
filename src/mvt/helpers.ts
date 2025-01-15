import DrawingSettings from '../tools/drawing/drawing-tool-settings';
import { FocusedLayerId } from './enums';
import {
  CircleLayerSpecification,
  LineLayerSpecification,
  FillLayerSpecification,
} from './types';

type FocusedLayers = {
  focusedPointLayer: CircleLayerSpecification;
  focusedLineLayer: LineLayerSpecification;
  focusedPolygonLayer: FillLayerSpecification;
};

export const generateFocusedLayers = (
  featureId: string,
  source: string,
  sourceLayer: string,
): FocusedLayers => {
  const focusedPointLayer: CircleLayerSpecification = {
    id: FocusedLayerId.Point,
    source,
    'source-layer': sourceLayer,
    type: 'circle',
    paint: {
      'circle-color': DrawingSettings.activeColor.toCssColorString(),
      'circle-radius': 5,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#F9CC34',
    },
    filter: ['all', ['==', 'id', featureId], ['==', 'type', 'Point']],
  };

  const focusedLineLayer: LineLayerSpecification = {
    id: FocusedLayerId.Line,
    source,
    'source-layer': sourceLayer,
    type: 'line',
    paint: {
      'line-color': DrawingSettings.activeColor.toCssColorString(),
      'line-width': DrawingSettings.lineWidth + 1,
    },
    filter: ['==', 'id', featureId],
  };

  const focusedPolygonLayer: FillLayerSpecification = {
    id: FocusedLayerId.Polygon,
    type: 'fill',
    source,
    'source-layer': sourceLayer,
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': 0.5,
    },
    filter: ['all', ['==', 'id', featureId], ['==', 'type', 'Polygon']],
  };

  return {
    focusedPointLayer,
    focusedLineLayer,
    focusedPolygonLayer,
  };
};
