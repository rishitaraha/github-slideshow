import { ImageryLayer } from 'cesium';
import { StyleSpecification } from '@aus-platform/cesium';
import { BoundingBox, CesiumSplitViewerProxy } from 'shared/cesium';
import {
  FileDataType,
  IterationListItem,
  LayerProperties,
  LayerType,
  SiteListItem,
} from 'shared/api';
import { FileStatus } from 'src/shared/enums';
import { CustomDate } from 'src/shared/utils';
import { HistogramDataType } from 'src/shared/types';

export type SwipeMapLayer = {
  id: string;
  name: string;
  status: FileStatus;
  type: LayerType;
  createdAt: CustomDate;
} & Partial<{
  show: boolean;
  zIndex: number;
  mapLayer: ImageryLayer;
  histogramData: HistogramDataType;
  sourceId: string;
  files: FileDataType[];
  tiles: FileDataType;
  properties: LayerProperties;
  mapLayerStyles: StyleSpecification;
}>;

export type SwipeMapLayerList = {
  [id: string]: SwipeMapLayer;
};

export type SwipeMap3DState = {
  splitViewer: CesiumSplitViewerProxy | null;
  isLeftSidecardOpen: boolean;
  isRightSidecardOpen: boolean;
  leftIteration: IterationListItem | null;
  rightIteration: IterationListItem | null;
  selectedSite: Pick<SiteListItem, 'id' | 'name'> | null;
  layersBoundingBox?: BoundingBox;
  leftPropertyLayerId: string | null;
  rightPropertyLayerId: string | null;
  leftLayerList: SwipeMapLayerList;
  rightLayerList: SwipeMapLayerList;
};
