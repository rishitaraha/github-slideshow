import { isNil } from 'lodash';
import { Tile as TileLayer } from 'ol/layer';
import VectorTileLayer from 'ol/layer/VectorTile';
import { XYZ } from 'ol/source';
import { LayerListItem, LayerType } from '../shared/api';
import {
  getMBTileLayer,
  getMVTLayer,
  getMapBoxTiledLayer,
} from '../shared/resources/openlayers';

export const createTiledLayer = (
  layer: TileLayer<XYZ> | VectorTileLayer,
  swipeRef: React.MutableRefObject<HTMLInputElement>,
  isRight: boolean,
) => {
  if (isNil(layer)) {
    return;
  }

  layer.on(['prerender'], function (event: any) {
    const canvasRenderingContext = event.context;
    // Calculating percentage width of left side of swipe bar.
    const width =
      canvasRenderingContext.canvas.width *
      (parseFloat(swipeRef.current.value) / 100);
    // Calculate x and rectWidth acc to which side's tile it is.
    const x = isRight ? width : 0;
    const rectWidth = isRight
      ? canvasRenderingContext.canvas.width - width
      : width;

    canvasRenderingContext.save();
    canvasRenderingContext.beginPath();
    canvasRenderingContext.rect(
      x,
      0,
      rectWidth,
      canvasRenderingContext.canvas.height,
    );
    canvasRenderingContext.clip();
  });

  layer.on(['postrender'], function (event: any) {
    const canvasRenderingContext = event.context;
    canvasRenderingContext.restore();
  });
  return layer;
};

export const getTiledLayer = (
  layer: LayerListItem,
): TileLayer<XYZ> | VectorTileLayer => {
  let tiledLayer;
  if (layer.type === LayerType.Vector) {
    tiledLayer = getMVTLayer({
      layerId: layer.id,
      extent: layer.properties?.bounds,
      minZoom: layer.properties?.minzoom,
      maxZoom: layer.properties?.maxzoom,
      styles: layer.mapLayerStyles,
    });
  } else if (layer.type === LayerType.MBTiles && layer.tiles) {
    tiledLayer = getMBTileLayer({
      s3FileKey: layer.tiles.s3Key,
      extent: layer.properties?.bounds,
      minZoom: layer.properties?.minzoom,
      maxZoom: layer.properties?.maxzoom,
    });
  } else if (layer.type === LayerType.Contour && layer.tiles) {
    tiledLayer = getMVTLayer({
      s3FileKey: layer.tiles.s3Key,
      extent: layer.properties?.bounds,
      minZoom: layer.properties?.minzoom,
      maxZoom: layer.properties?.maxzoom,
      styles: layer.mapLayerStyles,
    });
  } else {
    tiledLayer = layer.sourceId && getMapBoxTiledLayer(layer.sourceId);
  }
  return tiledLayer;
};
