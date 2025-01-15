import { ProgressBarState } from '@aus-platform/design-system';

type FileUploadStatus = {
  isFileIdle: boolean;
  isFileUploading: boolean;
  isFileProcessing: boolean;
  isFileUploaded: boolean;
  isFileUploadError: boolean;
};

export const getFileUploadStatus = (
  progress: ProgressBarState,
): FileUploadStatus => {
  const fileUploadStatus: FileUploadStatus = {
    isFileIdle: progress === ProgressBarState.Initial,
    isFileUploading:
      progress >= ProgressBarState.Started &&
      progress < ProgressBarState.Uploaded,
    isFileProcessing: progress === ProgressBarState.Processing,
    isFileUploaded: progress === ProgressBarState.Completed,
    isFileUploadError:
      progress === ProgressBarState.Error ||
      progress === ProgressBarState.Cancelled,
  };

  return fileUploadStatus;
};
