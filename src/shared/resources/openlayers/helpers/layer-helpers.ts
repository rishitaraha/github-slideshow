import { isUndefined } from 'lodash';
import { Feature } from 'ol';
import { applyStyle } from 'ol-mapbox-style';
import TileState from 'ol/TileState.js';
import { MVT } from 'ol/format';
import { Geometry } from 'ol/geom';
import { Tile as TileLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import { transformExtent } from 'ol/proj';
import { VectorTile as VectorTileSource, XYZ } from 'ol/source';
import { getArea, getLength } from 'ol/sphere';
import { handleRefreshToken } from '../../../api';
import { EpsgValue } from '../../../enums';
import { EnvVariables } from '../../../env-variables';
import { TokenManager } from '../../../helpers';
import { GetMVTLayerArgsType, GetVectorTiledLayerArgsType } from '../types';

// Ref for adding crossOrigin: https://stackoverflow.com/questions/22710627/tainted-canvases-may-not-be-exported
export const getBaseLayer = (
  url = 'https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}&s=Ga',
) => {
  return new TileLayer({
    visible: true,
    source: new XYZ({
      url,
      crossOrigin: 'Anonymous',
      maxZoom: 22,
      minZoom: 0,
    }),
    zIndex: -1,
  });
};

// Ref: https://github.com/openlayers/openlayers/issues/4213#issuecomment-145149625
export const tileLoadFunction = (tile, src) => {
  const client = new XMLHttpRequest();

  client.open('GET', src);
  client.responseType = 'arraybuffer';
  client.setRequestHeader('Authorization', `Bearer ${TokenManager.getToken()}`);

  client.onload = function () {
    if (this.status == 401) {
      handleRefreshToken().then(() => tileLoadFunction(tile, src));
    } else {
      const arrayBufferView = new Uint8Array(this.response);
      const blob = new Blob([arrayBufferView], { type: 'image/png' });
      const urlCreator = window.URL || (window as any).webkitURL;
      const imageUrl = urlCreator.createObjectURL(blob);
      tile.getImage().src = imageUrl;
    }
  };

  client.send();
};

//Ref: https://openlayers.org/en/latest/apidoc/module-ol_source_VectorTile-VectorTile.html
export const vectorTileLoadFunction = (tile, url) => {
  tile.setLoader(async function (extent, resolution, projection) {
    try {
      let response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TokenManager.getToken()}`,
        },
      });

      // Handle 401 Unauthorized.
      if (response.status == 401) {
        await handleRefreshToken();

        // Retry the tile load with the updated token.
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${TokenManager.getToken()}`,
          },
        });
      }

      if (response.status == 404) {
        tile.setState(TileState.ERROR);
        return;
      }

      const data = await response.arrayBuffer();
      const format = tile.getFormat(); // ol/format/MVT configured as source format
      const features = format.readFeatures(data, {
        extent: extent,
        featureProjection: projection,
      });
      tile.setFeatures(features as Feature<Geometry>[]);
    } catch (error) {
      console.error(error);
      tile.setState(TileState.ERROR);
    }
  });
};

export const getRasterTiledLayer = (
  s3FileKey: string,
  zIndex: number | undefined = undefined,
  visible = false,
): TileLayer<XYZ> => {
  const tileUrl = !isUndefined(EnvVariables.tileServerUrl)
    ? `${EnvVariables.tileServerUrl}/ortho/{z}/{x}/{y}.png?key=${s3FileKey}`
    : `${EnvVariables.rasterServerUrl}/ortho/{z}/{x}/{y}.png?key=${s3FileKey}`;

  return new TileLayer({
    visible,
    source: new XYZ({
      url: tileUrl,
      crossOrigin: 'Anonymous',
      tileLoadFunction,
    }),
    zIndex,
  });
};

export const getMBTileLayer = ({
  visible = false,
  s3FileKey,
  extent,
  maxZoom,
  minZoom,
}: GetVectorTiledLayerArgsType): TileLayer<XYZ> => {
  const tilesExtent = extent
    ? transformExtent(extent, EpsgValue.WGS84, EpsgValue.PseudoMercator)
    : undefined;

  const tileUrl = !isUndefined(EnvVariables.tileServerUrl)
    ? `${EnvVariables.tileServerUrl}/mbtiles/{z}/{x}/{y}.png?key=${s3FileKey}`
    : `${EnvVariables.vectorServerUrl}/{z}/{x}/{y}.png?key=${s3FileKey}`;

  return new TileLayer({
    source: new XYZ({
      url: tileUrl,
      maxZoom,
      minZoom,
      crossOrigin: 'Anonymous',
      tileLoadFunction,
    }),
    visible,
    extent: tilesExtent,
  });
};

export const getMVTLayer = ({
  visible = false,
  s3FileKey,
  layerId,
  zIndex,
  extent,
  maxZoom,
  minZoom,
  styles: style,
}: GetMVTLayerArgsType): VectorTileLayer => {
  const tilesExtent = extent
    ? transformExtent(extent, EpsgValue.WGS84, EpsgValue.PseudoMercator)
    : undefined;

  const baseTileUrl = !isUndefined(EnvVariables.tileServerUrl)
    ? `${EnvVariables.tileServerUrl}/vector/{z}/{x}/{y}.pbf`
    : `${EnvVariables.vectorServerUrl}/{z}/{x}/{y}.pbf`;

  const queryParam = s3FileKey ? `key=${s3FileKey}` : `layer_id=${layerId}`;

  const tileUrl = `${baseTileUrl}?${queryParam}`;

  const layer = new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT(),
      url: tileUrl,
      minZoom,
      maxZoom,
      projection: EpsgValue.PseudoMercator,
      tileLoadFunction: vectorTileLoadFunction,
    }),
    extent: tilesExtent,
    zIndex,
    visible,
  });

  if (style) {
    Object.keys(style.sources).forEach((styleSourceKey) => {
      style.sources[styleSourceKey]['tiles'] = [tileUrl];
    });
    applyStyle(layer, style);
  }
  return layer;
};

export const getMapBoxTiledLayer = (
  sourceId: string,
  visible = false,
  opacity = 1,
  zIndex = 1,
): TileLayer<XYZ> => {
  const url =
    EnvVariables.mapBoxUsername &&
    (sourceId ?? '').includes(EnvVariables.mapBoxUsername)
      ? `https://api.mapbox.com/v4/${sourceId}/{z}/{x}/{y}@2x.png?access_token=${EnvVariables.mapBoxAccessToken}`
      : `https://api.mapbox.com/styles/v1/${EnvVariables.mapBoxUsername}/${sourceId}/tiles/512/{z}/{x}/{y}?access_token=${EnvVariables.mapBoxAccessToken}`;

  return new TileLayer({
    visible,
    source: new XYZ({
      url,
      crossOrigin: 'Anonymous',
    }),
    opacity,
    zIndex,
  });
};

export const formatLength = (line: Geometry) => {
  const length = getLength(line);
  if (length > 1000) {
    return Math.round((length / 1000) * 1000) / 1000 + ' ' + 'km';
  } else {
    return Math.round(length * 1000) / 1000 + ' ' + 'm';
  }
};

export const formatArea = (polygon: Geometry) => {
  const area = getArea(polygon);
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' km sq.';
  } else {
    output = Math.round(area * 100) / 100 + ' m sq.';
  }
  return output;
};
