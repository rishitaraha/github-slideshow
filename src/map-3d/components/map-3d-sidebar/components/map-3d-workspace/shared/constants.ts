import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { LayerType } from '../../../../../../shared/api';
import { FileStatus } from '../../../../../../shared/enums';
import { HistogramDataType } from '../../../../../../shared/types';

export const initialHistogramData: HistogramDataType = {
  rescale: null,
  opacity: 100,
  sourceFilePath: null,
};

export const canShowHistogramLayerTypesList = [
  LayerType.CapturedDsm,
  LayerType.SlopeMap,
];

export const FileStatusIndicatorMapping = {
  [FileStatus.Done]: StatusIndicatorLevel.Done,
  [FileStatus.Failed]: StatusIndicatorLevel.Failed,
  [FileStatus.Processing]: StatusIndicatorLevel.Processing,
  [FileStatus.Importing]: StatusIndicatorLevel.Importing,
  [FileStatus.ImportFailed]: StatusIndicatorLevel.Failed,
  [FileStatus.Starting]: StatusIndicatorLevel.Started,
};
