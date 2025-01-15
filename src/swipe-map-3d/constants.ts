import { SwipeMap3DState } from './types';
import { LayerType } from 'src/shared/api';

export const initialSwipeMap3DState: SwipeMap3DState = {
  splitViewer: null,
  isLeftSidecardOpen: false,
  isRightSidecardOpen: false,
  leftIteration: null,
  rightIteration: null,
  selectedSite: null,
  leftPropertyLayerId: null,
  rightPropertyLayerId: null,
  leftLayerList: {},
  rightLayerList: {},
  layersBoundingBox: undefined,
};

export const canShowHistogramLayerTypesList = [
  LayerType.CapturedDsm,
  LayerType.SlopeMap,
];
