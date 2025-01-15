import { AccordionCollapseProps as BootstrapAccordionCollapseProps } from 'react-bootstrap';
import { AccordionItemProps as BootstrapAccordionItemProps } from 'react-bootstrap/esm/AccordionItem';
import { IterationDataset, Task } from 'src/shared/api';
import { ForwardRef } from 'src/shared/type-utils';

export type TaskAccordionComponents = {
  Item: ForwardRef<HTMLDivElement, TaskAccordionItemProps>;
  Collapse: ForwardRef<HTMLDivElement, TaskAccordionCollapseProps>;
  Header: React.FC<TaskAccordionHeaderProps>;
};

export type TaskAccordionHeaderProps = {
  task: Task;
  eventKey: string;
  color?: string;
};

export type TaskAccordionItemProps = BootstrapAccordionItemProps & {
  task: Task;
  iterationDataset: IterationDataset;
  onDuplicateTask: (task: Task) => void;
  enableLogsForTask: React.Dispatch<React.SetStateAction<string | undefined>>;
  color?: string;
  logsEnabledTaskId?: string;
  showArchivedIterations?: boolean;
  headerProps?: Omit<TaskAccordionHeaderProps, 'eventKey' | 'task'>;
};

export type TaskAccordionCollapseProps = Omit<
  BootstrapAccordionCollapseProps,
  'children'
> & {
  task: Task;
  onCancelProcessing: () => void;
  onDuplicateTask: (task: Task) => void;
  onRenameTaskClick: () => void;
  logsEnabledTaskId: string | undefined;
  enableLogsForTask: React.Dispatch<React.SetStateAction<string | undefined>>;
  refetchTaskDetails;
  isCancelBtnDisabled: boolean;
  continuedFromTask?: Task;
  onApproveTask?: () => void;
  color?: string;
  isLoading?: boolean;
  showArchivedIterations?: boolean;
};
