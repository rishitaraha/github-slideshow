import { FileUploadStage } from 'src/tasks/enums';

export const isUploadStageInError = (uploadStage: FileUploadStage) => {
  return (
    uploadStage === FileUploadStage.Error ||
    uploadStage === FileUploadStage.MinimumImagesError
  );
};

export const isUploadStageInProgressBarState = (
  uploadStage: FileUploadStage,
) => {
  const uploadStageProgressBarStates = [
    FileUploadStage.QueuedToUpload,
    FileUploadStage.StartingToUpload,
    FileUploadStage.Uploading,
    FileUploadStage.Uploaded,
    FileUploadStage.NetworkError,
  ];
  return uploadStageProgressBarStates.includes(uploadStage);
};

export const isUploadStageInCancelButtonStates = (
  uploadStage: FileUploadStage,
) => {
  const uploadStageCancelButtonStates = [
    FileUploadStage.Uploaded,
    FileUploadStage.ImagesPreviouslyUploadedError,
    FileUploadStage.NetworkError,
    FileUploadStage.Uploading,
  ];
  return uploadStageCancelButtonStates.includes(uploadStage);
};

export const isUploadStageSameAs = (
  currentStage: FileUploadStage,
  stageToCompare: FileUploadStage,
) => {
  return currentStage === stageToCompare;
};

export const renderUploadErrorMessage = (uploadStage) => {
  let errorText = '';
  let className = 'login-card__error';
  if (isUploadStageSameAs(uploadStage, FileUploadStage.Error)) {
    errorText = 'Select only images.';
  } else if (
    isUploadStageSameAs(
      uploadStage,
      FileUploadStage.ImagesPreviouslyUploadedError,
    )
  ) {
    errorText = 'Images you are trying to upload are already uploaded';
  } else if (
    isUploadStageSameAs(uploadStage, FileUploadStage.MinimumImagesError)
  ) {
    errorText = 'Select at least 20 images.';
  } else if (isUploadStageSameAs(uploadStage, FileUploadStage.NetworkError)) {
    className = 'login-card__warning';
    errorText = 'Network Error occurred, retrying...';
  }
  return { className: className, errorText: errorText };
};

export const uploadStageTextColorSelector = (stage) => {
  if (stage === FileUploadStage.Uploaded) {
    return 'green';
  }
  if (stage === FileUploadStage.Error || stage === FileUploadStage.Cancelled) {
    return 'red';
  }
  if (stage === FileUploadStage.NetworkError) {
    return 'yellow';
  }
  return 'blue';
};
