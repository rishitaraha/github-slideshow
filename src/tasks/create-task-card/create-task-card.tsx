import React, { useEffect, useMemo, useReducer, useState } from 'react';
import classNames from 'classnames';
import { isEmpty, isNil, isNull } from 'lodash';
import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Input,
  InputGroup,
  SwitchCard,
  Tooltip,
} from '@aus-platform/design-system';
import { ProcessingStagesValue } from '../enums';
import { useIterationDatasetContext } from '../contexts';
import { TaskOptionsEditModal } from '../task-options-edit-modal';
import { ViewTaskOptionsModal } from '../task-options-view-modal';
import {
  getPresetOptions,
  getUpdatedPresetOptions,
} from '../task-options-edit-modal/preset-options-edit-helper';
import {
  continuableTaskListMapper,
  endProcessingStagesMapper,
  validateTaskCombinations,
} from './helpers';
import {
  ContinuableTaskObjType,
  CreateTaskCardProps,
  TaskConfigParams,
  PresetOption,
  TaskInputType,
  EditTaskOptionsParamsType,
} from './types';
import { ProcessingStages } from './constants';
import { taskConfigReducer } from './reducers';
import { CreateTaskActionType } from './actions';
import {
  ContinuedFromDatasetType,
  TaskOptionsStages,
  TaskOptionsValues,
} from 'src/shared/api';
import { useInputFields } from 'src/shared/hooks';
import { getHorizontalAndVerticalCRS } from 'src/shared/helpers';

export const CreateTaskCard: React.FC<CreateTaskCardProps> = ({
  color,
  tasksList,
  presetsList,
  onCancel,
  onStartProcessing,
  duplicatedTask,
}) => {
  // Initial State.
  const initialTaskParamsState: TaskConfigParams = {
    reoptimizeCamera: false,
    stopAfterReoptimize: false,
    disableContinueFromTask: true,
    isContinuedFromTask: false,
    endProcessingStage: ProcessingStages[2],
  };

  const initialTaskValues = {
    taskName: '',
    taskOptions: null,
  };

  // Contexts.
  const { iterationDataset } = useIterationDatasetContext();

  // States.
  const [presetOptions, setPresetOptions] = useState<PresetOption[]>([]);
  const [isTaskOptionsValid, setIsTaskOptionsValid] = useState(true);
  const [continuableTaskList, setContinuableTaskList] = useState<
    ContinuableTaskObjType[]
  >([]);
  const [taskConfigParams, setTaskConfigParams] = useReducer(
    taskConfigReducer,
    initialTaskParamsState,
  );
  const [showEditTaskOptionsModal, setShowEditTaskOptionsModal] =
    useState(false);
  const [showViewTaskOptionsModal, setShowViewTaskOptionsModal] =
    useState(false);

  // Hooks.
  const {
    values: taskValues,
    errors,
    names,
    onBlur,
    onFocus,
    onChange,
    setValues,
    validateAllFields,
    inputHasError,
    inputIsDirty,
  } = useInputFields<TaskInputType>({ ...initialTaskValues });

  const customClass = classNames(['create-task-card', color + '-border-left']);

  // useEffects.
  useEffect(() => {
    if (!isNil(duplicatedTask)) {
      setTaskConfigParams({
        type: CreateTaskActionType.DUPLICATE_FROM_TASK,
        payload: duplicatedTask,
      });
    }
    const continuableTaskList = continuableTaskListMapper(tasksList);
    if (!isEmpty(continuableTaskList)) {
      setContinuableTaskList(continuableTaskList);
      setTaskConfigParams({
        type: CreateTaskActionType.DISABLE_CONTINUE_FROM_TASK,
        payload: false,
      });
    } else {
      setTaskConfigParams({
        type: CreateTaskActionType.DISABLE_CONTINUE_FROM_TASK,
        payload: true,
      });
    }

    const updatedPresetValues = presetsList.map((preset) =>
      getPresetOptions(preset, iterationDataset),
    );
    setPresetOptions(updatedPresetValues);
    setValues({
      ...taskValues,
      taskOptions: updatedPresetValues[0],
    });
    return () => {
      setTaskConfigParams({
        type: CreateTaskActionType.RESET_ALL_VALUES,
        payload: initialTaskParamsState,
      });
      setValues({ ...initialTaskValues });
    };
  }, []);

  useEffect(() => {
    const areTaskOptionsValid = validateTaskCombinations(taskConfigParams);
    setIsTaskOptionsValid(areTaskOptionsValid);
  }, [taskConfigParams]);

  // useMemo.
  const disableEndProcessingStage = useMemo(() => {
    let isDisable = taskConfigParams.stopAfterReoptimize;

    const isContinuedTaskEndStage3 =
      taskConfigParams.taskContinuedFrom?.endStage ===
      ProcessingStagesValue.GenerateOrthomosaic;

    const isNotReoptimize =
      taskConfigParams.isContinuedFromTask &&
      !taskConfigParams.reoptimizeCamera;

    if (isContinuedTaskEndStage3 && isNotReoptimize) {
      isDisable = true;
    }

    return isDisable;
  }, [taskConfigParams]);

  const filterTaskOptions = (
    task: { label: string; value: string; data: any },
    input: string,
  ) => {
    if (input) {
      return task?.data?.taskName?.toLowerCase().includes(input?.toLowerCase());
    }
    return true;
  };
  // Handlers.
  const onToggleContinueFromTask = () => {
    setTaskConfigParams({
      type: CreateTaskActionType.TOGGLE_CONTINUE_FROM_TASK,
    });
    setTaskConfigParams({
      type: CreateTaskActionType.CONTINUED_TASK,
      payload: taskConfigParams.isContinuedFromTask
        ? undefined
        : continuableTaskList[0],
    });
  };

  const onToggleReoptimizeCameras = () =>
    setTaskConfigParams({
      type: CreateTaskActionType.TOGGLE_REOPTIMIZE_CAMERAS,
    });

  const onToggleStopAfterReoptimize = () =>
    setTaskConfigParams({
      type: CreateTaskActionType.TOGGLE_STOP_AFTER_REOPTIMIZE,
    });

  const onChangePresetOption = (option: PresetOption) => {
    setValues((prev) => ({ ...prev, taskOptions: option }));
  };

  const updateTaskContinuedFrom = (
    selectedTaskContinuedFromOption: ContinuableTaskObjType,
  ) => {
    setTaskConfigParams({
      type: CreateTaskActionType.CONTINUED_TASK,
      payload: selectedTaskContinuedFromOption,
    });
  };

  const updateEndProcessingStage = (selectedEndProcessingStageOption) => {
    setTaskConfigParams({
      type: CreateTaskActionType.END_PROCESSING_STAGE,
      payload: selectedEndProcessingStageOption,
    });
  };

  const hideEditTaskOptionsModal = () => setShowEditTaskOptionsModal(false);
  const displayEditTaskOptionsModal = () => setShowEditTaskOptionsModal(true);

  const onHideViewTaskOptionsModal = () => setShowViewTaskOptionsModal(false);
  const displayTaskOptionsModal = () => setShowViewTaskOptionsModal(true);

  const onSaveTaskConfigParams = (values: EditTaskOptionsParamsType) => {
    if (taskValues.taskOptions) {
      const updatedTaskOptions: PresetOption = getUpdatedPresetOptions(
        taskValues.taskOptions,
        values,
      );
      setPresetOptions((prev) =>
        prev
          .filter((option) => option.label !== 'Custom')
          .concat(updatedTaskOptions),
      );
      setValues((prev) => ({
        ...prev,
        taskOptions: updatedTaskOptions,
      }));
    }
    setShowEditTaskOptionsModal(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Appending reoptimization options.
    if (isNil(taskValues.taskOptions)) {
      return;
    }
    const presetValue = { ...taskValues.taskOptions.value };

    let endProcessingStageValue = taskConfigParams.endProcessingStage?.value;
    if (
      taskConfigParams.isContinuedFromTask &&
      taskConfigParams.reoptimizeCamera
    ) {
      presetValue[TaskOptionsStages.OPTIMIZATION_OPTIONS] = {
        [TaskOptionsValues.REOPTIMIZE_CAMERA]:
          taskConfigParams.reoptimizeCamera,
        [TaskOptionsValues.STOP_AFTER_REOPTIMIZE]:
          taskConfigParams.stopAfterReoptimize,
      };

      if (taskConfigParams.stopAfterReoptimize) {
        endProcessingStageValue = null;
      }
    }
    const continuedFrom = taskConfigParams?.taskContinuedFrom
      ? ContinuedFromDatasetType.TASK
      : ContinuedFromDatasetType.PARENT_ITERATION;

    const { horizontal, vertical } = getHorizontalAndVerticalCRS(
      presetValue[TaskOptionsStages.COORDINATE_SYSTEM],
    );

    if (!inputHasError() && inputIsDirty()) {
      onStartProcessing({
        name: taskValues.taskName.trim(),
        options: JSON.stringify(presetValue),
        endStage: endProcessingStageValue,
        continuedFromTask: taskConfigParams?.taskContinuedFrom?.value,
        iterationDataset: iterationDataset.id,
        outputHorizontalCrs: horizontal,
        outputVerticalCrs: vertical,
        continuedFrom,
      });
    } else {
      validateAllFields();
    }
  };

  return (
    <div className={customClass}>
      <div className="create-task-card__header">
        <span className="body-txt-2 primary-600-txt">Create Task</span>
      </div>
      <div className="create-task-card__content">
        <form onSubmit={onSubmit}>
          <div className="create-task-card__form-input">
            <div className="create-task-card__task-detail">
              <InputGroup>
                <Input.Label>Task Name</Input.Label>
                <Input.Text
                  placeholder="Task Name"
                  value={taskValues.taskName}
                  name={names.taskName}
                  error={errors.taskName}
                  isInvalid={!!errors.taskName}
                  {...{ onChange, onBlur, onFocus }}
                />
              </InputGroup>
            </div>

            <div className="create-task-card__task-detail">
              <InputGroup>
                <Input.Label>Options</Input.Label>
                <div className="d-flex">
                  <div className="create-task-card__task-detail-center">
                    <Input.Select
                      className="create-task-card__task__options-dropdown"
                      options={presetOptions}
                      name={names.taskOptions}
                      value={taskValues.taskOptions}
                      onChange={onChangePresetOption}
                      {...{ onBlur, onFocus }}
                    />
                  </div>
                  <div className="create-task-card__task-detail__task-info">
                    <Tooltip hoverText="View Task Options">
                      <Button variant={ButtonVariant.Link}>
                        <Icon
                          identifier={IconIdentifier.InfoCircle}
                          colorClass={ColorClass.Primary500}
                          onClick={displayTaskOptionsModal}
                          size={15}
                        />
                      </Button>
                    </Tooltip>
                  </div>
                  <div className="create-task-card__task-detail__edit-btn">
                    <Tooltip hoverText={'Edit Task options'}>
                      <Button
                        variant={ButtonVariant.Link}
                        onClick={displayEditTaskOptionsModal}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </InputGroup>
            </div>
          </div>

          {/* Switch Cards */}
          <InputGroup className="create-task-card__task-detail__switch-card__input-group">
            <SwitchCard
              className="create-task-card__task-detail__switch-card"
              title={'Continue from task'}
              checked={taskConfigParams.isContinuedFromTask}
              disabled={taskConfigParams.disableContinueFromTask}
              onClick={onToggleContinueFromTask}
              onChange={() => {}}
            />
          </InputGroup>

          {taskConfigParams.isContinuedFromTask && (
            <InputGroup className="create-task-card__task-detail-row create-task-card__continued-from-task-options">
              <div className="create-task-card__continued-from-task-options__select">
                <Input.Select
                  options={continuableTaskList}
                  onChange={updateTaskContinuedFrom}
                  filterOption={filterTaskOptions}
                  value={taskConfigParams.taskContinuedFrom}
                />
              </div>
              <SwitchCard
                className="create-task-card__task-detail__switch-card"
                title={'Reoptimize Camera'}
                checked={taskConfigParams.reoptimizeCamera}
                disabled={isNil(taskConfigParams.taskContinuedFrom)}
                onClick={onToggleReoptimizeCameras}
                onChange={() => {}}
              />

              {taskConfigParams.reoptimizeCamera && (
                <SwitchCard
                  className="create-task-card__task-detail__switch-card"
                  title={'Stop after Reoptimize Camera'}
                  checked={taskConfigParams.stopAfterReoptimize}
                  disabled={!taskConfigParams.reoptimizeCamera}
                  onClick={onToggleStopAfterReoptimize}
                  onChange={() => {}}
                />
              )}
            </InputGroup>
          )}

          {/* Processing Stages dropdowns. */}
          <InputGroup className="create-task-card__task-detail">
            <Input.Label>End Processing Stage</Input.Label>
            <Input.Select
              placeholder={'Stop After Reoptimize'}
              options={endProcessingStagesMapper(taskConfigParams)}
              onChange={updateEndProcessingStage}
              value={taskConfigParams.endProcessingStage}
              isDisabled={disableEndProcessingStage}
            />
          </InputGroup>

          {/* Start and Cancel Buttons. */}
          <div className="create-task-card__error" hidden={isTaskOptionsValid}>
            Invalid combination of Continued From Task and End Processing Stage
            selected
          </div>
          <div className="create-task-card__btn-box">
            <Button
              type="submit"
              disabled={!isTaskOptionsValid || inputHasError()}
            >
              Start Processing
            </Button>
            <Button variant={ButtonVariant.Secondary} onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
      {!isNull(taskValues.taskOptions) && (
        <>
          {showEditTaskOptionsModal && (
            <TaskOptionsEditModal
              taskOptions={taskValues.taskOptions}
              onSave={onSaveTaskConfigParams}
              onClose={hideEditTaskOptionsModal}
            />
          )}
          <ViewTaskOptionsModal
            show={showViewTaskOptionsModal}
            taskOptions={taskValues.taskOptions?.value}
            taskEndStage={taskConfigParams.endProcessingStage?.value}
            onClose={onHideViewTaskOptionsModal}
          />
        </>
      )}
    </div>
  );
};
