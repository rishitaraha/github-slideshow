import React from 'react';
import { Card } from 'react-bootstrap';
import { Button, ButtonVariant } from '@aus-platform/design-system';

type ConfirmationCardProps = {
  onSubmit: () => void;
  onCancel: () => void;
  title?: string;
  message?: React.ReactNode;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitLoading?: boolean;
  onCancelBtnDataTestId?: string;
  onSubmitButtonDataTestId?: string;
};

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  onCancel,
  onSubmit,
  title,
  message,
  cancelLabel,
  submitLabel,
  isSubmitLoading,
  onCancelBtnDataTestId,
  onSubmitButtonDataTestId,
  ...rest
}) => {
  return (
    <Card className="confirmation-card" {...rest}>
      <Card.Header className="confirmation-card__title">
        {!title ? 'Confirmation' : title}
      </Card.Header>
      <Card.Body>
        {!message ? 'Are you sure you want to continue?' : message}
        <div className="confirmation-card__buttons">
          <Button
            variant={ButtonVariant.Secondary}
            onClick={onCancel}
            data-testid={onCancelBtnDataTestId}
          >
            {cancelLabel ? cancelLabel : 'No'}
          </Button>
          <Button
            onClick={onSubmit}
            variant={ButtonVariant.Primary}
            disabled={isSubmitLoading}
            isLoading={isSubmitLoading}
            data-testid={onSubmitButtonDataTestId}
          >
            {' '}
            {submitLabel ? submitLabel : 'Yes'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};
