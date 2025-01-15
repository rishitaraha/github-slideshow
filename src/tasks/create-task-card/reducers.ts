import { EndStageToOptionMapping } from './helpers';
import { TaskConfigParams } from './types';
import { ProcessingStages } from './constants';
import { CreateTaskActionType } from './actions';
import { StateActionType } from 'src/shared/types';
import { TaskOptionsStages } from 'src/shared/api';

export const taskConfigReducer = (
  state: TaskConfigParams,
  action: StateActionType<CreateTaskActionType>,
) => {
  const currentStopAfterReoptimize = state.stopAfterReoptimize;
  const currentReoptimizeState = state.reoptimizeCamera;

  switch (action.type) {
    case CreateTaskActionType.DISABLE_CONTINUE_FROM_TASK:
      return {
        ...state,
        [CreateTaskActionType.DISABLE_CONTINUE_FROM_TASK]: action.payload,
        [CreateTaskActionType.REOPTIMIZE_CAMERA]: false,
        [CreateTaskActionType.STOP_AFTER_REOPTIMIZE]: false,
      };

    case CreateTaskActionType.TOGGLE_REOPTIMIZE_CAMERAS:
      return {
        ...state,
        [CreateTaskActionType.REOPTIMIZE_CAMERA]: !currentReoptimizeState,
        [CreateTaskActionType.STOP_AFTER_REOPTIMIZE]: false,
      };

    case CreateTaskActionType.TOGGLE_STOP_AFTER_REOPTIMIZE:
      const isStopAfterReoptimizeOn = !currentStopAfterReoptimize;
      const nextEndStage = isStopAfterReoptimizeOn ? null : ProcessingStages[2];
      return {
        ...state,
        [CreateTaskActionType.STOP_AFTER_REOPTIMIZE]: isStopAfterReoptimizeOn,
        [CreateTaskActionType.END_PROCESSING_STAGE]: nextEndStage,
      };

    case CreateTaskActionType.DUPLICATE_FROM_TASK:
      const duplicatedTask = action.payload;
      const optimizationOptions =
        duplicatedTask.options[TaskOptionsStages.OPTIMIZATION_OPTIONS];

      const stopAftreReoptimize = optimizationOptions
        ? optimizationOptions.stopAfterReoptimize
        : false;
      const reoptimizeCamera = optimizationOptions
        ? optimizationOptions.reoptimizeCameras
        : false;

      const endProcessingStage =
        EndStageToOptionMapping[duplicatedTask.endStage];

      return {
        ...state,
        [CreateTaskActionType.REOPTIMIZE_CAMERA]: reoptimizeCamera,
        [CreateTaskActionType.STOP_AFTER_REOPTIMIZE]: stopAftreReoptimize,
        [CreateTaskActionType.END_PROCESSING_STAGE]: endProcessingStage,
      };

    case CreateTaskActionType.TOGGLE_CONTINUE_FROM_TASK:
      return {
        ...state,
        [CreateTaskActionType.REOPTIMIZE_CAMERA]: false,
        [CreateTaskActionType.STOP_AFTER_REOPTIMIZE]: false,
        [CreateTaskActionType.IS_CONTINUED_FROM_TASK]:
          !state.isContinuedFromTask,
      };

    case CreateTaskActionType.RESET_ALL_VALUES:
      return {
        ...state,
        ...action.payload,
      };
  }
  return { ...state, [action.type]: action.payload };
};
