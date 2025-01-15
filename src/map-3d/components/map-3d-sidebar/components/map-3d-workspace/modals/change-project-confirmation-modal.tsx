import { Button, ButtonVariant } from '@aus-platform/design-system';
import React from 'react';
import { Modal } from 'react-bootstrap';
import { ChangeProjectConfirmationModalProps } from './types';

export const ChangeProjectConfirmationModal: React.FC<
  ChangeProjectConfirmationModalProps
> = ({ onHide, show, onClickSwitchProject }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop="static"
      dialogClassName="change-project-confirmation-modal workspace-modal"
      restoreFocus={false}
      centered
    >
      <Modal.Header closeButton>Switch Project?</Modal.Header>
      <Modal.Body data-testid="change-project-confirmation-modal-body">
        <p>
          Switching projects will remove all current layers from your workspace
          and also deselect any terrain you have selected.
        </p>
        <p className="confirmation-message">
          Do you wish to proceed with changing the project?
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onHide}
          data-testid="change-project-confirmation-modal-cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={onClickSwitchProject}
          data-testid="change-project-confirmation-modal-switch-project-button"
        >
          Switch Project
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
