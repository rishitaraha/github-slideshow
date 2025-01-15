import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { Accordion as BootstrapAccordion } from 'react-bootstrap';
import { toast } from '@aus-platform/design-system';
import { RenameModal } from '../rename-modal';
import { ConfirmationModal } from '../confirmation-modal';
import { RenameValues } from '../rename-modal/types';
import { TaskAccordionItemProps } from './types';
import { TaskAccordion } from './task-accordion';
import {
  ContinuedFromDatasetType,
  handleResponseMessage,
  Task,
  useCancelTask,
  useRenameTaskRequest,
  useTask,
} from 'src/shared/api';

export const TaskAccordionItem = React.forwardRef<
  HTMLDivElement,
  TaskAccordionItemProps
>(
  (
    {
      className,
      eventKey,
      headerProps,
      color: colorClass,
      task,
      iterationDataset,
      onDuplicateTask,
      logsEnabledTaskId,
      enableLogsForTask,
      showArchivedIterations,
      ...rest
    },
    ref,
  ) => {
    // Custom classnames.
    const customClassName = classNames(['task-accordion__item', className]);

    // States.
    const [taskState, setTaskState] = useState<Task>(task);
    const [showCancelTaskModal, setShowCancelTaskModal] = useState(false);
    const [showRenameTaskModal, setShowRenameTaskModal] = useState(false);
    const [continuedFromTask, setContinuedFromTask] = useState<Task>();
    const [isCancelBtnDisabled, setIsCancelBtnDisabled] = useState(false);

    // Api.
    const {
      data: taskResponse,
      isSuccess: isSuccessTaskDetailsResponse,
      refetch: refetchTaskDetails,
    } = useTask(task?.id, false);

    const {
      mutate: sendCancelTaskRequest,
      data: taskCancelResponse,
      isSuccess: isSuccessTaskCancelResponse,
      isError: isErrorTaskCancelResponse,
    } = useCancelTask(task.id);

    const {
      mutate: sendRenameTaskRequest,
      isSuccess: isSuccessRenameTaskRequest,
      isError: isErrorRenameTaskRequest,
      data: renameTaskResponse,
      error: renameTaskError,
    } = useRenameTaskRequest();

    useEffect(() => {
      if (
        iterationDataset.tasks &&
        task.continuedFrom === ContinuedFromDatasetType.TASK
      ) {
        const continuedFromDataset = iterationDataset?.tasks.find(
          (taskObj) => taskObj.id === task.continuedFromTask,
        );
        setContinuedFromTask(continuedFromDataset);
      }
    }, []);

    useEffect(() => {
      if (isSuccessTaskDetailsResponse && taskResponse) {
        setTaskState(taskResponse.data);
      }
    }, [isSuccessTaskDetailsResponse, taskResponse]);

    useEffect(() => {
      if (isSuccessTaskCancelResponse && taskCancelResponse) {
        refetchTaskDetails();
      } else if (isErrorTaskCancelResponse) {
        toast.error("Couldn't cancel the task. Please try again.");
        setIsCancelBtnDisabled(false);
      }
    }, [
      isSuccessTaskCancelResponse,
      isErrorTaskCancelResponse,
      taskCancelResponse,
    ]);

    useEffect(() => {
      if (isSuccessRenameTaskRequest) {
        refetchTaskDetails();
      }
      hideRenameTaskModal();
      handleResponseMessage(
        isSuccessRenameTaskRequest,
        isErrorRenameTaskRequest,
        renameTaskResponse,
        renameTaskError,
      );
    }, [isSuccessRenameTaskRequest, renameTaskResponse]);

    // Helpers.
    const onRenameTaskModalSubmit = (values: RenameValues) => {
      sendRenameTaskRequest({
        taskId: task.id,
        name: values.name,
      });
    };

    // Handlers.
    const onCancelProcessing = () => {
      setIsCancelBtnDisabled(!isCancelBtnDisabled);
      hideCancelTaskModal();
      sendCancelTaskRequest();
    };

    // Modal Handlers.
    const displayCancelTaskModal = () => setShowCancelTaskModal(true);
    const hideCancelTaskModal = () => setShowCancelTaskModal(false);

    const displayRenameTaskModal = () => setShowRenameTaskModal(true);
    const hideRenameTaskModal = () => setShowRenameTaskModal(false);
    return (
      <>
        <BootstrapAccordion.Item
          ref={ref}
          className={customClassName}
          eventKey={eventKey}
          {...rest}
        >
          <TaskAccordion.Header
            eventKey={eventKey}
            color={colorClass}
            task={taskState}
            {...headerProps}
          />

          <TaskAccordion.Collapse
            eventKey={eventKey}
            color={colorClass}
            task={taskState}
            onCancelProcessing={displayCancelTaskModal}
            onRenameTaskClick={displayRenameTaskModal}
            isCancelBtnDisabled={isCancelBtnDisabled}
            {...{
              continuedFromTask,
              onDuplicateTask,
              logsEnabledTaskId,
              enableLogsForTask,
              showArchivedIterations,
              refetchTaskDetails,
            }}
          />
        </BootstrapAccordion.Item>
        {showCancelTaskModal && (
          <ConfirmationModal
            title="Cancel Confirmation"
            message="Are you sure you want to cancel task processing?"
            yesText="Yes, Cancel!"
            onCancel={hideCancelTaskModal}
            onAccept={onCancelProcessing}
          />
        )}
        <RenameModal
          title="Task"
          show={showRenameTaskModal}
          onClose={hideRenameTaskModal}
          onSubmit={onRenameTaskModalSubmit}
          value={taskState.name}
        />
      </>
    );
  },
);
