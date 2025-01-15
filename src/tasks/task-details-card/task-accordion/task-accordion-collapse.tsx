import classNames from 'classnames';
import { saveAs } from 'file-saver';
import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Accordion as BootstrapAccordion } from 'react-bootstrap';
import {
  Box,
  Button,
  ButtonVariant,
  DropDownButton,
  MeatBallsMenu,
  MeatBallsMenuDirection,
  ProgressBar,
  ToggleButton,
  ProgressBarState,
  DropDownButtonDirection,
  PillSeries,
} from '@aus-platform/design-system';
import { TaskOutput } from '../task-output';
import { getTaskProcessingStages } from '../helpers';
import { TaskAccordionCollapseProps } from './types';
import { ProcessingStatus } from 'src/shared/enums';
import { ViewTaskOptionsModal } from 'src/tasks/task-options-view-modal';
import { ProgressDetails } from 'src/tasks/types';
import {
  TaskDownloadType,
  TaskOptionsStages,
  TaskOptionsValues,
  useTaskOutputDownloadRequest,
} from 'src/shared/api';
import { ProgressContext } from 'src/tasks/contexts';
import { FinalStateTaskStatus } from 'src/tasks/constants';
import { ProcessingStagesValue } from 'src/tasks/enums';
import {
  ProcessingStatusLabel,
  ProcessingStatusProgressVariant,
} from 'src/shared/constants';

export const TaskAccordionCollapse = React.forwardRef<
  HTMLDivElement,
  TaskAccordionCollapseProps
>(
  (
    {
      className,
      task,
      continuedFromTask,
      color: colorClass,
      onCancelProcessing,
      onDuplicateTask,
      onRenameTaskClick,
      logsEnabledTaskId,
      enableLogsForTask,
      showArchivedIterations,
      refetchTaskDetails,
      isCancelBtnDisabled,
      ...rest
    },
    ref,
  ) => {
    const customClassName = classNames([
      'task-accordion__collapse',
      className,
      colorClass + '-border-left',
    ]);

    // States.
    const [showTaskOptionsModal, setShowTaskOptionsModal] = useState(false);
    const [downloadOutputType, setDownloadOutputType] =
      useState<TaskDownloadType>();

    const { progressDetails, removeDatasetFromProgressTracking } =
      useContext(ProgressContext);

    const taskProgressDetails: ProgressDetails = progressDetails
      ? progressDetails[task.id]
      : { progressStatus: task.status };

    const taskStatus = taskProgressDetails?.progressStatus || task.status;

    // Api.
    const {
      data: taskOutputDownloadResponse,
      isSuccess: isSuccessTaskOutputDownload,
    } = useTaskOutputDownloadRequest(
      {
        taskId: task.id,
        type: downloadOutputType,
      },
      !!downloadOutputType,
    );

    // useEffects.
    useEffect(() => {
      if (isSuccessTaskOutputDownload && taskOutputDownloadResponse) {
        saveAs(taskOutputDownloadResponse.data, 'TestDownload');
      }
    }, [isSuccessTaskOutputDownload, taskOutputDownloadResponse]);

    useEffect(() => {
      const isTaskCompleted =
        taskProgressDetails?.progressStatus === ProcessingStatus.Completed &&
        task.status !== ProcessingStatus.Completed;
      const isTaskErrored =
        taskProgressDetails?.progressStatus === ProcessingStatus.Error &&
        task.status !== ProcessingStatus.Error;
      const isTaskCancelled =
        taskProgressDetails?.progressStatus === ProcessingStatus.Cancelled &&
        task.status !== ProcessingStatus.Cancelled;

      if (isTaskCompleted || isTaskErrored || isTaskCancelled) {
        removeDatasetFromProgressTracking(task.id);
        refetchTaskDetails();
      }
    }, [taskStatus]);

    // useMemo.
    const taskOutputLogsDisabled = useMemo(
      () =>
        [ProcessingStatus.Cancelled, ProcessingStatus.Pending].includes(
          taskStatus,
        ) || !task.logStreamName,
      [taskStatus],
    );

    // Handlers.
    const hasTaskEndedAtGenerateOrtho = () => {
      const isStopAfterReoptimize =
        task.options?.[TaskOptionsStages.OPTIMIZATION_OPTIONS]?.[
          TaskOptionsValues.STOP_AFTER_REOPTIMIZE
        ];
      return (
        (isEmpty(task.endStage) && !isStopAfterReoptimize) ||
        task.endStage === ProcessingStagesValue.GenerateOrthomosaic
      );
    };

    const isPointCloudGenerated = () => {
      return (
        task.endStage === ProcessingStagesValue.GeneratePointCloud ||
        hasTaskEndedAtGenerateOrtho()
      );
    };

    const onDownloadItemClick = (type: TaskDownloadType) => {
      setDownloadOutputType(type);
    };

    const toggleClickHandler = () => {
      enableLogsForTask((prev) => (prev === task.id ? '' : task.id));
    };

    const onCloseTaskOutput = () => {
      enableLogsForTask('');
    };

    const isSplitIntoBlocks = () => {
      return (
        task.options?.[TaskOptionsStages.EXPORT_ORTHOMOSAIC]?.[
          TaskOptionsValues.SPLIT_IN_BLOCKS
        ] || false
      );
    };

    const getProgressBarVariant = () => {
      return ProcessingStatusProgressVariant[taskStatus];
    };

    const getProgressBarLabel = () => {
      if (taskStatus === ProcessingStatus.Processing) {
        return `${taskProgressDetails?.progressPercentage ?? ''}%`;
      }
      return ProcessingStatusLabel[taskStatus];
    };

    const getProgressBarPercentage = () => {
      if (taskStatus === ProcessingStatus.Pending) {
        return ProgressBarState.Processing;
      }
      if (taskStatus === ProcessingStatus.Processing) {
        return taskProgressDetails?.progressPercentage ?? 1;
      } else if (taskStatus === ProcessingStatus.Cancelled) {
        return ProgressBarState.Cancelled;
      } else if (taskStatus === ProcessingStatus.Completed) {
        return ProgressBarState.Completed;
      } else if (taskStatus === ProcessingStatus.Error) {
        return ProgressBarState.Error;
      }
      return ProgressBarState.Processing;
    };

    // Modal Handlers.
    const displayTaskOptionsModal = () => setShowTaskOptionsModal(true);
    const hideTaskOptionsModal = () => setShowTaskOptionsModal(false);

    // Renderers.
    const pillSeriesRenderer = () => {
      const taskStages = getTaskProcessingStages(task, continuedFromTask);
      return (
        <div className="task-accordion__task-boxes__pills">
          {taskStages.map((pillItem, index) => (
            <PillSeries key={index} variant={pillItem.variant}>
              {pillItem.text}
            </PillSeries>
          ))}
        </div>
      );
    };

    return (
      <BootstrapAccordion.Collapse
        ref={ref}
        className={customClassName}
        {...rest}
      >
        <div className="task-accordion__collapse-content">
          {/* Task Header */}
          <div className="task-accordion__collapse-header">
            <div className="task-accordion__collapse-header__output">
              Task Output
              <ToggleButton
                className="task-accordion__collapse-header__output-toggle"
                checked={logsEnabledTaskId === task.id}
                onChange={toggleClickHandler}
                disabled={taskOutputLogsDisabled}
                onClick={() => {}}
              />
            </div>
          </div>
          {/* Task Details */}
          <div className="task-accordion__task-details">
            <div className="task-accordion__task-boxes">
              <Box header="Stages">{pillSeriesRenderer()}</Box>
              <Box
                header="Options"
                text="view"
                link
                onClick={displayTaskOptionsModal}
              />
            </div>
          </div>
          {/* Progress */}
          <div className="task-accordion__task-detail-progress">
            <ProgressBar
              label={getProgressBarLabel()}
              variant={getProgressBarVariant()}
              now={getProgressBarPercentage()}
            />
          </div>

          {/* Cancel Processing */}
          {!FinalStateTaskStatus.includes(taskStatus) && (
            <Button
              className="task-accordion__task-cancel-btn"
              variant={ButtonVariant.Secondary}
              onClick={onCancelProcessing}
              disabled={isCancelBtnDisabled}
            >
              Cancel
            </Button>
          )}
          {/* Task Options */}
          {logsEnabledTaskId === task.id && (
            <TaskOutput
              task={task}
              onClose={onCloseTaskOutput}
              disableDownload={task.status === ProcessingStatus.Pending}
            />
          )}
          <div className="task-accordion__task-options">
            {/* Download Output Button */}
            {taskStatus === ProcessingStatus.Completed && (
              <DropDownButton
                btnText="Download Output"
                drop={DropDownButtonDirection.Down}
              >
                {hasTaskEndedAtGenerateOrtho() && (
                  <>
                    <DropDownButton.Item
                      onClick={() =>
                        onDownloadItemClick(TaskDownloadType.Orthomosaic)
                      }
                    >
                      Orthophoto (GeoTIFF)
                    </DropDownButton.Item>

                    <DropDownButton.Item
                      onClick={() =>
                        onDownloadItemClick(TaskDownloadType.CapturedDSM)
                      }
                    >
                      Surface model (GeoTIFF)
                    </DropDownButton.Item>

                    {isSplitIntoBlocks() && (
                      <DropDownButton.Item
                        onClick={() =>
                          onDownloadItemClick(TaskDownloadType.OrthoTiles)
                        }
                      >
                        Ortho Tiles
                      </DropDownButton.Item>
                    )}
                  </>
                )}
                <DropDownButton.Item
                  onClick={() =>
                    onDownloadItemClick(TaskDownloadType.ProjectFile)
                  }
                >
                  Project File (PSX)
                </DropDownButton.Item>
                {isPointCloudGenerated() && (
                  <DropDownButton.Item
                    onClick={() =>
                      onDownloadItemClick(TaskDownloadType.PointCloud)
                    }
                  >
                    Point Cloud (LAZ)
                  </DropDownButton.Item>
                )}
                <DropDownButton.Item
                  onClick={() => onDownloadItemClick(TaskDownloadType.Report)}
                >
                  Quality Report
                </DropDownButton.Item>
                <DropDownButton.Item
                  onClick={() => onDownloadItemClick(TaskDownloadType.All)}
                >
                  Download as .ZIP
                </DropDownButton.Item>
              </DropDownButton>
            )}
            {/* Meatballs options */}
            <MeatBallsMenu drop={MeatBallsMenuDirection.Down}>
              {!showArchivedIterations && (
                <MeatBallsMenu.Item onClick={() => onDuplicateTask(task)}>
                  Duplicate Task
                </MeatBallsMenu.Item>
              )}
              <MeatBallsMenu.Item onClick={() => onRenameTaskClick()}>
                Rename
              </MeatBallsMenu.Item>
            </MeatBallsMenu>
          </div>
          <ViewTaskOptionsModal
            show={showTaskOptionsModal}
            taskOptions={task.options}
            taskEndStage={task.endStage}
            onClose={hideTaskOptionsModal}
          />
        </div>
      </BootstrapAccordion.Collapse>
    );
  },
);
