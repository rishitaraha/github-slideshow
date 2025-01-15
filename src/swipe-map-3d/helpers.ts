import { isNil, values } from 'lodash';
import { canShowHistogramLayerTypesList } from './constants';
import { SwipeMapLayer, SwipeMapLayerList } from './types';
import { CesiumSplitViewerProxy } from 'shared/cesium';

export const canLayerShowHistogram = (layer: SwipeMapLayer) =>
  canShowHistogramLayerTypesList.includes(layer.type);

export const resetSwipeMap = (
  layerList: SwipeMapLayerList,
  splitViewer: CesiumSplitViewerProxy | null,
  isLeft: boolean = true,
) => {
  // Remove Layers.
  const mapLayers = values(layerList)
    .map(({ mapLayer }) => mapLayer)
    .filter((mapLayer) => !isNil(mapLayer));

  splitViewer?.removeMapLayer(isLeft, mapLayers);

  // Reset Terrain.
  splitViewer?.resetTerrain(isLeft);
};
