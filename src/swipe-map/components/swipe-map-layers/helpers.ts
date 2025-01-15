import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { filter, isNil } from 'lodash';
import { Dispatch, SetStateAction } from 'react';
import { Map } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import VectorTileLayer from 'ol/layer/VectorTile';
import { createTiledLayer, getTiledLayer } from '../../helpers';
import { LayerListItem, LayerType } from 'shared/api';
import { FileType } from 'shared/hooks';
import {
  OlLayersType,
  getMapBoxTiledLayer,
  getRasterTiledLayer,
} from 'shared/resources/openlayers';
import { getLayerFilesStatus, getLayerStatus } from 'src/layers/helpers';

export const addMapboxOrtho = (
  layer: LayerListItem,
  swipeRef: React.MutableRefObject<HTMLInputElement>,
  isRight: boolean,
) => {
  const { sourceId, id, name } = layer;

  if (!sourceId) {
    return;
  }

  // Moving the ortho layer to the bottom using z-index -1.
  const tiledOrtho = getMapBoxTiledLayer(sourceId, true, 1, -1);
  const mapTileLayer = createTiledLayer(tiledOrtho, swipeRef, isRight);

  if (!isNil(mapTileLayer)) {
    const orthoLayer = {
      [id]: {
        name,
        tileLayer: mapTileLayer,
        show: true,
        processing: false,
      },
    };

    return orthoLayer;
  }
};

export const addSelfHostedOrtho = (
  layer: LayerListItem,
  swipeRef: React.MutableRefObject<HTMLInputElement>,
  isRight: boolean,
) => {
  if (!isNil(layer.files)) {
    const isOrthoInProcess =
      getLayerFilesStatus(layer.files) !== StatusIndicatorLevel.Done;

    const orthoFile = filter(layer.files, {
      type: FileType.OrthomosaicCog,
    })?.[0];

    if (isNil(orthoFile)) {
      return;
    }

    const tileLayer = getRasterTiledLayer(
      orthoFile.s3Key,
      -1,
      !isOrthoInProcess,
    );

    const mapTiledLayer = createTiledLayer(tileLayer, swipeRef, isRight);

    if (!isNil(mapTiledLayer)) {
      const orthoLayer: OlLayersType = {
        [layer.id]: {
          name: layer.name,
          tileLayer: mapTiledLayer,
          show: !isOrthoInProcess,
          processing: isOrthoInProcess,
        },
      };

      return orthoLayer;
    }
  }
};

export const addSwipeMapLayer = (
  layer: LayerListItem,
  isRight: boolean,
  setOrthomosaicLayers: Dispatch<SetStateAction<OlLayersType | null>>,
  swipeRef: React.MutableRefObject<HTMLInputElement>,
  map: Map,
) => {
  switch (layer.type) {
    // Currently not showing slope map in OL.
    case LayerType.SlopeMap:
      break;
    case LayerType.Orthomosaic:
      let orthoLayer: OlLayersType | undefined;
      if (!isNil(layer.sourceId)) {
        orthoLayer = addMapboxOrtho(layer, swipeRef, isRight);
      } else if (getLayerStatus(layer) === StatusIndicatorLevel.Done) {
        orthoLayer = addSelfHostedOrtho(layer, swipeRef, isRight);
      }

      if (orthoLayer) {
        const { tileLayer } = orthoLayer[layer.id] || {};
        if (tileLayer) {
          map.addLayer(tileLayer);
        }
        setOrthomosaicLayers((prevOrtho) => {
          return {
            ...prevOrtho,
            ...orthoLayer,
          };
        });
      }
      break;
    default:
      const isLayerProcessing =
        getLayerStatus(layer) !== StatusIndicatorLevel.Done;
      let mapTileLayer: TileLayer<XYZ> | VectorTileLayer | undefined;

      if (!isLayerProcessing) {
        const tiledLayer: TileLayer<XYZ> | VectorTileLayer =
          getTiledLayer(layer);
        mapTileLayer = createTiledLayer(tiledLayer, swipeRef, isRight);

        if (!isNil(mapTileLayer)) {
          map.addLayer(mapTileLayer);
        }
      }

      return {
        show: false,
        name: layer.name,
        tileLayer: mapTileLayer,
        processing: isLayerProcessing,
      };
  }
};
