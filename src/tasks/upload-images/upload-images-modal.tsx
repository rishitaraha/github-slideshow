import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  ProgressBar,
  ProgressBarVariant,
} from '@aus-platform/design-system';
import { useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { FileUploadStage } from '../enums';

import { useIterationDatasetContext } from '../contexts';
import { useUploadImages } from './hooks/use-upload-images';
import {
  isUploadStageInCancelButtonStates,
  isUploadStageInError,
  isUploadStageInProgressBarState,
  isUploadStageSameAs,
  renderUploadErrorMessage,
  uploadStageTextColorSelector,
} from './utils';

import { msToTimeString } from 'src/shared/helpers';

const UploadImagesModalHeader = ({ onHideUpload }) => {
  return (
    <Modal.Header onHide={onHideUpload} closeButton>
      Upload Images
    </Modal.Header>
  );
};

const getProgressStageVariant = (uploadStage: FileUploadStage) => {
  if (
    uploadStage === FileUploadStage.Cancelled ||
    uploadStage === FileUploadStage.Error ||
    uploadStage === FileUploadStage.MinimumImagesError
  ) {
    return ProgressBarVariant.Error;
  }
  if (
    uploadStage === FileUploadStage.NetworkError ||
    uploadStage === FileUploadStage.ImagesPreviouslyUploadedError
  ) {
    return ProgressBarVariant.Warning;
  }
};

const UploadImagesModalBody = ({
  uploadStage,
  uploadImagesProgressDetails,
  acceptedImageFileType,
  getImageUploadStatus,
  inputFileRef,
  elapsedTime,
  onFilesSelected,
}) => {
  return (
    <Modal.Body>
      {uploadStage === FileUploadStage.SelectImagesToUpload && (
        <InputGroup>
          <Input.Label className="neutral-300-txt mb-1">
            Please select images to upload
          </Input.Label>
          <Input.File
            type="file"
            multiple
            accept={acceptedImageFileType}
            ref={inputFileRef}
            onChange={onFilesSelected}
          />
        </InputGroup>
      )}

      {/* Progress Bar */}
      {isUploadStageInProgressBarState(uploadStage) && (
        <div>
          <div className="upload-images-modal__it-name">
            <div className="flex-div">
              {
                <div className={'neutral-300-txt mb-1'}>
                  Status:
                  <b> {getImageUploadStatus()}</b>
                </div>
              }
            </div>
          </div>
          <ProgressBar
            now={uploadImagesProgressDetails.progressPercentage}
            variant={getProgressStageVariant(uploadStage)}
          />
          <div className="flex-div upload-images-modal__details">
            {uploadImagesProgressDetails.numberOfFilesUploaded > 0 && (
              <div>
                <span
                  className={
                    'upload-images-modal__highlight-' +
                    uploadStageTextColorSelector(uploadStage)
                  }
                >
                  {uploadImagesProgressDetails.numberOfFilesUploaded}
                </span>{' '}
                images uploaded of{' '}
                <span className="upload-images-modal__highlight">
                  {uploadImagesProgressDetails.totalNumberOfFiles}
                </span>
              </div>
            )}
            {elapsedTime > 0 && (
              <div>
                <span className="upload-images-modal__highlight">
                  {`${msToTimeString(elapsedTime)} time elapsed`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Occurred */}
      {isUploadStageInError(uploadStage) && (
        <div className={renderUploadErrorMessage(uploadStage).className}>
          {renderUploadErrorMessage(uploadStage).errorText}
        </div>
      )}

      {isUploadStageSameAs(
        uploadStage,
        FileUploadStage.ImagesPreviouslyUploadedError,
      ) && (
        <div>
          <div className="neutral-300-txt mb-1">Status: Error</div>
          <ProgressBar variant={ProgressBarVariant.Error} />
          <div className="accent-warning-500-txt mb-1 login-card__error">
            Images you are trying to upload are already uploaded.
          </div>
        </div>
      )}
    </Modal.Body>
  );
};

const UploadImagesModalFooter = ({ uploadStage, onHideUpload }) => {
  return (
    <Modal.Footer>
      {/* Queued to Upload Button */}
      {isUploadStageSameAs(uploadStage, FileUploadStage.QueuedToUpload) && (
        <div className="upload-images-modal__btn-box">
          <Button isLoading={true}>Queued to Upload</Button>
        </div>
      )}

      {/* Starting to Upload Button */}
      {isUploadStageSameAs(uploadStage, FileUploadStage.StartingToUpload) && (
        <div className="upload-images-modal__btn-box">
          <Button isLoading={true}>Starting to Upload</Button>
        </div>
      )}

      {/* Cancel/Done Button */}
      {isUploadStageInCancelButtonStates(uploadStage) && (
        <div className="upload-images-modal__btn-box">
          <div>
            <Button variant={ButtonVariant.Secondary} onClick={onHideUpload}>
              {isUploadStageSameAs(uploadStage, FileUploadStage.Uploaded)
                ? 'Done'
                : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {(isUploadStageInError(uploadStage) ||
        uploadStage === FileUploadStage.SelectImagesToUpload) && (
        <div className="upload-images-modal__btn-box">
          <Button variant={ButtonVariant.Secondary} onClick={onHideUpload}>
            Close
          </Button>
        </div>
      )}
    </Modal.Footer>
  );
};

export const UploadImagesModal = ({ hideUploadImagesModal, isReupload }) => {
  // COntexts.
  const { iterationDataset } = useIterationDatasetContext();

  const acceptedImageFileType = '.jpg,.png,.jpeg';
  const inputFileRef = useRef<HTMLInputElement>(null);

  const {
    elapsedTime,
    uploadStage,
    onFilesSelected,
    uploadImagesProgressDetails,
    onCancelUpload,
    getImageUploadStatus,
  } = useUploadImages(iterationDataset.id, isReupload);

  const onHideUpload = () => {
    onCancelUpload();
    hideUploadImagesModal();
  };

  return (
    <>
      <Modal
        className="upload-images-modal"
        dialogClassName="upload-images-modal-dialog"
        centered
        show={true}
        keyboard={true}
        aria-labelledby="contained-modal-title-hcenter"
      >
        <UploadImagesModalHeader {...{ onHideUpload }} />
        <UploadImagesModalBody
          {...{
            uploadStage,
            uploadImagesProgressDetails,
            getImageUploadStatus,
            elapsedTime,
            acceptedImageFileType,
            inputFileRef,
            onFilesSelected,
          }}
        />
        <UploadImagesModalFooter {...{ uploadStage, onHideUpload }} />
      </Modal>
    </>
  );
};
