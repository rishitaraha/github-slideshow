import {
  CesiumTerrainProvider,
  ImageryLayer,
  Resource,
  TerrainProvider,
} from 'cesium';
import { FileDataType } from '../../../api';
import { HistogramDataType } from '../../../types';
import { WorkspaceLayer } from '../../../../map-3d/components';
import { Map3DTerrainProviderType } from 'map-3d/types';
import { SwipeMapLayer } from 'src/swipe-map-3d';

export type ImageryLayerParams = {
  show: boolean;
  zIndex?: number;
};

export type ImageryLayerQueryParams = {
  rescale?: string;
  fileKey?: string;
};

export type ImageryLayerMetadata = {
  bounds: Array<number>;
  minzoom: number;
  maxzoom: number;
};

export type AddMapLayerParams = {
  layer: WorkspaceLayer | SwipeMapLayer;
  addTerrainLayerCallback?: (terrainLayer: Map3DTerrainProviderType) => void;
  show?: boolean;
  terrainProvider?: Map3DTerrainProviderType;
};

export interface ICesiumLayerManager {
  /**
   * To add terrain provider to the cesium map
   * @param iterationId string
   * @param file_key string
   */
  addTerrain: (
    iterationId: string,
    file_key: string,
  ) => Promise<TerrainProvider>;

  /**
   * To add ImageryLayer to cesium using UrlTemplate resource
   * @param resource Resource.ConstructorOptions
   * @param metadata ImageryLayerMetadata
   * @param imageryLayerParams ImageryLayerParams
   */
  addRasterImageryLayer: (
    resource: Resource | Resource.ConstructorOptions,
    metadata: ImageryLayerMetadata,
    imageryLayerParams?: ImageryLayerParams,
  ) => ImageryLayer;

  /**
   * Add MbTiles layer using UrlTemplateImageryProvider and return the mapLayer if it is successfully added to cesium.
   * @param tilesSrc FileDataType
   * @param properties any
   * @param imageryLayerParams ImageryLayerParams
   * @returns ImageryLayer | null
   */
  addMbTilesLayerToCesium: (
    tilesSrc: FileDataType,
    properties: any,
    imageryLayerParams: ImageryLayerParams,
  ) => ImageryLayer | undefined;

  /**
   * Add Mapbox layer using UrlTemplateImageryProvider and return the mapLayer if it is successfully added to cesium.
   * @param sourceId String
   * @param imageryLayerParams ImageryLayerParams
   * @returns ImageryLayer | null
   */
  addMapboxLayerToCesium: (
    sourceId: string,
    imageryLayerParams: ImageryLayerParams,
  ) => ImageryLayer | undefined;

  /**
   * Add cesium layer using MVTImageryProvider and return the mapLayer if it is successfully added to cesium.
   * @param tilesSrc FileDataType
   * @param properties any
   * @param styles Cesium StyleSpecification | undefined
   * @param imageryLayerParams ImageryLayerParams
   * @returns ImageryLayer | null
   */
  addVectorTiledLayerToCesium: (
    layer: WorkspaceLayer,
    imageryLayerParams: ImageryLayerParams,
  ) => Promise<ImageryLayer | undefined>;

  /**
   * Adds a new map layer from histogram data.
   * @param cesiumProxy - Cesium proxy
   * @param histogramValues - Histogram data
   * @returns void
   */
  addHistogramLayerToCesium: (
    histogramValues: HistogramDataType,
    imageryLayerParams: ImageryLayerParams,
  ) => ImageryLayer | undefined;

  /**
   * To remove ImageryLayers
   * @param layer ImageryLayer[]
   */
  removeImageryLayers: (layers: ImageryLayer[]) => void;

  /**
   *  Removing all the previous imagery layer before loading new ones.
   *  This is done in order to avoid overlapping of imagery layers.
   */
  removeAllImageryLayersExceptBase: VoidFunction;

  /**
   * To reset Cesium terrain provider to EllipsoidTerrainProvider
   */
  resetTerrainProvider: VoidFunction;

  /**
   * To set terrain provider for the Cesium map
   * @param terrainProvider TerrainProvider
   */
  setTerrainProvider: (terrainProvider: TerrainProvider) => void;

  /**
   * To set Cesium Terrain Provider using CesiumIon
   * @param sourceId string
   */
  setCesiumIonTerrainProvider: (
    sourceId: string,
  ) => Promise<CesiumTerrainProvider>;

  /**
   * To raise imagery layer to top by increasing z-index
   * @param imageryLayer ImageryLayer
   * @returns void
   */
  raiseImageryLayerToTop: (imageryLayer: ImageryLayer) => void;

  /**
   * Raise imagery layer by 1 z-index
   * @param imageryLayer ImageryLayer
   * @returns void
   */
  raiseImageryLayer: (imageryLayer: ImageryLayer) => void;

  /**
   * Lower imagery layer by 1 z-index
   * @param imageryLayer ImageryLayer
   * @returns void
   */
  lowerImageryLayer: (imageryLayer: ImageryLayer) => void;

  /**
   * Return the z-index of given imagery layer
   * @param imageryLayer ImageryLayer
   * @returns Number
   */
  getZIndex: (imageryLayer?: ImageryLayer) => number | undefined;

  /**
   * Generalised wrapper function to add map layers.
   * @param layer The layer object whose map layer has to be added.
   * @param show Flag to control if the map layer has to be displayed.
   * @param addTerrainLayerCallback Callback which exposes the terrain provider.
   *        Usage: This callback can be used to add the terrain provider to redux.
   * @param terrainProvider Terrain provider to add terrain
   *
   * @returns The imagery layer wrapped in a promise.
   */
  addMapLayer: (
    mapLayerArgs: AddMapLayerParams,
  ) => Promise<ImageryLayer | undefined>;

  /**
   * Adds self hosted orthomosaic.
   * @param orthomosaicCog The COG file of orthomosaic.
   * @returns Orthomosaics imagery layer.
   */
  addSelfHostedOrtho: (
    orthomosaicCog: FileDataType,
  ) => ImageryLayer | undefined;
}
