import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  FormMessage,
  FormMessageVariant,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import React from 'react';
import { Modal } from 'react-bootstrap';

type ConfirmationModalProps = {
  onSubmit: () => void;
  onClose: () => void;
  message: React.ReactNode;
  title?: string;
  className?: string;
  cancelText?: string;
  confirmText?: string;
  isConfirmButtonLoading?: boolean;
  isConfirmDanger?: boolean;
  alertMessage?: React.ReactNode;
  onCloseButtonDataTestId?: string;
  onSubmitButtonDataTestId?: string;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onClose,
  onSubmit,
  title = 'Confirmation',
  message,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  isConfirmButtonLoading: isConfirmButtonLoading,
  isConfirmDanger: isConfirmDanger,
  alertMessage,
  className,
  onCloseButtonDataTestId,
  onSubmitButtonDataTestId,
}) => {
  const customClass = classNames(['confirmation-modal', className]);

  return (
    <Modal
      className={customClass}
      contentClassName="w-40"
      show={true}
      centered
      keyboard={true}
      aria-labelledby="contained-modal-title-hcenter"
    >
      <Modal.Header>
        <div>{title}</div>
        <Icon
          identifier={IconIdentifier.Cross}
          className="btn m-0 p-0"
          onClick={onClose}
          size={24}
          colorClass={ColorClass.Neutral300}
        />
      </Modal.Header>
      <Modal.Body>
        {message}
        {alertMessage && (
          <FormMessage
            variant={FormMessageVariant.Warning}
            message={alertMessage}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onClose}
          data-testid={onCloseButtonDataTestId}
        >
          {cancelText}
        </Button>
        <Button
          className={classNames({ danger: isConfirmDanger })}
          onClick={onSubmit}
          isLoading={isConfirmButtonLoading}
          data-testid={onSubmitButtonDataTestId}
        >
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
