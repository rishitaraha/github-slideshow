import React from 'react';
import { Modal } from 'react-bootstrap';
import {
  Button,
  ButtonVariant,
  Icon,
  Pill,
  PillVariant,
  ColorClass,
  IconIdentifier,
} from '@aus-platform/design-system';
import { GCPTagExitConfirmationModalProps } from '../types';

export const GCPTagExitConfirmationModal: React.FC<
  GCPTagExitConfirmationModalProps
> = ({ show, onHide, handleExitWithoutSaving, handleExitAndSave }) => {
  return (
    <Modal
      show={show}
      aria-labelledby="contained-modal-title-hcenter"
      className="gcp-tag-exit-confirmation"
      onHide={onHide}
      centered
    >
      <Modal.Header>
        <div>Unsaved Data Warning</div>
        <Icon
          identifier={IconIdentifier.Cross}
          colorClass={ColorClass.Neutral300}
          onClick={onHide}
          cursor
        />
      </Modal.Header>
      <Modal.Body>
        <h4>Are you sure you want to leave this page?</h4>
        <Pill variant={PillVariant.Warning}>
          There is unsaved data that will be lost if you proceed
        </Pill>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={handleExitWithoutSaving}
        >
          Exit without Saving
        </Button>
        <Button variant={ButtonVariant.Primary} onClick={handleExitAndSave}>
          Save & Exit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
