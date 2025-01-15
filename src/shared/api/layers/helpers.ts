import {
  LayerClampedStatus,
  LayerResponseClampedStatus,
  LayerResponseType,
  LayerType,
} from './enums';

export const layerTypeResponseMapping = {
  [LayerResponseType.Cesium]: LayerType.Cesium,
  [LayerResponseType.Contour]: LayerType.Contour,
  [LayerResponseType.MBTiles]: LayerType.MBTiles,
  [LayerResponseType.MapBox]: LayerType.MapBox,
  [LayerResponseType.Orthomosaic]: LayerType.Orthomosaic,
  [LayerResponseType.SlopeMap]: LayerType.SlopeMap,
  [LayerResponseType.Vector]: LayerType.Vector,
} as const;

export const layerClampedStatusResponseMapping = {
  [LayerResponseClampedStatus.AlreadyClamped]:
    LayerClampedStatus.AlreadyClamped,
  [LayerResponseClampedStatus.Done]: LayerClampedStatus.Done,
  [LayerResponseClampedStatus.Processing]: LayerClampedStatus.Processing,
  [LayerResponseClampedStatus.Failed]: LayerClampedStatus.Failed,
  [LayerResponseClampedStatus.Started]: LayerClampedStatus.Started,
  [LayerResponseClampedStatus.NotClamped]: LayerClampedStatus.NotClamped,
} as const;
