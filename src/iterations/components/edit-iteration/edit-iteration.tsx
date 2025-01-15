import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  ProgressBar,
  ProgressBarState,
  SideCard,
  SideCardLocation,
  Spinner,
  getProgressStatus,
} from '@aus-platform/design-system';
import { isNull } from 'lodash';
import React, { useEffect, useState } from 'react';
import { IterationSubmitButtonText } from '../../enums';
import { iterationInputValidator } from '../../validators';
import { EditIterationInput, EditIterationProps } from './types';
import {
  handleResponseMessage,
  useDeleteCapturedDSM,
  useFileDownload,
  useIteration,
  useUpdateIteration,
} from 'shared/api';
import { TextEditor } from 'shared/components';
import { ConfirmationCard } from 'shared/components/cards';
import { FileCard } from 'shared/components/file-card';
import { FileStatus } from 'shared/enums';
import { FileType, useInputFields, useMultipartUpload } from 'shared/hooks';

const editIterationInputState: EditIterationInput = {
  name: '',
  date: '',
  info: '',
  capturedDSM: null,
};

export const EditIteration: React.FC<EditIterationProps> = ({
  show,
  closeEditIteration,
  refetch,
  iterationId,
}) => {
  // States.
  const [submitBtnText, setSubmitBtnText] = useState(
    IterationSubmitButtonText.AddIteration,
  );

  const [
    showDeleteCapturedDSMConfirmationCard,
    setShowDeleteCapturedDSMConfirmationCard,
  ] = useState(false);

  // Hooks.
  const {
    values,
    names,
    errors,
    dirty,
    setValues,
    setDirty,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    resetAll,
  } = useInputFields<EditIterationInput>(
    editIterationInputState,
    iterationInputValidator,
  );

  const {
    progress,
    setUrls: setMultipartUploadUrls,
    startUploading,
    reset: resetMultipartUpload,
    cancelUpload,
  } = useMultipartUpload({
    fileType: FileType.CapturedDsm,
  });

  const {
    mutate: sendDownloadUrlRequest,
    data: downloadFileResponse,
    isSuccess: isSuccessFileDownloadResponse,
  } = useFileDownload();

  // Constants.
  const multipartFileUploadStatus = {
    isFileIdle: progress === ProgressBarState.Initial,
    isFileUploading:
      progress >= ProgressBarState.Started &&
      progress < ProgressBarState.Uploaded,
    isFileProcessing: progress === ProgressBarState.Processing,
    isFileUploaded: progress === ProgressBarState.Completed,
    isFileUploadError: progress === ProgressBarState.Error,
  };

  const isFileUploadOngoing =
    multipartFileUploadStatus.isFileProcessing ||
    multipartFileUploadStatus.isFileUploading;

  // Api.
  const {
    data: iteration,
    isSuccess: isSuccessIteration,
    isLoading: isLoadingIteration,
    refetch: refetchIteration,
  } = useIteration(iterationId);

  const {
    mutate: sendUpdateIterationRequest,
    data: editIterationResponse,
    isError,
    isSuccess,
    error,
  } = useUpdateIteration();

  const {
    mutate: sendDeleteCapturedDSMRequest,
    isSuccess: capturedDSMDeleted,
    isPending: isPendingDeleteCapturedDSM,
  } = useDeleteCapturedDSM();

  // useEffects.
  useEffect(() => {
    if (iterationId) {
      setMultipartUploadUrls({
        startUploadUrl: `/iterations/${iterationId}/upload-file/`,
        presignedUrl: `/iterations/${iterationId}/presigned-url/`,
        completeUploadUrl: `/iterations/${iterationId}/complete-upload/`,
      });

      refetchIteration();
      setShowDeleteCapturedDSMConfirmationCard(false);
    }
  }, [iterationId]);

  useEffect(() => {
    handleResponseMessage(isSuccess, isError, editIterationResponse, error);
    if (!dirty.capturedDSM && isSuccess) {
      closeSideCard();
    }
  }, [isSuccess, isError]);

  useEffect(() => {
    if (capturedDSMDeleted) {
      refetchIteration();
      setValues({ ...values, capturedDSM: null });

      // Reset the previously uploaded file status.
      resetMultipartUpload(false);
    }
  }, [capturedDSMDeleted]);

  useEffect(() => {
    if (iteration && isSuccessIteration) {
      setValues({
        name: iteration.data.name,
        date: iteration.data.date.toString(),
        info: iteration.data.info,
        capturedDSM: iteration.data.capturedDSM
          ? new File([], iteration.data.capturedDSM.name)
          : null,
      });
    }
  }, [iteration, isSuccessIteration]);

  useEffect(() => {
    if (isSuccessFileDownloadResponse && downloadFileResponse?.downloadUrl) {
      window.location.href = downloadFileResponse.downloadUrl;
    }
  }, [isSuccessFileDownloadResponse, downloadFileResponse]);

  useEffect(() => {
    if (
      multipartFileUploadStatus.isFileUploaded ||
      multipartFileUploadStatus.isFileUploadError
    ) {
      setSubmitBtnText(IterationSubmitButtonText.Done);
    } else if (multipartFileUploadStatus.isFileUploading) {
      setSubmitBtnText(IterationSubmitButtonText.Uploading);
    } else if (multipartFileUploadStatus.isFileProcessing) {
      setSubmitBtnText(IterationSubmitButtonText.Processing);
    } else if (multipartFileUploadStatus.isFileIdle) {
      setSubmitBtnText(IterationSubmitButtonText.UpdateIteration);
    }
  }, [progress]);

  // Handlers.
  const onCapturedDSMSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!isNull(files)) {
      setDirty({ ...dirty, capturedDSM: true });
      setValues({ ...values, capturedDSM: files[0] });
    }
  };

  const showCapturedDSMDeleteConfirmation = () =>
    setShowDeleteCapturedDSMConfirmationCard(true);

  const closeCapturedDSMDeleteConfirmation = () =>
    setShowDeleteCapturedDSMConfirmationCard(false);

  const deleteCapturedDSM = () => {
    sendDeleteCapturedDSMRequest({ iterationId });
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (
      submitBtnText === IterationSubmitButtonText.UpdateIteration &&
      !inputHasError() &&
      inputIsDirty()
    ) {
      sendUpdateIterationRequest({
        ...values,
        id: iterationId,
      });

      if (values.capturedDSM && values.capturedDSM.size > 0) {
        startUploading(values.capturedDSM);
      }
    } else if (submitBtnText === IterationSubmitButtonText.Done) {
      resetForm();
      closeSideCard();
    }
  };

  const resetForm = () => {
    setValues(editIterationInputState);
    refetch();
    resetAll();
    resetMultipartUpload();
  };

  const closeSideCard = () => {
    resetForm();
    closeEditIteration();
    onCancel();
  };

  const onCancel = () => {
    if (isFileUploadOngoing) {
      cancelUpload();
      resetMultipartUpload();
    }
  };

  return (
    <SideCard
      showCloseButton
      title="Edit Iteration"
      placement={SideCardLocation.End}
      onClose={closeSideCard}
      show={show}
      className="iteration-sidecard"
      footerClassName="justify-content-end"
      data-testid="edit-iteration-sidecard"
      footer={
        <>
          {!multipartFileUploadStatus.isFileUploaded && (
            <Button
              variant={ButtonVariant.Secondary}
              onClick={closeSideCard}
              data-testid="sidecard-cancel-btn"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isFileUploadOngoing}
            disabled={inputHasError() || !inputIsDirty()}
            onClick={onSubmit}
            data-testid="sidecard-update-iteration-btn"
          >
            {submitBtnText}
          </Button>
        </>
      }
    >
      {isLoadingIteration ? (
        <Spinner />
      ) : (
        <form className="iteration-sidecard-form" onSubmit={onSubmit}>
          <div className="iteration-sidecard-form__input-container">
            <InputGroup className="iteration-sidecard-form__input-container__name">
              <Input.Label>Iteration Name</Input.Label>
              <Input.Text
                placeholder="Iteration Name"
                value={values.name}
                name={names.name}
                error={errors.name}
                isInvalid={!!errors.name}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>

            <InputGroup className="iteration-sidecard-form__input-container__date">
              <Input.Label>Select Date</Input.Label>
              <Input.Date
                value={values.date}
                name={names.date}
                error={errors.date}
                isInvalid={!!errors.date}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </div>
          <InputGroup>
            <Input.Label>Additional Information</Input.Label>
            <TextEditor
              placeholder="Enter any additional information here..."
              value={values.info}
              error={errors.info}
              onChange={(value) => {
                setValues((currentValues) => ({
                  ...currentValues,
                  info: value,
                }));
                setDirty({ ...dirty, info: true });
              }}
            />
          </InputGroup>

          {/* Captured DSM File */}
          <InputGroup>
            <Input.Label>Captured DSM</Input.Label>
            {iteration?.data.capturedDSM?.status === FileStatus.Done &&
            iteration.data.capturedDSM.size &&
            iteration.data.capturedDSM.downloadUrl &&
            iteration.data.capturedDSM.id ? (
              <>
                <FileCard
                  fileName={iteration.data.capturedDSM.name}
                  fileSize={iteration.data.capturedDSM.size}
                  onDownloadClick={() =>
                    sendDownloadUrlRequest(iteration.data.capturedDSM!.id)
                  }
                  onDeleteBtnClick={showCapturedDSMDeleteConfirmation}
                  deleteBtnDataTestId="remove-dsm-iteration-btn"
                  data-testid="edit-iteration-file-card"
                />
                {showDeleteCapturedDSMConfirmationCard && (
                  <ConfirmationCard
                    title="Delete Confirmation"
                    message="Are you sure you want to delete captured DSM file?"
                    onSubmit={deleteCapturedDSM}
                    onCancel={closeCapturedDSMDeleteConfirmation}
                    submitLabel="Delete"
                    cancelLabel="Cancel"
                    isSubmitLoading={isPendingDeleteCapturedDSM}
                    onSubmitButtonDataTestId="confirm-delete-dsm-iteration-btn"
                  />
                )}
              </>
            ) : progress !== ProgressBarState.Initial ? (
              <>
                <small className="neutral-300-txt mb-1">
                  Status : {getProgressStatus(progress)}
                </small>
                <ProgressBar now={progress} />
              </>
            ) : (
              <Input.File
                accept=".tif,.tiff"
                multiple={false}
                onChange={onCapturedDSMSelect}
                disabled={multipartFileUploadStatus.isFileUploading}
                name="capturedDSM"
                error={errors.capturedDSM}
                isInvalid={!!errors.capturedDSM}
                {...{ onBlur, onFocus }}
              />
            )}
          </InputGroup>
        </form>
      )}
    </SideCard>
  );
};
