import { Tile as TileLayer } from 'ol/layer';
import { XYZ } from 'ol/source';
import { Extent } from 'ol/extent';
import { StyleSpecification } from '@aus-platform/cesium';
import VectorTileLayer from 'ol/layer/VectorTile';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type OlLayerType = {
  name: string;
  show: boolean;
  processing?: boolean;
  tileLayer?: TileLayer<XYZ> | VectorTileLayer;
};

export type OlLayersType = {
  [id: string]: OlLayerType;
};

export type GetVectorTiledLayerArgsType = {
  s3FileKey: string;
  extent?: Extent;
  minZoom?: number;
  maxZoom?: number;
  zIndex?: number;
  visible?: boolean;
};

export type GetMVTLayerArgsType = {
  s3FileKey?: string;
  layerId?: string;
  extent?: Extent;
  minZoom?: number;
  maxZoom?: number;
  zIndex?: number;
  visible?: boolean;
  styles?: StyleSpecification;
};
