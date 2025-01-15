import { CesiumViewer, MVTImageryProvider } from '@aus-platform/cesium';

import {
  CesiumTerrainProvider,
  Color,
  EllipsoidTerrainProvider,
  ImageryLayer,
  ImageryProvider,
  MapboxStyleImageryProvider,
  Rectangle,
  Resource,
  TerrainProvider,
  UrlTemplateImageryProvider,
} from 'cesium';
import { isEmpty, isNil, isNull, isUndefined } from 'lodash';
import { FileDataType, getAuthHeader, LayerType } from '../../../api';
import { EnvVariables } from '../../../env-variables';
import { HistogramDataType } from '../../../types';
import { CesiumBase } from '../../base';
import { FileType } from '../../../hooks';
import {
  AddMapLayerParams,
  ICesiumLayerManager,
  ImageryLayerMetadata,
  ImageryLayerParams,
} from './types';
import { getLayerMetadata, WorkspaceLayer } from 'map-3d/components';
import { SwipeMapLayer } from 'src/swipe-map-3d';

export class CesiumLayerManager
  extends CesiumBase
  implements ICesiumLayerManager
{
  constructor(viewer: CesiumViewer) {
    super(viewer);
  }

  async addTerrain(iterationId: string, file_key: string) {
    const baseUrl = !isUndefined(EnvVariables.tileServerUrl)
      ? `${EnvVariables.tileServerUrl}/terrain/`
      : `${EnvVariables.terrainServerUrl}/`;

    const terrainResource = new Resource({
      url: baseUrl,
      headers: {
        ...getAuthHeader(),
      },
      queryParameters: { iteration_id: iterationId, key: file_key },
    });

    const terrainProvider = await CesiumTerrainProvider.fromUrl(
      terrainResource,
      {
        requestVertexNormals: true,
      },
    );

    this.baseViewer.terrainProvider = terrainProvider;
    return terrainProvider;
  }

  addRasterImageryLayer(
    resourceOptions: Resource.ConstructorOptions,
    metadata: ImageryLayerMetadata,
    imageryLayerParams?: ImageryLayerParams,
  ) {
    const urlImageryResource = new Resource({
      url: resourceOptions.url,
      headers: {
        ...getAuthHeader(),
      },
      queryParameters: { ...resourceOptions.queryParameters },
    });

    const urlImageryProvider = new UrlTemplateImageryProvider({
      url: urlImageryResource,
      rectangle: Rectangle.fromDegrees(...metadata.bounds),
      minimumLevel: metadata.minzoom,
      maximumLevel: metadata.maxzoom,
    });

    // TODO: refactor index.
    const addedLayer = this.baseViewer.imageryLayers.addImageryProvider(
      urlImageryProvider,
      imageryLayerParams?.zIndex,
    );

    if (imageryLayerParams?.show) {
      addedLayer.show = imageryLayerParams.show;
    }

    return addedLayer;
  }

  addMbTilesLayerToCesium(
    tilesSrc: FileDataType,
    properties: any,
    imageryLayerParams: ImageryLayerParams,
  ) {
    let cesiumImageryLayer: ImageryProvider | null = null;

    if (isNil(tilesSrc)) {
      throw Error("MbTiles' Layer tiles have not been generated.");
    }

    const baseUrl = !isNil(EnvVariables.tileServerUrl)
      ? `${EnvVariables.tileServerUrl}/mbtiles/{z}/{x}/{y}.png`
      : `${EnvVariables.vectorServerUrl}/{z}/{x}/{y}.png`;
    const imageryResource = new Resource({
      url: baseUrl,
      headers: {
        ...getAuthHeader(),
      },
      queryParameters: { key: tilesSrc.s3Key },
    });

    cesiumImageryLayer = new UrlTemplateImageryProvider({
      url: imageryResource,
      rectangle: properties
        ? Rectangle.fromDegrees(...properties.bounds)
        : undefined,
      minimumLevel: properties?.minzoom,
      maximumLevel: properties?.maxzoom,
    });

    const addedLayer = this.baseViewer.imageryLayers.addImageryProvider(
      cesiumImageryLayer,
      imageryLayerParams.zIndex,
    );
    addedLayer.show = imageryLayerParams.show;

    // For ortho black background.
    addedLayer.colorToAlpha = Color.BLACK;

    return addedLayer;
  }

  addMapboxLayerToCesium(
    sourceId: string,
    imageryLayerParams: ImageryLayerParams,
  ): ImageryLayer | undefined {
    let cesiumImageryLayer: ImageryProvider | null = null;

    if (!isNil(sourceId) && !isEmpty(sourceId)) {
      if (
        EnvVariables.mapBoxUsername &&
        sourceId.includes(EnvVariables.mapBoxUsername)
      ) {
        const mapboxRasterTilesImagerySource = new Resource({
          url: `https://api.mapbox.com/v4/${sourceId}/{z}/{x}/{y}@2x.png`,
          queryParameters: { access_token: EnvVariables.mapBoxAccessToken },
        });

        // TODO: Use MapboxImageryProvider.
        cesiumImageryLayer = new UrlTemplateImageryProvider({
          url: mapboxRasterTilesImagerySource,
          maximumLevel: 22,
        });
      } else {
        cesiumImageryLayer = new MapboxStyleImageryProvider({
          username: 'saitejaus',
          styleId: sourceId,
          accessToken: EnvVariables.mapBoxAccessToken ?? '',
          maximumLevel: 22,
        });
      }
    }

    if (!isNull(cesiumImageryLayer)) {
      const addedLayer = this.baseViewer.imageryLayers.addImageryProvider(
        cesiumImageryLayer,
        imageryLayerParams.zIndex,
      );
      addedLayer.show = imageryLayerParams.show;

      // For ortho black background.
      addedLayer.colorToAlpha = Color.BLACK;

      return addedLayer;
    }
  }

  async addVectorTiledLayerToCesium(
    layer: WorkspaceLayer | SwipeMapLayer,
    imageryLayerParams: ImageryLayerParams,
  ): Promise<ImageryLayer | undefined> {
    const { mapLayerStyles, tiles, properties } = layer;

    if (layer.type === LayerType.Contour && isNil(tiles)) {
      throw Error('Contour layer tiles have not been generated.');
    }

    if (isNil(mapLayerStyles)) {
      return;
    }

    const baseTileUrl = !isNil(EnvVariables.tileServerUrl)
      ? `${EnvVariables.tileServerUrl}/vector/{z}/{x}/{y}.pbf`
      : `${EnvVariables.vectorServerUrl}/{z}/{x}/{y}.pbf`;

    const queryParam =
      layer.type === LayerType.Contour
        ? `key=${tiles?.s3Key}`
        : `layer_id=${layer.id}`;

    const tileUrl = `${baseTileUrl}?${queryParam}`;

    Object.keys(mapLayerStyles.sources).forEach((styleSourceKey) => {
      mapLayerStyles.sources[styleSourceKey]['tiles'] = [tileUrl];

      if (properties?.bounds) {
        mapLayerStyles.sources[styleSourceKey]['bounds'] = properties.bounds;
      }
    });

    const mvtProvider = new MVTImageryProvider({
      style: mapLayerStyles,
      minzoom: properties?.minzoom ?? 10,
      maxzoom: properties?.maxzoom ?? 22,
      bounds: properties?.bounds,
      transformRequest(url, resourceType) {
        const res = { url };

        if (resourceType == 'Tile') {
          res['headers'] = getAuthHeader();
        }

        return res;
      },
    });

    return mvtProvider.readyPromise.then(() => {
      const addedMvtLayer: ImageryLayer =
        this.baseViewer.imageryLayers.addImageryProvider(
          mvtProvider as unknown as ImageryProvider,
          imageryLayerParams.zIndex,
        );

      addedMvtLayer.show = imageryLayerParams.show;
      return addedMvtLayer;
    });
  }

  addHistogramLayerToCesium(
    histogramValues: HistogramDataType,
    imageryLayerParams: ImageryLayerParams,
  ) {
    const { rescale, opacity, sourceFilePath, metadata } = histogramValues;

    if (isNil(rescale) || isNil(sourceFilePath) || isNil(metadata)) {
      return;
    }

    const baseUrl = !isNil(EnvVariables.tileServerUrl)
      ? `${EnvVariables.tileServerUrl}/histogram/{z}/{x}/{y}.png`
      : `${EnvVariables.rasterServerUrl}/{z}/{x}/{y}.png`;
    const imageryResource = new Resource({
      url: baseUrl,
      headers: {
        ...getAuthHeader(),
      },
      queryParameters: { key: sourceFilePath, rescale },
    });

    const cesiumImageryLayer = new UrlTemplateImageryProvider({
      url: imageryResource,
      rectangle: Rectangle.fromDegrees(...metadata.bounds),
      minimumLevel: metadata.minzoom,
      maximumLevel: metadata.maxzoom,
    });

    if (!isNull(cesiumImageryLayer)) {
      const addedLayer = this.baseViewer.imageryLayers.addImageryProvider(
        cesiumImageryLayer,
        imageryLayerParams.zIndex,
      );

      const currentOpacityValue = !isNil(opacity)
        ? parseFloat(opacity.toString()) / 100.0
        : 100.0;
      addedLayer.show = imageryLayerParams.show;
      addedLayer.alpha = currentOpacityValue;

      return addedLayer;
    }
  }

  addSelfHostedOrtho(orthomosaicCog: FileDataType) {
    let orthoImageryLayer;

    if (orthomosaicCog.properties) {
      orthoImageryLayer = this.addRasterImageryLayer(
        {
          url: `${EnvVariables.tileServerUrl}/ortho/{z}/{x}/{y}.png`,
          queryParameters: { key: orthomosaicCog.s3Key },
        },
        {
          ...orthomosaicCog.properties,
        },
      );
    }

    return orthoImageryLayer;
  }

  async addMapLayer({
    layer,
    show,
    addTerrainLayerCallback,
    terrainProvider,
  }: AddMapLayerParams) {
    const showMapLayer = show ?? layer.show ?? true;

    let mapLayer: ImageryLayer | undefined = layer.mapLayer;

    // If map layer exists only toggle the visiblity; no need to add the maplayer.
    if (mapLayer) {
      mapLayer.show = showMapLayer;
    }

    const { type, sourceId, tiles, files, zIndex } = layer;
    const properties = getLayerMetadata(layer);

    switch (type) {
      case LayerType.Cesium:
        if (!terrainProvider && addTerrainLayerCallback && !isNil(sourceId)) {
          const terrainProvider =
            await this.setCesiumIonTerrainProvider(sourceId);

          addTerrainLayerCallback({
            show: showMapLayer,
            terrainProvider,
          });
        }
        break;
      case LayerType.MapBox:
        mapLayer = this.addMapboxLayerToCesium(sourceId || '', {
          show: showMapLayer,
          zIndex,
        });
        break;
      case LayerType.Orthomosaic:
        if (!isEmpty(sourceId)) {
          mapLayer = this.addMapboxLayerToCesium(sourceId || '', {
            show: showMapLayer,
            zIndex,
          });
        } else {
          const orthomosaicCog = files?.find(
            (file) => file.type === FileType.OrthomosaicCog,
          );

          if (orthomosaicCog) {
            mapLayer = this.addSelfHostedOrtho(orthomosaicCog);
          }
        }
        break;
      case LayerType.MBTiles:
        if (!isNil(tiles)) {
          mapLayer = this.addMbTilesLayerToCesium(tiles, properties, {
            show: showMapLayer,
            zIndex,
          });
        }
        break;
      case LayerType.Vector:
      case LayerType.Contour:
        if (type == LayerType.Contour && isNil(tiles)) {
          break;
        }

        mapLayer = await this.addVectorTiledLayerToCesium(layer, {
          show: showMapLayer,
          zIndex,
        });
        break;

      // @TODO: Update handling of slope map layer & DSM Layer in workspace-active-layer.
      case LayerType.CapturedDsm:
      case LayerType.SlopeMap:
        if (layer.histogramData) {
          const { metadata, sourceFilePath, rescale, opacity } =
            layer.histogramData;

          mapLayer = this.addHistogramLayerToCesium(
            {
              metadata,
              sourceFilePath,
              rescale,
              opacity: opacity ?? 100,
            },
            {
              show: showMapLayer,
              zIndex: layer.zIndex,
            },
          );
        }

        break;
    }

    return mapLayer;
  }

  removeImageryLayers(layers: ImageryLayer[]) {
    const imageryLayers = this.baseViewer.imageryLayers;
    layers.forEach((layer) => imageryLayers.remove(layer));
  }

  removeAllImageryLayersExceptBase() {
    const imageryLayers = this.baseViewer.imageryLayers;

    for (let index = 2; index < imageryLayers.length; index++) {
      const imageryLayer = imageryLayers.get(index);
      imageryLayer.show = false;
      imageryLayers.remove(imageryLayer);
    }
  }

  resetTerrainProvider() {
    this.setTerrainProvider(new EllipsoidTerrainProvider({}));
  }

  setTerrainProvider(terrainProvider: TerrainProvider) {
    this.baseViewer.terrainProvider = terrainProvider;
  }

  async setCesiumIonTerrainProvider(sourceId: string) {
    const cesiumIonTerrainProvider = await CesiumTerrainProvider.fromIonAssetId(
      +sourceId,
      {
        requestVertexNormals: true,
      },
    );

    this.baseViewer.terrainProvider = cesiumIonTerrainProvider;

    return cesiumIonTerrainProvider;
  }

  raiseImageryLayerToTop(imageryLayer: ImageryLayer) {
    this.baseViewer.imageryLayers.raiseToTop(imageryLayer);
  }

  raiseImageryLayer(imageryLayer: ImageryLayer) {
    this.baseViewer.imageryLayers.raise(imageryLayer);
  }

  lowerImageryLayer(imageryLayer: ImageryLayer) {
    this.baseViewer.imageryLayers.lower(imageryLayer);
  }

  getZIndex(imageryLayer?: ImageryLayer) {
    let zIndex;

    if (imageryLayer) {
      zIndex = Number(this.baseViewer.imageryLayers.indexOf(imageryLayer));
      zIndex = zIndex === -1 ? undefined : zIndex;
    }

    return zIndex;
  }

  getLength() {
    return this.baseViewer.imageryLayers.length;
  }
}
