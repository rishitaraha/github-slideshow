import { isNaN, isNil } from 'lodash';
import {
  Preset,
  PresetValue,
  TaskOptionsStages,
  TaskOptionsValues,
} from '../../shared/api/task/preset-types';
import {
  EditTaskOptionsParamsType,
  PresetOption,
} from '../create-task-card/types';
import { EPSGCode, VerticalCRS } from 'src/shared/enums';
import { IterationDataset } from 'src/shared/api';
import { getHorizontalAndVerticalCRS, getWktCrs } from 'src/shared/helpers';

export const getUpdatedPresetOptions = (
  preset: Preset,
  taskConfigParams: EditTaskOptionsParamsType,
) => {
  const updatedTaskOptions = { ...preset.value } as PresetValue;

  // Parse options json config.
  updatedTaskOptions[TaskOptionsStages.TASK_PRESET_NAME] = preset.name;

  // Define json config stages which needs to be updated with new CRS values.
  const stagesToUpdate = [
    TaskOptionsStages.EXPORT_POINT_CLOUD,
    TaskOptionsStages.BUILD_DEM,
    TaskOptionsStages.EXPORT_DSM,
    TaskOptionsStages.BUILD_ORTHOMOSAIC,
    TaskOptionsStages.EXPORT_ORTHOMOSAIC,
    TaskOptionsStages.EXPORT_REPORT,
  ];

  const outputCrsWkt = getWktCrs(
    taskConfigParams.outputHorizontalCrs,
    taskConfigParams.outputVerticalCrs,
  );

  // Update CRS for overall Coordinate System.
  updatedTaskOptions[TaskOptionsValues.COORDINATE_SYSTEM] = outputCrsWkt;

  // Update CRS WKT string in stages.
  for (const stage of stagesToUpdate) {
    updatedTaskOptions[stage][TaskOptionsValues.COORDINATE_SYSTEM] =
      outputCrsWkt;
  }

  // Update config camera accuracy settings.
  if (
    !isNaN(taskConfigParams.horizontalAccuracy) &&
    !isNaN(taskConfigParams.verticalAccuracy)
  ) {
    updatedTaskOptions[TaskOptionsStages.CAMERA_LOCATION_ACCURACY] = {
      [TaskOptionsValues.X]: Number(taskConfigParams.horizontalAccuracy),
      [TaskOptionsValues.Y]: Number(taskConfigParams.horizontalAccuracy),
      [TaskOptionsValues.Z]: Number(taskConfigParams.verticalAccuracy),
    };
  }

  if (!isNaN(taskConfigParams.keyPointLimit)) {
    updatedTaskOptions[TaskOptionsStages.ALIGN_PHOTOS][
      TaskOptionsValues.KEYPOINT_LIMIT
    ] = Number(taskConfigParams.keyPointLimit);
  }

  if (!isNaN(taskConfigParams.tiePointLimit)) {
    updatedTaskOptions[TaskOptionsStages.ALIGN_PHOTOS][
      TaskOptionsValues.TIEPOINT_LIMIT
    ] = Number(taskConfigParams.tiePointLimit);
  }

  updatedTaskOptions[TaskOptionsStages.EXPORT_ORTHOMOSAIC][
    TaskOptionsValues.SPLIT_IN_BLOCKS
  ] = Boolean(taskConfigParams.splitInBlocks);

  if (!isNaN(taskConfigParams.blockHeight)) {
    updatedTaskOptions[TaskOptionsStages.EXPORT_ORTHOMOSAIC][
      TaskOptionsValues.BLOCK_HEIGHT
    ] = Number(taskConfigParams.blockHeight);
  }
  if (!isNaN(taskConfigParams.blockWidth)) {
    updatedTaskOptions[TaskOptionsStages.EXPORT_ORTHOMOSAIC][
      TaskOptionsValues.BLOCK_WIDTH
    ] = Number(taskConfigParams.blockWidth);
  }

  // Generate report with checkpoints.
  updatedTaskOptions[TaskOptionsStages.GENERATE_REPORT_WITH_CHECKPOINTS] =
    taskConfigParams.generateReportWithCheckpoints;

  return {
    ...preset,
    label: 'Custom',
    value: updatedTaskOptions,
  };
};

export const getTaskConfigFromPresetValue = (
  preset: PresetValue,
): EditTaskOptionsParamsType => {
  const taskConfigParams: EditTaskOptionsParamsType = {
    outputHorizontalCrs: EPSGCode.WGS84,
    outputVerticalCrs: VerticalCRS.ELLIPSOIDAL,
    horizontalAccuracy: 0.05,
    verticalAccuracy: 0.1,
    keyPointLimit: 40000,
    tiePointLimit: 1000,
    splitInBlocks: false,
    blockWidth: 4000,
    blockHeight: 4000,
    generateReportWithCheckpoints: false,
  };

  const outputCrs = getHorizontalAndVerticalCRS(
    preset[TaskOptionsStages.COORDINATE_SYSTEM],
  );
  taskConfigParams.outputHorizontalCrs = outputCrs.horizontal as EPSGCode;
  taskConfigParams.outputVerticalCrs = outputCrs.vertical as VerticalCRS;

  const keyPointLimit =
    preset[TaskOptionsStages.ALIGN_PHOTOS]?.[TaskOptionsValues.KEYPOINT_LIMIT];
  taskConfigParams.keyPointLimit =
    !isNil(keyPointLimit) && !isNaN(keyPointLimit)
      ? Number(keyPointLimit)
      : taskConfigParams.keyPointLimit;

  const tiePointLimit =
    preset[TaskOptionsStages.ALIGN_PHOTOS]?.[TaskOptionsValues.TIEPOINT_LIMIT];
  taskConfigParams.tiePointLimit =
    !isNil(tiePointLimit) && !isNaN(tiePointLimit)
      ? Number(tiePointLimit)
      : taskConfigParams.tiePointLimit;

  // Update config camera accuracy settings.
  const hAccuracy =
    preset?.[TaskOptionsStages.CAMERA_LOCATION_ACCURACY]?.[TaskOptionsValues.X];
  taskConfigParams.horizontalAccuracy =
    !isNil(hAccuracy) && !isNaN(hAccuracy)
      ? Number(hAccuracy)
      : taskConfigParams.horizontalAccuracy;

  const vAccuracy =
    preset?.[TaskOptionsStages.CAMERA_LOCATION_ACCURACY]?.[TaskOptionsValues.Z];
  taskConfigParams.verticalAccuracy =
    !isNil(vAccuracy) && !isNaN(vAccuracy)
      ? Number(vAccuracy)
      : taskConfigParams.verticalAccuracy;

  taskConfigParams.splitInBlocks = Boolean(
    preset[TaskOptionsStages.EXPORT_ORTHOMOSAIC]?.[
      TaskOptionsValues.SPLIT_IN_BLOCKS
    ],
  );

  const blockHeight =
    preset[TaskOptionsStages.EXPORT_ORTHOMOSAIC]?.[
      TaskOptionsValues.BLOCK_HEIGHT
    ];

  taskConfigParams.blockHeight =
    !isNil(blockHeight) && !isNaN(blockHeight)
      ? Number(keyPointLimit)
      : taskConfigParams.blockHeight;

  const blockWidth =
    preset[TaskOptionsStages.EXPORT_ORTHOMOSAIC]?.[
      TaskOptionsValues.BLOCK_WIDTH
    ] ?? null;
  taskConfigParams.blockWidth =
    !isNil(blockWidth) && !isNaN(blockWidth)
      ? Number(tiePointLimit)
      : taskConfigParams.blockWidth;

  // Generate report with checkpoints.
  taskConfigParams.generateReportWithCheckpoints = Boolean(
    preset[TaskOptionsStages.GENERATE_REPORT_WITH_CHECKPOINTS],
  );
  return taskConfigParams;
};

export const getPresetOptions = (
  preset: Preset,
  iterationDataset: IterationDataset,
): PresetOption => {
  const presetValue = preset.value;
  presetValue[TaskOptionsStages.TASK_PRESET_NAME] = preset.name;

  const cameraCrs = getWktCrs(
    iterationDataset.geotagHorizontalCrs,
    iterationDataset.geotagVerticalCrs,
  );
  const markerCrs = getWktCrs(
    iterationDataset.gcpHorizontalCrs,
    iterationDataset.gcpVerticalCrs,
  );
  if (cameraCrs) {
    presetValue[TaskOptionsValues.CAMERA_CRS] = cameraCrs;
  }
  if (markerCrs) {
    presetValue[TaskOptionsValues.MARKER_CRS] = markerCrs;
  }

  return {
    ...preset,
    label: preset.name,
    value: presetValue,
  };
};
