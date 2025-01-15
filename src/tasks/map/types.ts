import { IconIdentifier } from '@aus-platform/design-system';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import { Geometry } from 'ol/geom';
import { Map } from 'ol';
import { Draw } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import VectorSource from 'ol/source/Vector';
import { Style } from 'ol/style';
import { WebGLStyle } from 'ol/style/webgl';
import { MutableRefObject } from 'react';
import {
  CursorStyle,
  DrawingStyle,
  DrawingTool,
  DrawingType,
  MapLayerType,
  MapPointTypes,
  MeasureType,
} from './enums';
import { GCPData, GeotagImageObj, IterationDataset } from 'src/shared/api';

export type VectorLayerType =
  | MapLayerType.ClippingBoundary
  | MapLayerType.CroppingRegion
  | MapLayerType.ReferenceLayer;

export type PointLayerType =
  | MapLayerType.GCP
  | MapLayerType.UntaggedGCP
  | MapLayerType.Checkpoint
  | MapLayerType.UntaggedCheckpoint
  | MapLayerType.Geotag
  | MapLayerType.AlignedImages
  | MapLayerType.UnalignedImages;

export type XYZLayerType = MapLayerType.Orthomosaic | MapLayerType.SurfaceModel;

export type XYZLayerData = {
  type: XYZLayerType;
  visible: boolean;
  extent: number[];
  isExtent: boolean;
  zIndex: number;
  key: string;
  rescale: string;
  metadata: any;
  epsgCRS: string;
  name?: string;
};

export type WebGLPointsLayerData = {
  type: PointLayerType;
  visible: boolean;
  isExtent: boolean;
  zIndex: number;
  sourceData: GeotagImageObj[] | GCPData[];
  style: WebGLStyle; // Specific style type for WebGLPointsLayer
  showActionButton: boolean;
  onClick: (state) => void;
  name?: string;
  extent?: number[];
};

export type VectorLayerData = {
  type: VectorLayerType;
  visible: boolean;
  isExtent: boolean;
  zIndex: number;
  style?: Style[]; // Specific style type for VectorLayer
  sourceData?: string;
  name?: string;
  extent?: number[];
};

export type ViewLayersDataType =
  | WebGLPointsLayerData
  | VectorLayerData
  | XYZLayerData;

export type MapMeasureInteractionType = {
  [type: string]: {
    draw: Draw;
    source: VectorSource;
    measureOverlayRef: React.MutableRefObject<Overlay | null | undefined>;
    measureTooltipRef: React.MutableRefObject<HTMLElement | null | undefined>;
  };
};

export type MapDrawInteractionType = {
  [type: string]: DrawInteractionDetails;
};

export type DrawInteractionDetails = {
  draw: Draw;
  source: VectorSource;
};

export type ViewLayerType = {
  type: MapLayerType;
  visible: boolean;
  layer: WebGLPointsLayer<any> | VectorLayer<any> | TileLayer<any>;
  isExtent: boolean;
  zIndex: number;
  name?: string;
  extent?: number[];
};

export type DrawInteractionType = {
  type: DrawingType;
  viewStyleType: DrawingStyle;
  drawStyleType: DrawingStyle;
  features: Feature<Geometry>[];
  tool: DrawingTool;
  onSave: (e) => void;
  ref: MutableRefObject<DrawInteractionDetails | null>;
  iconIdentifier: IconIdentifier;
};

export type MeasureInteractionType = {
  type: MeasureType;
  viewStyleType: DrawingStyle;
  drawStyleType: Style;
  tool: DrawingTool;
  iconIdentifier: IconIdentifier;
};

export type MapComponentProps = {
  viewLayers: ViewLayerType[];
  showMeasureTool?: boolean;
  showSpotCheckTool?: boolean;
  demS3ObjectKey?: string;
  hasBothAlignedAndUnalignedImages?: boolean;
};

export type MapPopupProps = {
  id: string;
  popupType: MapLayerType;
  name: string;
  showActionButton: boolean;
  onActionButtonClick: (state) => void;
  latitude: number;
  longitude: number;
  altitude: number;
};

export type LocationMarkerData = {
  header: string;
  lat: number;
  long: number;
  alt: number;
  type: MapPointTypes;
  imageId?: string;
  haveImage?: boolean;
};

// COG Metadata.
export type COGMetadataType = {
  bounds: [number, number, number, number];
  minzoom: number;
  maxzoom: number;
  width: number;
  height: number;
  statistics: any;
};

export type CreateMapComponentProps = {
  dataset: IterationDataset;
  geotagImageDetails: {
    items: GeotagImageObj[];
    showActionButton: boolean;
    onClick: (event: unknown) => void;
  };
  gcpDetails: {
    items: GCPData[];
    showActionButton: boolean;
    onClick: (event: unknown) => void;
  };
  dsmMetadata?: COGMetadataType;
  orthoMetadata?: COGMetadataType;
};

export type ToolType = 'none' | 'inspect' | 'measure' | 'reference';

export type MapMeasureInteraction = {
  [key: string]: {
    draw: Draw;
    source: VectorSource<Feature<Geometry>>;
    measureOverlayRef: React.MutableRefObject<Overlay | undefined>;
    measureTooltipRef: React.MutableRefObject<HTMLElement | undefined>;
  };
};

export type MeasureInteraction = {
  type: string;
  tool: string;
  viewStyleType: any;
  drawStyleType: any;
  iconIdentifier?: IconIdentifier;
};

export type ViewLayer = {
  layer: VectorLayer<any>;
  visible: boolean;
  isExtent: boolean;
  extent?: number[];
};

export type UseMapMeasureToolsProps = {
  setCursorStyle: (c: CursorStyle) => void;
  map?: Map;
  measureLayersConfig?: MeasureInteraction[];
};
