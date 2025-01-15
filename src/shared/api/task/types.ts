import { CamelCasedProperties, SnakeCasedProperties } from 'type-fest';
import { PresetValue } from './preset-types';
import { ContinuedFromDatasetType, TaskDownloadType } from './enums';
import { ProcessingStagesValue } from 'src/tasks/enums';
import {
  CroppingRegionBehaviour,
  EPSGCode,
  ProcessingStatus,
  VerticalCRS,
} from 'src/shared/enums';

export type TaskOptimizationOptions = {
  'reoptimize-cameras': boolean;
  'stop-after-reoptimize': boolean;
};

export type TaskOptimizationOptionsObj =
  CamelCasedProperties<TaskOptimizationOptions>;

export type Task = {
  id: string;
  name: string;
  status: ProcessingStatus;
  progress: number;
  taskRunDuration: string;
  isEscalated: boolean;
  iterationId?: string;
  mergedDatasetId?: string;
  startedAt: Date;
  stoppedAt: Date;
  createdAt: Date;
  logStreamName: string;
  serialId: number;
  filePath: string;
  endStage: ProcessingStagesValue;
  continuedFromTask: string;
  continuedFrom: ContinuedFromDatasetType;
  options: PresetValue;
  instanceName: string;
  optimizationOptions: TaskOptimizationOptionsObj;
  isOrthoPresent: boolean;
  isDensePointCloudPresent: boolean;
  isSparsePointCloudPresent: boolean;
  isDemPresent: boolean;
  clippingBoundary: string;
  croppingRegion: string;
  croppingRegionBehaviour: CroppingRegionBehaviour;
  outputFilesPath: string;
  outputProjectFileS3ObjectKey: string;
  outputDensePointCloudS3ObjectKey: string;
  outputDemS3ObjectKey: string;
  outputDemCogS3ObjectKey: string;
  outputOrthoS3ObjectKey: string;
  outputOrthoCogS3ObjectKey: string;
  outputOrthoTileZipS3ObjectKey: string;
  outputReportS3ObjectKey: string;
  outputAllAssetsZipS3ObjectKey: string;
  inputGeotagHorizontalCrs: EPSGCode;
  inputGeotagVerticalCrs: string;
  inputGcpHorizontalCrs: number;
  inputGcpVerticalCrs: string;
};

export type TaskResponse = SnakeCasedProperties<
  Omit<Task, 'options'> & { options: string }
>;

export type CreateTaskPayload = {
  name: string;
  options: string;
  endStage?: string;
  continuedFromTask?: string;
  continuedFrom: ContinuedFromDatasetType;
  iterationDataset: string;
  outputHorizontalCrs?: EPSGCode;
  outputVerticalCrs?: VerticalCRS;
  clippingBoundary?: string;
  croppingRegion?: string;
  croppingRegionBehaviour?: CroppingRegionBehaviour;
};

export type RenameTaskPayload = {
  taskId: string;
  name: string;
};

export type TaskOutputDownloadPayload = {
  taskId: string;
  type?: TaskDownloadType;
};

export type TaskLogDownloadPayload = {
  logStreamName: string;
};
