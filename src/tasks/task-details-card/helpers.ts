import { isNil } from 'lodash';
import { PillSeriesVariant } from '@aus-platform/design-system';
import { ProcessingStagesValue } from '../enums';
import {
  ContinuedFromDatasetType,
  Task,
  TaskOptionsStages,
  TaskOptionsValues,
} from 'src/shared/api';

export const getProcessingStageDefinition = (processingStage: string) => {
  if (processingStage === ProcessingStagesValue.AlignPhotos) {
    return 'Align Photos';
  } else if (processingStage === ProcessingStagesValue.GeneratePointCloud) {
    return 'Generate Point Cloud';
  } else {
    return 'Generate Orthomosaic';
  }
};

export const getTaskProcessingStages = (
  task: Task,
  continuedFromTask?: Task,
) => {
  const optimizationOptions =
    task.options[TaskOptionsStages.OPTIMIZATION_OPTIONS];
  const reoptimizeCameras =
    optimizationOptions?.[TaskOptionsValues.REOPTIMIZE_CAMERA] || false;
  const stopAfterReoptimize =
    optimizationOptions?.[TaskOptionsValues.STOP_AFTER_REOPTIMIZE] || false;

  const taskEndStageMapping = {
    [ProcessingStagesValue.AlignPhotos]: {
      variant: PillSeriesVariant.Success,
      text: 'Align Photos',
    },
    [ProcessingStagesValue.GeneratePointCloud]: {
      variant: PillSeriesVariant.Success,
      text: 'Generate Point Cloud',
    },
    [ProcessingStagesValue.GenerateOrthomosaic]: {
      variant: PillSeriesVariant.Success,
      text: 'Generate Orthomosaic',
    },
  };

  const taskStages: { variant: PillSeriesVariant; text: string }[] = [];
  if (
    task.continuedFrom === ContinuedFromDatasetType.TASK &&
    !isNil(continuedFromTask)
  ) {
    taskStages.push({
      variant: PillSeriesVariant.Name,
      text: continuedFromTask.name,
    });
  } else if (
    task.continuedFrom === ContinuedFromDatasetType.PARENT_MERGED_DATASET_OUTPUT
  ) {
    taskStages.push({
      variant: PillSeriesVariant.Name,
      text: 'Merged Dataset Output',
    });
  } else {
    taskStages.push(taskEndStageMapping[ProcessingStagesValue.AlignPhotos]);
  }

  if (reoptimizeCameras) {
    taskStages.push({
      variant: PillSeriesVariant.Success,
      text: 'Reoptimize Cameras',
    });
    if (stopAfterReoptimize) {
      return taskStages;
    }
  }

  if (task.endStage === ProcessingStagesValue.GenerateOrthomosaic) {
    if (
      continuedFromTask?.endStage !==
        ProcessingStagesValue.GeneratePointCloud ||
      reoptimizeCameras
    ) {
      taskStages.push(
        taskEndStageMapping[ProcessingStagesValue.GeneratePointCloud],
      );
    }
    taskStages.push(
      taskEndStageMapping[ProcessingStagesValue.GenerateOrthomosaic],
    );
  } else if (task.endStage === ProcessingStagesValue.GeneratePointCloud) {
    taskStages.push(
      taskEndStageMapping[ProcessingStagesValue.GeneratePointCloud],
    );
  }
  return taskStages;
};

export const getProcessingStageNumber = (stage: string) => {
  if (stage === ProcessingStagesValue.AlignPhotos) {
    return 1;
  } else if (stage === ProcessingStagesValue.GeneratePointCloud) {
    return 2;
  } else if (stage === ProcessingStagesValue.GenerateOrthomosaic) {
    return 3;
  }
  return null;
};
