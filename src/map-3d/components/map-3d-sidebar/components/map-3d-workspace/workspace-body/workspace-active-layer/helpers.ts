import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import { canShowHistogramLayerTypesList } from '../../shared';
import { WorkspaceLayer } from 'map-3d/components/map-3d-sidebar/shared';

export const canLayerShowHistogram = (layer: WorkspaceLayer): boolean =>
  canShowHistogramLayerTypesList.includes(layer.type);

export const isLayerProcessing = (layer: WorkspaceLayer): boolean =>
  !isNil(layer.layerStatus) &&
  layer.layerStatus !== StatusIndicatorLevel.Done &&
  layer.layerStatus !== StatusIndicatorLevel.Completed;

export const isLayerPresentOnMap = (layer: WorkspaceLayer): boolean =>
  !isNil(layer.mapLayer) || !isEmpty(layer.features);
