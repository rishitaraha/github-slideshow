import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  SelectOption,
  toast,
} from '@aus-platform/design-system';
import { FC, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { isNil } from 'lodash';
import {
  InputHorizontalCRSOptions,
  InputVerticalCRSOptions,
} from '../constants';
import { GCPUploadAction } from '../enums';
import { SelectedCrsOption } from '../types';
import { useIterationDatasetContext } from '../contexts';
import { AppendReplaceGCP } from './append-replace-gcp';
import { UploadGCPModalProps } from './types';
import { EPSGCode, VerticalCRS } from 'shared/enums';
import { useUploadGCP, UploadGCPPayload } from 'shared/api';

export const UploadGCPModal: FC<UploadGCPModalProps> = ({
  hideGcpUploadModal,
}) => {
  // COntexts.
  const { iterationDataset } = useIterationDatasetContext();

  // States.
  const [gcpCRS, setGcpCRS] = useState<SelectedCrsOption>({
    horizontalCRS:
      InputHorizontalCRSOptions.find(
        (option) => option.value === iterationDataset.gcpHorizontalCrs,
      ) ?? null,
    verticalCRS:
      InputVerticalCRSOptions.find(
        (option) => option.value === iterationDataset.gcpVerticalCrs,
      ) ?? null,
  });
  const [gcpFileObject, setGCPFileObject] = useState<File | null>(null);
  const [gcpUploadAction, setGCPUploadAction] = useState<GCPUploadAction>(
    GCPUploadAction.REPLACE,
  ); // Default value has to be set for radio.

  const {
    mutate: sendUploadGCPRequest,
    data: uploadGCPResponse,
    isPending: isPendingUploadGCP,
    isSuccess: isSuccessUploadGCP,
    error: uploadGCPError,
    reset: resetGCPResponse,
  } = useUploadGCP();

  // useEffect
  useEffect(() => {
    if (isSuccessUploadGCP) {
      onCloseGCPUploadModal();
    }
  }, [isSuccessUploadGCP]);

  // Variables.
  const isInputValid =
    !isNil(gcpCRS.horizontalCRS) &&
    !isNil(gcpCRS.verticalCRS) &&
    !isNil(gcpFileObject);

  // useEffects.
  useEffect(() => {
    if (uploadGCPResponse && isSuccessUploadGCP) {
      toast.success('GCP uploaded successfully!');
    }
  }, [uploadGCPResponse, isSuccessUploadGCP]);

  // Handler.
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setGCPFileObject(files[0]);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !gcpCRS ||
      !gcpCRS.horizontalCRS ||
      !gcpCRS.verticalCRS ||
      !gcpFileObject
    ) {
      return;
    }

    const payload: UploadGCPPayload = {
      gcpHorizontalCRS: gcpCRS.horizontalCRS.value,
      gcpVerticalCRS: gcpCRS.verticalCRS.value,
      gcpFile: gcpFileObject,
      action: gcpUploadAction,
      iterationDataset: iterationDataset.id,
    };
    sendUploadGCPRequest(payload);
  };

  const handleGCPSelection = ({
    horizontalCRS,
    verticalCRS,
  }: {
    horizontalCRS?: SelectOption<EPSGCode> | null;
    verticalCRS?: SelectOption<VerticalCRS> | null;
  }) => {
    let updatedValue: SelectedCrsOption | null = null;
    if (horizontalCRS || verticalCRS) {
      updatedValue = {
        horizontalCRS: horizontalCRS ?? gcpCRS?.horizontalCRS ?? null,
        verticalCRS: verticalCRS ?? gcpCRS?.verticalCRS ?? null,
      };
    }

    if (updatedValue) {
      setGcpCRS(updatedValue);
    }
  };

  const onCloseGCPUploadModal = () => {
    hideGcpUploadModal();
    resetGCPResponse();
  };

  // Render.
  return (
    <Modal
      className="upload-gcp-modal fade body-txt-3"
      contentClassName="upload-gcp-modal-content w-50"
      show
      centered
      backdrop
      aria-labelledby="contained-modal-title-hcenter"
      onHide={onCloseGCPUploadModal}
    >
      <Modal.Header closeButton>Upload GCP</Modal.Header>
      <form onSubmit={onSubmit}>
        <Modal.Body>
          {iterationDataset.areGcpsPresent && (
            <AppendReplaceGCP
              setUploadAction={setGCPUploadAction}
              uploadAction={gcpUploadAction}
            />
          )}
          <InputGroup className="upload-gcp-modal__file-upload">
            <Input.Label>{`Select GCP file`}</Input.Label>
            <Input.File
              accept=".txt, .csv"
              onChange={onFileSelected}
              disabled={isPendingUploadGCP}
            />
          </InputGroup>
          <InputGroup className="upload-gcp-modal__gcp-input-crs__container">
            <Input.Label>
              <span>GCP INPUT CRS</span>
              <hr />
            </Input.Label>
            <InputGroup className="upload-gcp-modal__gcp-input-crs">
              <InputGroup>
                <Input.Label>Horizontal CRS</Input.Label>
                <Input.Select
                  options={InputHorizontalCRSOptions}
                  value={gcpCRS?.horizontalCRS}
                  onChange={(horizontalCRS: SelectOption<EPSGCode>) =>
                    handleGCPSelection({ horizontalCRS })
                  }
                  placeholder="Horizontal CRS"
                ></Input.Select>
              </InputGroup>
              <InputGroup>
                <Input.Label>Vertical CRS</Input.Label>
                <Input.Select
                  options={InputVerticalCRSOptions}
                  value={gcpCRS?.verticalCRS}
                  onChange={(verticalCRS: SelectOption<VerticalCRS>) =>
                    handleGCPSelection({ verticalCRS })
                  }
                  placeholder="Vertical CRS"
                ></Input.Select>
              </InputGroup>
            </InputGroup>
          </InputGroup>
          {uploadGCPError && (
            <div className="upload-gcp-modal__gcp-error">
              {uploadGCPError.meta.message}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex gap-3">
            <Button
              variant={ButtonVariant.Outline}
              onClick={onCloseGCPUploadModal}
              disabled={isPendingUploadGCP}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isPendingUploadGCP}
              disabled={!isInputValid || isPendingUploadGCP}
            >
              Save
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
