import React from 'react';
import Modal from 'react-bootstrap/esm/Modal';
import { Button, ButtonVariant } from '@aus-platform/design-system';
import { UntagGcpModalProps } from '../types';

export const GCPUntagAllConfirmationModal: React.FC<UntagGcpModalProps> = ({
  show,
  onUntagGcp,
  gcpName,
  gcpType,
  isLoadingUntagGcp,
  onClose,
}) => {
  return (
    <Modal
      className="gcp-untag-all-modal fade-scale"
      aria-labelledby="contained-modal-title-hcenter"
      show={show}
      centered
      keyboard
      onHide={onClose}
    >
      <Modal.Header>Untag All Confirmation</Modal.Header>
      <Modal.Body>
        <div className="gcp-untag-all-modal__body">
          <p>
            Are you sure you want to untag all images for selected{' '}
            <b>
              {gcpType} name {gcpName}?
            </b>
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          className="gcp-untag-all-modal__submit-btn"
          onClick={onUntagGcp}
          isLoading={isLoadingUntagGcp}
        >
          Yes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
