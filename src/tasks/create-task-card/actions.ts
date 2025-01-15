export const enum CreateTaskActionType {
  CONTINUED_TASK = 'taskContinuedFrom',
  REOPTIMIZE_CAMERA = 'reoptimizeCamera',
  STOP_AFTER_REOPTIMIZE = 'stopAfterReoptimize',
  END_PROCESSING_STAGE = 'endProcessingStage',
  DISABLE_CONTINUE_FROM_TASK = 'disableContinueFromTask',
  IS_CONTINUED_FROM_TASK = 'isContinuedFromTask',
  DUPLICATE_FROM_TASK = 'duplicateFromTask',

  TOGGLE_REOPTIMIZE_CAMERAS = 'toggleReoptimizeCameras',
  TOGGLE_CONTINUE_FROM_TASK = 'toggleContinueFromTask',
  TOGGLE_STOP_AFTER_REOPTIMIZE = 'toggleStopAfterReoptimize',
  RESET_ALL_VALUES = 'resetAllValues',
}
