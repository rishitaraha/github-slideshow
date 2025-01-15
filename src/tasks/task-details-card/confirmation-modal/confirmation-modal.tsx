import { Button, ButtonVariant } from '@aus-platform/design-system';
import React from 'react';
import { Modal } from 'react-bootstrap';

type ConfirmationModalProps = {
  onAccept: () => void;
  onCancel: () => void;
  title?: string;
  message?: React.ReactNode;
  noText?: string;
  yesText?: string;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onCancel,
  onAccept,
  title,
  message,
  noText,
  yesText,
}) => {
  return (
    <Modal
      className="confirmation-modal body-txt-3"
      contentClassName="w-40"
      show={true}
      centered
      keyboard={true}
      aria-labelledby="contained-modal-title-hcenter"
    >
      <Modal.Header>{!title ? 'Confirmation' : title}</Modal.Header>
      <Modal.Body>
        {!message ? 'Are you sure you want to continue?' : message}
        <div className="confirmation-modal__buttons">
          <Button variant={ButtonVariant.Outline} onClick={onCancel}>
            {noText ? noText : 'No'}
          </Button>
          <Button onClick={onAccept}> {yesText ? yesText : 'Yes'}</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
