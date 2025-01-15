import { ProgressBarVariant } from '@aus-platform/design-system';
import { ProcessingStatus } from '../enums';

export const ProcessingStatusProgressVariant = {
  [ProcessingStatus.Cancelled]: ProgressBarVariant.Cancelled,
  [ProcessingStatus.Completed]: ProgressBarVariant.Success,
  [ProcessingStatus.Error]: ProgressBarVariant.Error,
  [ProcessingStatus.Pending]: ProgressBarVariant.Warning,
  [ProcessingStatus.Processing]: ProgressBarVariant.Processing,
};

export const ProcessingStatusLabel: Record<string, string> = {
  [ProcessingStatus.Cancelled]: 'Cancelled',
  [ProcessingStatus.Completed]: 'Completed',
  [ProcessingStatus.Error]: 'Error',
  [ProcessingStatus.Pending]: 'Pending',
  [ProcessingStatus.Processing]: 'Processing',
};
