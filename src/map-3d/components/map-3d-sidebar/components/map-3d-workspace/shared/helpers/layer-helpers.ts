import { Cartographic, Rectangle } from 'cesium';
import { filter, isNil } from 'lodash';
import { WorkspaceLayer, WorkspaceLayerListObj } from '../../../../shared';
import { removeAllFeatures, removeMapLayer } from '.';
import {
  LayerQueryKey,
  LayerType,
  SiteListItem,
  queryClient,
} from 'shared/api';
import { BoundingBox, CesiumProxy } from 'shared/cesium';
import { FileType } from 'shared/hooks';
import { DrawingTools } from 'src/map-3d/shared/map-3d-tools';
import { SwipeMapLayer } from 'src/swipe-map-3d';

export const getLayerMetadata = (layer: WorkspaceLayer | SwipeMapLayer) => {
  let properties;

  switch (layer.type) {
    case LayerType.Orthomosaic:
      properties = layer.files?.find(
        (file) => file.type === FileType.OrthomosaicCog,
      )?.properties;
      break;

    case LayerType.SlopeMap:
      properties = layer.files?.find(
        (file) => file.type === FileType.SlopeMap,
      )?.properties;
      break;
    case LayerType.MBTiles:
    case LayerType.Contour:
      properties = layer.tiles?.properties;
      break;
    case LayerType.CapturedDsm:
      properties = layer.histogramData?.metadata;
      break;
    default:
      properties = layer.properties;
      break;
  }

  return properties;
};

/**
 * Initially zIndex is undefined when layer response is loading,
 * thus using 9999 in it's place.
 *
 * @param layers WorkspaceLayer[]
 */
export const sortLayers = (layers: WorkspaceLayer[]) => {
  return layers.sort((layer1, layer2) => {
    const zIndex1 = layer1.zIndex ?? Number.MAX_VALUE;
    const zIndex2 = layer2.zIndex ?? Number.MAX_VALUE;

    return zIndex2 - zIndex1;
  });
};

export const refetchSingleLayer = (layerId: string) => {
  queryClient.refetchQueries({
    queryKey: [`${LayerQueryKey.Layers}/${layerId}`],
    exact: true,
  });
};

/**
 * Sets the visibility of vector layers.
 * @param workspaceLayers WorkspaceLayerListObj
 * @param show boolean
 */
export const setVectorLayerVisibility = (
  workspaceLayers: WorkspaceLayerListObj,
  show: boolean,
) => {
  const vectorLayers = filter(
    workspaceLayers,
    (layer) => layer.type === LayerType.Vector,
  );

  vectorLayers.forEach((activeLayer) => {
    if (activeLayer.mapLayer) {
      activeLayer.mapLayer.show = show;
    }
  });
};

/**
 * Remove layers features and map layer from the map
 *
 * @param layer WorkspaceLayer
 * @param drawingTools DrawingTools | null
 * @param cesiumProxy CesiumProxy | null
 */
export const removeWorkspaceLayersFromMap = (
  layers: WorkspaceLayer[],
  drawingTools: DrawingTools | null,
  cesiumProxy: CesiumProxy | null,
) => {
  layers.forEach((layer) => {
    if (layer.features && drawingTools) {
      removeAllFeatures(layer, drawingTools);
    }

    if (layer.mapLayer && cesiumProxy) {
      removeMapLayer(cesiumProxy, layer.mapLayer);
    }
  });
};

/**
 * Zooms to a layer in case it's bounds are present else zooms to the current site's bounds.
 * @param layer WorkspaceLayer
 * @param cesiumProxy CesiumProxy
 * @param site SiteListItem | null
 */
export const zoomToLayer = (
  layer: WorkspaceLayer,
  cesiumProxy: CesiumProxy | null,
  site: SiteListItem | null,
) => {
  if (isNil(cesiumProxy) || isNil(site)) {
    return;
  }

  const properties = getLayerMetadata(layer);

  const destination: Cartographic = properties?.bounds
    ? Rectangle.center(Rectangle.fromDegrees(...properties.bounds))
    : Cartographic.fromDegrees(site.longitude, site.latitude);

  let altitudeAtDestination = cesiumProxy?.getGlobeHeight(destination) ?? 0;

  // altitudeAtDestination will be negative if terrain is not available.
  altitudeAtDestination =
    altitudeAtDestination < 0 ? 5000 : altitudeAtDestination + 5000;

  destination.height = altitudeAtDestination;

  cesiumProxy?.flyCameraTo({
    destination: Cartographic.toCartesian(destination),
    duration: 1,
  });
};

/**
 * From BE we get bounds as [Long, Lat, Long, Lat]
 *
 * Bounding box of all layers = min Longitude , min Latitude , max Longitude , max Latitude
 *
 * @param layers List of layers for which we want bounds for.
 * @returns bounds
 */
export const getLayerBounds = (
  layers: WorkspaceLayerListObj,
): BoundingBox | undefined => {
  const layerBounds = Object.values(layers).map((layer) =>
    getLayerMetadata(layer)?.bounds?.map(Number),
  );

  if (isNil(layerBounds) || !layerBounds.length || layerBounds.every(isNil)) {
    return;
  }

  const bounds = layerBounds.reduce((previousValue, current) => {
    if (!current || !previousValue) {
      return previousValue;
    }

    previousValue[0] = Math.min(previousValue[0], current[0]);
    previousValue[1] = Math.min(previousValue[1], current[1]);
    previousValue[2] = Math.max(previousValue[2], current[2]);
    previousValue[3] = Math.max(previousValue[3], current[3]);

    return previousValue;
  });

  return bounds;
};
