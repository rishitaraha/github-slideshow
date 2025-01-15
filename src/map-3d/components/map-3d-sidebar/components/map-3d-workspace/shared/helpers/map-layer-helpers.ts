import { ImageryLayer } from 'cesium';
import { isNil } from 'lodash';
import { CesiumProxy } from '../../../../../../../shared/cesium';
import { WorkspaceLayer } from '../../../../shared';

export const removeMapLayer = (
  cesiumProxy: CesiumProxy,
  mapLayer: ImageryLayer,
) => {
  cesiumProxy.layerManager.removeImageryLayers([mapLayer]);
};

export const updateWorkspaceLayerZIndices = (
  cesiumProxy: CesiumProxy,
  layers: WorkspaceLayer[],
  updateLayer: (WorkspaceLayerListObj) => void,
) => {
  layers.forEach((layer) => {
    const zIndex = cesiumProxy.layerManager.getZIndex(layer.mapLayer);

    updateLayer({
      [layer.id]: {
        ...layer,
        zIndex,
      },
    });
  });
};

export const reorderMapLayers = (
  cesiumProxy,
  layers: WorkspaceLayer[],
  sourceIndex: number,
  destinationIndex: number,
) => {
  let difference = Math.abs(destinationIndex - sourceIndex);
  const mapLayer = layers[sourceIndex].mapLayer;

  if (!isNil(mapLayer)) {
    if (destinationIndex > sourceIndex) {
      while (difference > 0) {
        cesiumProxy?.layerManager.lowerImageryLayer(mapLayer);
        difference--;
      }
    } else {
      while (difference > 0) {
        cesiumProxy?.layerManager.raiseImageryLayer(mapLayer);
        difference--;
      }
    }
  }
};
