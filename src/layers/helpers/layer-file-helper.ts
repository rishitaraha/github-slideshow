import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { FileDataType, LayerListItem, LayerType } from '../../shared/api';
import { FileStatus } from '../../shared/enums';

/**
 * This function takes an array of layerFiles and returns the overall status of the layer files.
 *  - If all layer files status is `done` or `completed` then it will returns `done` or `completed` respectively.
 *  - If any of the file has status other then done or completed then it will return the status of that file.
 *      Means if any of the file has status `error` the overall status will be `error`
 *
 * @param {FileDataType[]} layerFiles - The `layerFiles` parameter is an array of objects of type `LayerFileType`.
 * @returns A `StatusIndicatorLevel` value.
 */
export const getLayerFilesStatus = (layerFiles: FileDataType[]) => {
  const statusCounts: Record<StatusIndicatorLevel, number> = {
    [StatusIndicatorLevel.Completed]: 0,
    [StatusIndicatorLevel.Deleted]: 0,
    [StatusIndicatorLevel.Done]: 0,
    [StatusIndicatorLevel.Failed]: 0,
    [StatusIndicatorLevel.Importing]: 0,
    [StatusIndicatorLevel.Processing]: 0,
    [StatusIndicatorLevel.Started]: 0,
  };

  for (const layerFile of layerFiles) {
    statusCounts[layerFile.status]++;
  }

  // @TODO: Remove Done/Completed status. Keep only one status.s
  if (
    statusCounts[StatusIndicatorLevel.Done] === layerFiles.length &&
    layerFiles.length > 0
  ) {
    return StatusIndicatorLevel.Done;
  }

  if (
    statusCounts[StatusIndicatorLevel.Completed] === layerFiles.length &&
    layerFiles.length > 0
  ) {
    return StatusIndicatorLevel.Completed;
  }

  if (statusCounts[StatusIndicatorLevel.Failed] > 0) {
    return StatusIndicatorLevel.Failed;
  }

  if (statusCounts[StatusIndicatorLevel.Importing] > 0) {
    return StatusIndicatorLevel.Importing;
  }

  if (statusCounts[StatusIndicatorLevel.Started] > 0) {
    return StatusIndicatorLevel.Started;
  }

  if (statusCounts[StatusIndicatorLevel.Processing] > 0) {
    return StatusIndicatorLevel.Processing;
  }

  return StatusIndicatorLevel.Deleted;
};

/**
 * Get layer file/tile status according to the layer type.
 * i.e for mbtiles and contour check the tile status (if it exists) and check file status for the rest
 * @param layer
 * @returns
 */
export const getLayerStatus = (layer: LayerListItem): StatusIndicatorLevel => {
  switch (layer.type) {
    case LayerType.MBTiles:
    case LayerType.Contour:
      if (isNil(layer.tiles) && isNil(layer.files)) {
        console.error('There was an error generating layer tiles.');
      }

      if (isNil(layer.tiles)) {
        return getLayerFilesStatus(layer.files ?? []);
      } else {
        return layer.tiles.status;
      }
    case LayerType.MapBox:
    case LayerType.Cesium:
    case LayerType.Vector:
      if (layer.status == FileStatus.Processing) {
        return StatusIndicatorLevel.Processing;
      }
      return StatusIndicatorLevel.Done;
    case LayerType.Orthomosaic:
      if (layer.sourceId) {
        return StatusIndicatorLevel.Done;
      }
    default:
      if (layer.files) {
        return getLayerFilesStatus(layer.files);
      }
  }

  return StatusIndicatorLevel.Deleted;
};
