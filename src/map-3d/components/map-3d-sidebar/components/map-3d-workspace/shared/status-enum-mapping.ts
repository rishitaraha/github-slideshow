import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { BatchJobStatus, FileStatus } from '../../../../../../shared/enums';

export const BatchJobStatusIndicatorMapping = {
  [BatchJobStatus.Completed]: StatusIndicatorLevel.Completed,
  [BatchJobStatus.Failed]: StatusIndicatorLevel.Failed,
  [BatchJobStatus.Processing]: StatusIndicatorLevel.Processing,
  [BatchJobStatus.Started]: StatusIndicatorLevel.Started,
};

export const BatchJobFileStatusMapping = {
  [BatchJobStatus.Completed]: FileStatus.Done,
  [BatchJobStatus.Failed]: FileStatus.Failed,
  [BatchJobStatus.Processing]: FileStatus.Processing,
  [BatchJobStatus.Started]: FileStatus.Starting,
};
