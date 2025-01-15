import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  ProgressBar,
  ProgressBarState,
  SideCard,
  SideCardLocation,
  getProgressStatus,
} from '@aus-platform/design-system';
import { isEmpty, isNull } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { IterationSubmitButtonText } from '../../enums';
import { iterationInputValidator } from '../../validators';
import { AddIterationInput, AddIterationProps } from './types';
import { handleResponseMessage, useAddIterationRequest } from 'shared/api';
import { TextEditor } from 'shared/components';
import { GlobalContext } from 'shared/context';
import {
  FileType,
  getFileUploadStatus,
  useInputFields,
  useMultipartUpload,
} from 'shared/hooks';

const addIterationInputState: AddIterationInput = {
  name: '',
  date: '',
  info: '',
  capturedDSM: null,
};

export const AddIteration: React.FC<AddIterationProps> = ({
  show,
  closeAddIteration,
  refetch,
}) => {
  // States.
  const [iterationId, setIterationId] = useState<string | null>();
  const [submitBtnText, setSubmitBtnText] = useState(
    IterationSubmitButtonText.AddIteration,
  );

  // Hooks.
  const {
    values,
    names,
    errors,
    setValues,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    resetAll,
  } = useInputFields<AddIterationInput>(
    addIterationInputState,
    iterationInputValidator,
  );

  const { search } = useLocation();

  const {
    progress,
    setUrls: setMultipartUploadUrls,
    startUploading,
    reset: resetMultipartUpload,
    cancelUpload,
  } = useMultipartUpload({
    fileType: FileType.CapturedDsm,
  });

  // Apis.
  const {
    mutate: sendAddIterationRequest,
    data: addIterationResponse,
    isError: isErrorAddIteration,
    isPending: isPendingAddIteration,
    isSuccess: isSuccessAddIteration,
    error: addIterationError,
  } = useAddIterationRequest();

  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  // useRefs.
  const siteIdRef = useRef<string | null>(null);
  siteIdRef.current = new URLSearchParams(search).get('siteId');

  // Constants.
  const dsmFileUploadStatus = getFileUploadStatus(progress);
  const isFileUploadOngoing =
    dsmFileUploadStatus.isFileProcessing || dsmFileUploadStatus.isFileUploading;

  // useEffects.
  useEffect(() => {
    // File is uploaded, only after iteration is added.
    if (isSuccessAddIteration && addIterationResponse) {
      setIterationId(addIterationResponse.data.id);
      updateMultiPartUploadUrls(addIterationResponse.data.id);
    }

    handleResponseMessage(
      isSuccessAddIteration,
      isErrorAddIteration,
      addIterationResponse,
      addIterationError,
    );
  }, [isSuccessAddIteration, isErrorAddIteration]);

  useEffect(() => {
    if (iterationId) {
      // Uploading DSM.
      if (values.capturedDSM) {
        startUploading(values.capturedDSM);
      } else {
        closeSideCard();
      }
    }
  }, [iterationId]);

  useEffect(() => {
    let submitBtnText = IterationSubmitButtonText.AddIteration;

    if (
      dsmFileUploadStatus.isFileUploaded ||
      dsmFileUploadStatus.isFileUploadError
    ) {
      submitBtnText = IterationSubmitButtonText.Done;
    } else if (dsmFileUploadStatus.isFileUploading) {
      submitBtnText = IterationSubmitButtonText.Uploading;
    } else if (dsmFileUploadStatus.isFileProcessing) {
      submitBtnText = IterationSubmitButtonText.Processing;
    } else if (dsmFileUploadStatus.isFileIdle) {
      submitBtnText = IterationSubmitButtonText.AddIteration;
    }

    setSubmitBtnText(submitBtnText);
  }, [progress]);

  // Handlers.
  const updateMultiPartUploadUrls = (iterationId: string) => {
    setMultipartUploadUrls({
      startUploadUrl: `/iterations/${iterationId}/upload-file/`,
      presignedUrl: `/iterations/${iterationId}/presigned-url/`,
      completeUploadUrl: `/iterations/${iterationId}/complete-upload/`,
    });
  };

  const closeSideCard = () => {
    if (isFileUploadOngoing) {
      cancelUpload();
    }

    resetForm();
    resetMultipartUpload();
    closeAddIteration();
    setIterationId(null);
  };

  const onCapturedDsmSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!isNull(files)) {
      setValues({ ...values, capturedDSM: files[0] });
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (submitBtnText === IterationSubmitButtonText.AddIteration) {
      if (!inputHasError() && inputIsDirty() && !isEmpty(siteIdRef.current)) {
        sendAddIterationRequest({
          ...values,
          site: siteIdRef.current,
          org: loggedUser?.org,
        });
      }
    } else if (submitBtnText === IterationSubmitButtonText.Done) {
      closeSideCard();
    }
  };

  const resetForm = () => {
    setValues(addIterationInputState);
    resetAll();
    refetch();
  };

  // Renders.
  return (
    <SideCard
      showCloseButton
      title="Add Iteration"
      placement={SideCardLocation.End}
      onClose={isFileUploadOngoing ? cancelUpload : closeSideCard}
      show={show}
      className="iteration-sidecard"
      footerClassName="justify-content-end"
      restoreFocus={false}
      data-testid="add-iteration-sidecard"
      footer={
        <>
          {!dsmFileUploadStatus.isFileUploaded && (
            <Button variant={ButtonVariant.Secondary} onClick={closeSideCard}>
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            isLoading={
              isPendingAddIteration ||
              dsmFileUploadStatus.isFileUploading ||
              dsmFileUploadStatus.isFileProcessing
            }
            disabled={inputHasError()}
            onClick={onSubmit}
            data-testid="sidecard-add-iteration-btn"
          >
            {submitBtnText}
          </Button>
        </>
      }
    >
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
              disabled={!!iterationId}
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
              disabled={!!iterationId}
            />
          </InputGroup>
        </div>

        {/* Additional Information  */}
        <InputGroup>
          <Input.Label>Additional Information</Input.Label>
          <TextEditor
            placeholder="Enter any additional information here..."
            value={values.info}
            error={errors.info}
            onChange={(value) =>
              setValues((currentValues) => ({
                ...currentValues,
                info: value,
              }))
            }
            disabled={!!iterationId}
          />
        </InputGroup>

        {/* Captured DSM File */}
        <InputGroup>
          <Input.Label>Captured DSM</Input.Label>
          {!iterationId ||
          !values.capturedDSM ||
          progress === ProgressBarState.Initial ? (
            <Input.File
              accept=".tif,.tiff"
              multiple={false}
              onChange={onCapturedDsmSelected}
              name="capturedDSM"
              error={errors.capturedDSM}
              isInvalid={!!errors.capturedDSM}
              {...{ onBlur, onFocus }}
            />
          ) : (
            <>
              <small className="neutral-300-txt mb-1">
                Status : {getProgressStatus(progress)}
              </small>
              <ProgressBar now={progress} />
            </>
          )}
        </InputGroup>
      </form>
    </SideCard>
  );
};
