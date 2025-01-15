import { StyleSpecification } from '@aus-platform/cesium';
import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { ImageryLayer } from 'cesium';
import {
  AreaCategory,
  Feature,
  FeaturesCount,
  FeaturesStyles,
  FileDataType,
  IterationListItem,
  LayerProperties,
  LayerType,
  ProjectListItem,
  SiteListItem,
} from 'shared/api';
import { HistogramDataType } from 'shared/types';
import { CustomDate } from 'shared/utils';

export type WorkspaceLayer = {
  id: string;
  name: string;
  type: LayerType;
  areaCategory: AreaCategory;
  createdAt: CustomDate;
  // We need this to make the metadata call for DSM COG
  iteration: IterationListItem;
  site: SiteListItem;
  project: ProjectListItem;
  canEditFeatures: boolean;
  show?: boolean;
  canManageLayer?: boolean;
  sourceId?: string;
  mapLayer?: ImageryLayer;
  mapLayerStyles?: StyleSpecification;
  properties?: LayerProperties;
  features?: Feature[];
  featuresStyles?: FeaturesStyles;
  featuresCount?: FeaturesCount;
  histogramData?: HistogramDataType;
  isProcessing?: boolean;
  layerStatus?: StatusIndicatorLevel;
  files?: FileDataType[];
  tiles?: FileDataType;
  zIndex?: number;
  refresh?: () => void;
  accessTags?: string[];
};

export type WorkspaceLayerListObj = {
  [id: string]: WorkspaceLayer;
};

export type SelectLayerListItem = Pick<
  WorkspaceLayer,
  | 'id'
  | 'name'
  | 'type'
  | 'layerStatus'
  | 'histogramData'
  | 'canManageLayer'
  | 'canEditFeatures'
> & {
  createdAt: CustomDate;
};

export type SelectLayerList = {
  [id: string]: SelectLayerListItem;
};
