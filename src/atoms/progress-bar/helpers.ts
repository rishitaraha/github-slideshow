import { ProgressBarState } from '../../enums';

export const getProgressStatus = (progress: number) => {
  let status = '';
  if (
    progress > ProgressBarState.Initial &&
    progress < ProgressBarState.Uploaded
  ) {
    status = 'Uploading';
  } else if (progress === ProgressBarState.Processing) {
    status = 'Processing';
  } else if (progress === ProgressBarState.Error) {
    status = 'Error';
  } else if (progress === ProgressBarState.Completed) {
    status = 'Uploaded';
  } else if (progress === ProgressBarState.Cancelled) {
    status = 'Cancelled';
  } else {
    status = 'Starting Upload';
  }
  return status;
};
