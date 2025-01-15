import {
  LineStyleOptions,
  PointStyleOptions,
  PolygonStyleOptions,
  StyleSpecification,
  TextboxStyleOptions,
} from '@aus-platform/cesium';
import { AccessType } from '../../../sites/components/enums';
import { FileStatus } from '../../enums';
import { AccessTag } from '../access-tags';
import { Feature, FeatureResponseData, FeaturesCount } from '../features';
import { FileDataType, FileResponse } from '../files';
import { DynamicFields, Pagination } from '../types';
import { CustomDate } from '../../utils';
import {
  AreaCategory,
  LayerClampedStatus,
  LayerResponseClampedStatus,
  LayerResponseType,
  LayerType,
  VectorFileFormat,
} from '.';

export type LayerFileResponseType = FileResponse & {
  file_type: string;
};

export type LayerFileType = FileDataType & {
  fileType: string;
};

export type AddLayerPayload = {
  iteration: string;
  type: LayerType;
  name: string;
  sourceId: string | null;
  areaCategory?: AreaCategory;
  geometry?: string;
  accessTags?: string[];
  featuresFile?: File | null;
  fileId?: string;
  clampToTerrain?: boolean;
};

export type UpdateLayerPayload = Partial<{
  name: string;
  type: LayerType;
  sourceId: string;
  fileId: string;
  areaCategory: AreaCategory;
  accessTags: string[];
  featuresStyles: FeaturesStyles;
}>;

export type UpdateLayerMappedPayload = Partial<{
  name: string;
  type: LayerType;
  file_id: string;
  source_id: string | null;
  area_category: AreaCategory;
  features_styles: FeaturesStyles;
  access_tags: string[];
}>;

export type UpdateLayer = {
  id: string;
  data: UpdateLayerPayload;
};

export type DeleteLayerPayload = {
  id: string;
  iteration: string | null;
};

export type LayerProperties = {
  bounds: [number, number, number, number];
  minzoom: number;
  maxzoom: number;
  statistics?: any;
};

// Layer endpoint types.
export type LayerResponseData = {
  id: string;
  name: string;
  iteration: string;
  type: LayerResponseType;
  status: FileStatus;
  created_at: string;
  styles?: StyleSpecification;
  properties?: LayerProperties;
  area_category: AreaCategory;
  source_id?: string;
  geometry?: string;
  access_tags?: [];
  features_styles?: FeaturesStyles;
  features?: FeatureResponseData[];
  features_count?: {
    polygons: number;
    points: number;
    lines: number;
    textbox: number;
  };
  files?: FileResponse[];
  tiles?: FileResponse;
};

export type LayerResponse = {
  id: string;
  name: string;
  type: LayerType;
  status: FileStatus;
  createdAt: CustomDate;
  areaCategory: AreaCategory;
  canEditFeatures: boolean;
  sourceId?: string;
  mapLayerStyles?: StyleSpecification;
  features?: Feature[];
  featuresCount?: FeaturesCount;
  files?: FileDataType[];
  tiles?: FileDataType;
  accessTags?: string[];
  properties?: LayerProperties;
  featuresStyles?: FeaturesStyles;
  clampedStatus?: LayerClampedStatus;
};

export type AddLayerResponse = Omit<LayerResponse, 'accessTags'> & {
  styles?: StyleSpecification;
  accessTags?: AccessTag[];
};

// Layer list endpoint types.
export type LayerListPayload = {
  iterationId: string | null;
  type?: LayerType;
  requestedLayerId?: string | null;
} & DynamicFields<LayerResponse> &
  Pagination;

export type LayerListResponseItemData = {
  id: string;
  area_category: AreaCategory;
  clamped_status: LayerResponseClampedStatus;
  created_at: string;
  features_count: FeaturesCount;
  name: string;
  status: FileStatus;
  source_id: string;
  can_edit_features: boolean;
  features_styles?: FeaturesStyles;
  features?: FeatureResponseData[];
  files?: FileResponse[];
  properties?: LayerProperties;
  styles?: StyleSpecification;
  tiles?: FileResponse;
  type: LayerResponseType;
};

export type LayerListResponseData = {
  layers: LayerListResponseItemData[];
  total: number;
  iteration_name: string;
  site_id: string;
  can_manage_layers: boolean;
  access_type: AccessType;
  has_dsm: boolean;
  page_number: number;
  requested_layer_id: string;
};

export type LayerListItem = {
  id: string;
  areaCategory: AreaCategory;
  clampedStatus: LayerClampedStatus;
  createdAt: CustomDate;
  name: string;
  status: FileStatus;
  type: LayerType;
  canEditFeatures: boolean;
  sourceId?: string;
  features?: FeatureResponseData[];
  featuresCount?: FeaturesCount;
  featuresStyles?: FeaturesStyles;
  files?: FileDataType[];
  properties?: LayerProperties;
  mapLayerStyles?: StyleSpecification;
  tiles?: FileDataType;
};

export type LayerListResponse = {
  list: LayerListItem[];
  total: number;
  iterationName: string;
  siteId: string;
  canManageLayers: boolean;
  accessType: AccessType;
  hasDSM: boolean;
  requestedLayerId: string;
  pageNumber: number;
};

export type CurrentLayer = {
  id: string;
  name: string;
};

export type ContourPayloadType = {
  name: string;
  iteration: string;
  polygonWkt: string | null;
  accessTags: Array<string> | undefined;
  minorInterval: number;
  majorInterval: number;
  lowestAltitude: number;
  highestAltitude: number;
  thresholdValue: number;
  smoothingFilterSize: number;
};

export type ContourResponseType = {
  id: string;
  name: string;
  iteration: string;
  site: string;
  source_id?: string;
  access_tags: string[];
  vector_file: FileResponse;
  styles: null;
  features_styles: string;
  raster_file: string | null;
  area_catergory: string;
  index: number;
  type: LayerType;
};

export type SlopeMapResponseType = ContourResponseType;

export type FeaturesStyles = {
  point: PointStyleOptions;
  line: LineStyleOptions;
  polygon: PolygonStyleOptions;
  textbox: TextboxStyleOptions;
};

export type CogMetadataType = {
  bounds: [number, number, number, number];
  minzoom: number;
  maxzoom: number;
  width: number;
  height: number;
  statistics: any;
};

export type SlopeMapPayloadType = {
  name: string;
  iteration: string;
  accessTags?: Array<string>;
};

export type DownloadVectorLayerPayloadType = {
  layerId: string;
  responseFormat: VectorFileFormat;
};

export type ClampToTerrainPayloadType = {
  id: string;
};
