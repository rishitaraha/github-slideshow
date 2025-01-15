import classNames from 'classnames';
import { isNull } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AccordionContext, useAccordionButton } from 'react-bootstrap';
import { AccordionContextValue } from 'react-bootstrap/esm/AccordionContext';
import {
  Icon,
  ColorClass,
  IconIdentifier,
  Tooltip,
  CopyUidPillComponent,
} from '@aus-platform/design-system';
import { TaskAccordionHeaderProps } from './types';
import { ProcessingStatus, UidInitials } from 'src/shared/enums';
import {
  createdAtFormatter,
  isEllipsis,
  msToTimeString,
} from 'src/shared/helpers';
import { ProgressDetails } from 'src/tasks/types';
import { ProcessingStatusLabel } from 'src/shared/constants';
import { ProgressContext } from 'src/tasks/contexts';

// Task Accordion Header.
export const TaskAccordionHeader: React.FC<TaskAccordionHeaderProps> = ({
  task,
  eventKey,
  color: colorClass,
}) => {
  // States.
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [status, setStatus] = useState<ProcessingStatus>(task.status);

  const { progressDetails, removeDatasetFromProgressTracking } =
    useContext(ProgressContext);

  const taskProgressDetails: ProgressDetails = progressDetails
    ? progressDetails[task.id]
    : undefined;

  const taskStatus = taskProgressDetails?.progressStatus || task.status;

  // useEffects.
  useEffect(() => {
    let elapseInterval: NodeJS.Timeout;
    if (task.status === ProcessingStatus.Processing) {
      calculateElapseTime();
      elapseInterval = setInterval(calculateElapseTime, 1000);
    } else if (
      task.startedAt &&
      task.stoppedAt &&
      (task.status === ProcessingStatus.Completed ||
        task.status === ProcessingStatus.Error)
    ) {
      setElapsedTime(
        new Date(task.stoppedAt).getTime() - new Date(task.startedAt).getTime(),
      );
    }
    if (task.status) {
      removeDatasetFromProgressTracking(task.id);
    }
    if (task) {
      setStatus(task.status);
    }
    return () => {
      clearInterval(elapseInterval);
    };
  }, [task]);

  useEffect(() => {
    if (
      [
        ProcessingStatus.Error,
        ProcessingStatus.Processing,
        ProcessingStatus.Cancelled,
      ].includes(taskStatus)
    ) {
      setStatus(taskStatus);
    }
  }, [taskStatus]);

  // useRef.
  const ellipsisRef = useRef<HTMLDivElement>(null);

  // Hooks.
  const { activeEventKey } =
    useContext<AccordionContextValue>(AccordionContext);
  const isAccordionActive = eventKey === activeEventKey;
  const onAccordionClicked = useAccordionButton(eventKey, () => {});
  const isTextOverflow = isEllipsis(ellipsisRef);

  // Variables.
  const headerCustomClass = classNames([
    'task-accordion__header',
    { 'border-bottom-hide': isAccordionActive },
    colorClass + '-border-left',
  ]);

  // Functions.
  const statusCustomClass = classNames([
    'task-accordion__task-status',
    {
      [ColorClass.AccentSuccess + '-txt']:
        status === ProcessingStatus.Completed,
      [ColorClass.AccentError + '-txt']:
        status === ProcessingStatus.Error ||
        status === ProcessingStatus.Cancelled,
      [ColorClass.AccentWarning + '-txt']:
        status === ProcessingStatus.Pending ||
        status === ProcessingStatus.Processing ||
        isNull(status),
    },
  ]);

  const calculateElapseTime = () => {
    if (task.startedAt) {
      const elapse = Math.abs(
        new Date(Date.now()).getTime() - new Date(task.startedAt).getTime(),
      );
      setElapsedTime(elapse);
    }
  };

  return (
    <div className={headerCustomClass} onClick={onAccordionClicked}>
      <div className="task-accordion__task-name" ref={ellipsisRef}>
        {isTextOverflow ? (
          <Tooltip hoverText={task.name}>
            <div className="task-accordion__task-name">{task.name}</div>
          </Tooltip>
        ) : (
          task.name
        )}
      </div>

      <div className="task-accordion__task__right-container">
        {elapsedTime > 0 && (
          <span className="task-accordion__task-duration">
            <Icon identifier={IconIdentifier.Clock} size={15} />
            <span className="task-accordion__task-duration-text">
              {msToTimeString(elapsedTime)}
            </span>
          </span>
        )}
        <div className="task-accordion__task-container">
          <span className="task-accordion__task-id">
            <CopyUidPillComponent
              prefixText={'ID'}
              serialId={task.serialId}
              uidType={UidInitials.Task}
            />
          </span>
          <span className="task-accordion__task-created-at">
            <span className="task-accordion__task-created-at-text">
              {task.createdAt && createdAtFormatter(new Date(task.createdAt))}
            </span>
          </span>
        </div>
        <span className={statusCustomClass}>
          {ProcessingStatusLabel[status] ?? 'Pending'}
        </span>
        <div className="task-accordion__task-chevron">
          <Icon
            identifier={
              isAccordionActive
                ? IconIdentifier.ChevronBigUp
                : IconIdentifier.ChevronBigDown
            }
            size={16}
          />
        </div>
      </div>
    </div>
  );
};
