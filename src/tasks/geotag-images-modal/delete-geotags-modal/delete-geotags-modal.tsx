import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/esm/Modal';
import {
  Button,
  ButtonVariant,
  Icon,
  Input,
  toast,
  IconIdentifier,
} from '@aus-platform/design-system';
import { GeotagImageEntity } from '../enum';
import { useGeotagImagesContext } from '../../contexts';
import { useDeleteBulkGeotagImageRequest } from 'src/shared/api';

export const DeleteGeotagModal: React.FC = () => {
  // Contexts.
  const {
    iterationDataset,
    hideDeleteGeotagsModal,
    refetchGeotagImages,
    rowSelection,
  } = useGeotagImagesContext();

  // States.
  const [deleteImageData, setDeleteImageData] = useState(true);
  const [deleteGeotagData, setDeleteGeotagData] = useState(true);
  const [geotagDeleteOptions, setGeotagDeleteOptions] =
    useState<GeotagImageEntity>(GeotagImageEntity.GeotagImage);
  const geotagImagesToDelete = Object.keys(rowSelection);

  const {
    mutate: deleteBulkGeotagImageData,
    isPending: isLoadingDeleteBulkGeotagImageDataRequest,
    isSuccess: isSuccessDeleteBulkGeotagImageDataRequest,
    isError: isErrorDeleteBulkGeotagImageDataRequest,
  } = useDeleteBulkGeotagImageRequest();

  // useEffects.
  useEffect(() => {
    if (isSuccessDeleteBulkGeotagImageDataRequest) {
      toast.success('Geotag/Image deleted successfully');
      refetchGeotagImages();
      hideDeleteGeotagsModal();
    }

    if (isErrorDeleteBulkGeotagImageDataRequest) {
      toast.error('Geotag/Image deleting failed');
    }
  }, [
    isSuccessDeleteBulkGeotagImageDataRequest,
    isErrorDeleteBulkGeotagImageDataRequest,
  ]);

  useEffect(() => {
    if (deleteImageData && deleteGeotagData) {
      setGeotagDeleteOptions(GeotagImageEntity.GeotagImage);
    } else if (deleteImageData) {
      setGeotagDeleteOptions(GeotagImageEntity.ImageData);
    } else if (deleteGeotagData) {
      setGeotagDeleteOptions(GeotagImageEntity.GeotagData);
    }
  }, [deleteImageData, deleteGeotagData]);

  // Handlers.
  const onDeleteSubmit = () => {
    deleteBulkGeotagImageData({
      geotagImageIds: geotagImagesToDelete,
      entity: geotagDeleteOptions,
      iterationDataset: iterationDataset.id,
    });
  };

  // Render.
  const renderDeleteView = () => {
    return (
      <>
        <div className="geotag-delete-modal__body-text">
          Select what you want to delete:
        </div>
        <Input.Label>
          <Input.CheckBox
            checked={deleteImageData}
            onClick={() => {
              setDeleteImageData(!deleteImageData);
            }}
            className="geotag-delete-modal__check checkbox-no-background"
          />{' '}
          Image File
        </Input.Label>
        <Input.Label>
          <Input.CheckBox
            checked={deleteGeotagData}
            onClick={() => {
              setDeleteGeotagData(!deleteGeotagData);
            }}
            className="geotag-delete-modal__check checkbox-no-background"
          />{' '}
          Geotag Data (Only Coordinates)
        </Input.Label>
        <div className="login-card__warning d-flex">
          <Icon identifier={IconIdentifier.Warning} size={18} />
          Selected data will be permanently deleted
        </div>
      </>
    );
  };

  return (
    <Modal
      className="geotag-delete-modal fade-scale"
      dialogClassName="geotag-delete-modal-dialog"
      show
      centered
      keyboard
      onHide={hideDeleteGeotagsModal}
      aria-labelledby="contained-modal-title-hcenter"
    >
      <Modal.Header closeButton>Delete Confirmation</Modal.Header>
      <Modal.Body>
        <div className="geotag-delete-modal__body">{renderDeleteView()}</div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={hideDeleteGeotagsModal}
        >
          Cancel
        </Button>
        <Button
          data-testid="delete-button"
          variant={ButtonVariant.Primary}
          disabled={!(deleteGeotagData || deleteImageData)}
          className="geotag-delete-modal__cancel"
          onClick={onDeleteSubmit}
          isLoading={isLoadingDeleteBulkGeotagImageDataRequest}
        >
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
