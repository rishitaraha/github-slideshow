import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
} from '@aus-platform/design-system';
import { isNull } from 'lodash';
import React from 'react';
import { Modal } from 'react-bootstrap';

type GeotagsUploadModalProps = {
  acceptedFileFormat: string;
  geotagFileObject: File | null;
  setGeotagFileObject: (e) => void;
  onSubmit: (e) => void;
  onClose: VoidFunction;
};

export const GeotagsUploadModal: React.FC<GeotagsUploadModalProps> = ({
  geotagFileObject,
  acceptedFileFormat,
  setGeotagFileObject,
  onSubmit,
  onClose,
}) => {
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setGeotagFileObject(files[0]);
    }
  };
  return (
    <Modal
      className="upload-geotags-modal fade body-txt-3"
      contentClassName="upload-geotags-modal-content w-50"
      centered
      show
      backdrop
      aria-labelledby="contained-modal-title-hcenter"
      onHide={onClose}
    >
      <Modal.Header closeButton>Upload Geotags</Modal.Header>
      <form onSubmit={onSubmit}>
        <Modal.Body>
          <InputGroup>
            <Input.Label>{`Select geotags file`}</Input.Label>
            <Input.File accept={acceptedFileFormat} onChange={onFileSelected} />
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex gap-3">
            <Button variant={ButtonVariant.Secondary} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isNull(geotagFileObject)}>
              Next
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
