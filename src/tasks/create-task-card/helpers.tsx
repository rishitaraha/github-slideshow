import { compact, isNil, isNull } from 'lodash';
import { Pill, PillVariant } from '@aus-platform/design-system';
import { ProcessingStagesValue } from '../enums';
import {
  ContinuableTaskObjType,
  TaskConfigParams,
  EndProcessingSelectOption,
} from './types';
import { ProcessingStages } from './constants';
import { Task } from 'src/shared/api';
import { ProcessingStatus } from 'src/shared/enums';

export const EndStageToOptionMapping = {
  [ProcessingStagesValue.GenerateOrthomosaic]: ProcessingStages[2],
  [ProcessingStagesValue.GeneratePointCloud]: ProcessingStages[1],
  [ProcessingStagesValue.AlignPhotos]: ProcessingStages[0],
};

// Returns list of continuable tasks with Pill component.
export const continuableTaskListMapper = (
  taskList: Task[],
): Array<ContinuableTaskObjType> => {
  return compact(
    taskList.map((task) => {
      if (task.status !== ProcessingStatus.Completed) {
        return;
      }
      const continuedTaskStage = task.endStage as ProcessingStagesValue;
      const taskStageNumber = getProcessingStageNumber(continuedTaskStage);
      return {
        value: task.id,
        endStage: continuedTaskStage,
        taskName: task.name,
        label: (
          <div className="processing-stage-dropdown">
            <div className="tasks-dropdown">{task.name}</div>
            <Pill variant={PillVariant.Success}>Stage {taskStageNumber}</Pill>
          </div>
        ),
      };
    }),
  );
};

export const endProcessingStagesMapper = ({
  taskContinuedFrom,
  reoptimizeCamera,
}: TaskConfigParams): EndProcessingSelectOption[] => {
  if (reoptimizeCamera) {
    return [ProcessingStages[1], ProcessingStages[2]];
  }
  if (taskContinuedFrom) {
    if (
      taskContinuedFrom.endStage === ProcessingStagesValue.GeneratePointCloud
    ) {
      return [ProcessingStages[2]];
    } else if (
      taskContinuedFrom.endStage === ProcessingStagesValue.AlignPhotos
    ) {
      return [ProcessingStages[1], ProcessingStages[2]];
    }
  }
  return ProcessingStages;
};

export const getProcessingStageNumber = (stage: ProcessingStagesValue) => {
  if (stage === ProcessingStagesValue.AlignPhotos) {
    return 1;
  } else if (stage === ProcessingStagesValue.GeneratePointCloud) {
    return 2;
  } else if (stage === ProcessingStagesValue.GenerateOrthomosaic) {
    return 3;
  }
  return 0;
};

export const validateTaskCombinations = ({
  isContinuedFromTask,
  taskContinuedFrom,
  endProcessingStage,
  reoptimizeCamera,
  stopAfterReoptimize,
}: TaskConfigParams) => {
  if (isContinuedFromTask) {
    if (isNil(taskContinuedFrom)) {
      return false;
    }
    const continuedTaskStageNumber = getProcessingStageNumber(
      taskContinuedFrom.endStage,
    );
    if (
      reoptimizeCamera &&
      !stopAfterReoptimize &&
      isNull(endProcessingStage)
    ) {
      return false;
    }
    if (
      !reoptimizeCamera &&
      !isNil(endProcessingStage) &&
      endProcessingStage.stage <= continuedTaskStageNumber
    ) {
      return false;
    }
  }
  return true;
};
