import { sortBy } from 'lodash';
import { SwipeMapLayer } from '../types';
import { BatchJobFileStatusMapping } from 'map-3d/components';
import { CapturedDsmCogInfo, CogMetadataType, LayerType } from 'shared/api';
import { BoundingBox } from 'shared/cesium';
import { getInitialRescaleValue } from 'shared/components';
import { CustomDate } from 'shared/utils';

export const createSwipeMapDsmLayer = (
  iterationId: string,
  cogMetadata: CogMetadataType,
  capturedDsmCog: CapturedDsmCogInfo,
): SwipeMapLayer => {
  const dsmSwipeMapLayer: SwipeMapLayer = {
    id: iterationId,
    name: 'DSM',
    type: LayerType.CapturedDsm,
    createdAt: new CustomDate(capturedDsmCog.createdAt),
    status: BatchJobFileStatusMapping[capturedDsmCog.batchJob.status],
    show: false,
    histogramData: {
      sourceFilePath: capturedDsmCog.batchJob.path,
      metadata: cogMetadata,
      opacity: 100,
      rescale: getInitialRescaleValue(
        cogMetadata,
        capturedDsmCog.batchJob.path,
      ),
    },
  };

  return dsmSwipeMapLayer;
};

// Sort layers such that DSM layers are placed on top.
export const prioritizeDsmLayers = (layers: SwipeMapLayer[]) => {
  const result = sortBy(layers, ({ type }) =>
    type === LayerType.CapturedDsm ? 0 : 1,
  );

  return result;
};

/**
 * Calculates the cumulative bounding box by merging the current layer's bounds
 * with an existing cumulative bounding box.
 *
 * @param {BoundingBox} currentLayerBounds - The bounding box of the current layer.
 * @param {BoundingBox} cumulativeBoundingBox - The existing cumulative bounding box.
 * @returns {BoundingBox} - The updated cumulative bounding box that includes the current layer's bounds.
 */
export const calculateBoundingBox = (
  currentLayerBounds: BoundingBox,
  cumulativeBoundingBox: BoundingBox,
): BoundingBox => [
  Math.min(cumulativeBoundingBox[0], currentLayerBounds[0]),
  Math.min(cumulativeBoundingBox[1], currentLayerBounds[1]),
  Math.max(cumulativeBoundingBox[2], currentLayerBounds[2]),
  Math.max(cumulativeBoundingBox[3], currentLayerBounds[3]),
];
