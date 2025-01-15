import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { WorkspaceLayer } from '../../../../shared';
import { canShowHistogramLayerTypesList } from '../../shared';

export const isLayerProcessing = (layer: WorkspaceLayer) =>
  layer.layerStatus &&
  layer.layerStatus !== StatusIndicatorLevel.Done &&
  layer.layerStatus !== StatusIndicatorLevel.Completed;

export const isLayerPresentOnMap = (layer: WorkspaceLayer) =>
  layer.mapLayer !== undefined || layer.features !== undefined;

export const canLayerShowHistogram = (layer: WorkspaceLayer) =>
  canShowHistogramLayerTypesList.includes(layer.type);
