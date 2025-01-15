import { ProcessingStagesValue } from '../enums';
import { TaskOptionsStages } from 'src/shared/api';

export enum DownscaleValues {
  LOWEST = 'Lowest',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  HIGHEST = 'Highest',
  ULTRA_HIGH = 'Ultra High',
}

export const downscaleToAccuracyMapping = {
  '0': DownscaleValues.HIGHEST,
  '1': DownscaleValues.HIGH,
  '2': DownscaleValues.MEDIUM,
  '4': DownscaleValues.LOW,
  '8': DownscaleValues.LOWEST,
};

export const downscaleToQualityMapping = {
  '1': DownscaleValues.ULTRA_HIGH,
  '2': DownscaleValues.HIGH,
  '4': DownscaleValues.MEDIUM,
  '8': DownscaleValues.LOW,
  '16': DownscaleValues.LOWEST,
};

export const TaskOptionsMapping = {
  [ProcessingStagesValue.AlignPhotos]: [
    TaskOptionsStages.TASK_PRESET_NAME,
    TaskOptionsStages.GEOTAG_INPUT_CRS,
    TaskOptionsStages.GCP_INPUT_CRS,
    TaskOptionsStages.CAMERA_CALIBRATION,
    TaskOptionsStages.CAMERA_LOCATION_ACCURACY,
    TaskOptionsStages.MARKER_PROJECTION_ACCURACY,
    TaskOptionsStages.ALIGN_PHOTOS,
    TaskOptionsStages.EXPORT_REPORT,
  ],
  [ProcessingStagesValue.GeneratePointCloud]: [
    TaskOptionsStages.TASK_PRESET_NAME,
    TaskOptionsStages.GEOTAG_INPUT_CRS,
    TaskOptionsStages.GCP_INPUT_CRS,
    TaskOptionsStages.MARKER_PROJECTION_ACCURACY,
    TaskOptionsStages.BUILD_DENSE_CLOUD,
    TaskOptionsStages.EXPORT_POINT_CLOUD,
    TaskOptionsStages.EXPORT_REPORT,
  ],
  [ProcessingStagesValue.GenerateOrthomosaic]: [
    TaskOptionsStages.TASK_PRESET_NAME,
    TaskOptionsStages.GEOTAG_INPUT_CRS,
    TaskOptionsStages.GCP_INPUT_CRS,
    TaskOptionsStages.MARKER_PROJECTION_ACCURACY,
    TaskOptionsStages.BUILD_MESH,
    TaskOptionsStages.BUILD_ORTHOMOSAIC,
    TaskOptionsStages.BUILD_DEM,
    TaskOptionsStages.EXPORT_ORTHOMOSAIC,
    TaskOptionsStages.EXPORT_DSM,
    TaskOptionsStages.EXPORT_REPORT,
  ],
  [ProcessingStagesValue.StopAfterReOptimizeCamera]: [
    TaskOptionsStages.TASK_PRESET_NAME,
    TaskOptionsStages.GEOTAG_INPUT_CRS,
    TaskOptionsStages.GCP_INPUT_CRS,
    TaskOptionsStages.MARKER_PROJECTION_ACCURACY,
    TaskOptionsStages.CAMERA_CALIBRATION,
    TaskOptionsStages.EXPORT_REPORT,
  ],
};
