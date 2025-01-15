import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Input,
  InputGroup,
} from '@aus-platform/design-system';
import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useInputFields } from '../../../hooks';

export type ChangePasswordInput = {
  oldPassword: string;
  password: string;
  confirmPassword: string;
};

type ChangePasswordModalProps = {
  onClose: () => void;
  onSubmit: (values: ChangePasswordInput) => void;
  isLoading?: boolean;
  hasOldPasswordFailed?: boolean;
};

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onClose,
  onSubmit,
  isLoading,
  hasOldPasswordFailed,
}) => {
  // Hooks.
  const {
    values,
    errors,
    names,
    inputHasError,
    inputIsDirty,
    setErrors,
    onBlur,
    onChange,
    onFocus,
  } = useInputFields({
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });
  // useEffects.
  useEffect(() => {
    if (hasOldPasswordFailed) {
      setErrors({ ...errors, oldPassword: 'Wrong password' });
    }
  }, [hasOldPasswordFailed]);

  // Handlers.
  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputHasError() && inputIsDirty()) {
      onSubmit(values);
    }
  };

  //Render.
  return (
    <Modal
      className="change-password-modal"
      dialogClassName="change-password-modal-dialog"
      show={true}
      centered
      keyboard={true}
      restoreFocus={false}
      aria-labelledby="contained-modal-title-hcenter"
    >
      <Modal.Header>
        Change Password
        <Icon
          className="body-txt-4"
          identifier={IconIdentifier.XLG}
          colorClass={ColorClass.Neutral300}
          onClick={onClose}
          cursor
        />
      </Modal.Header>
      <form onSubmit={onFormSubmit}>
        <Modal.Body>
          {/* Old Password */}
          <InputGroup>
            <Input.Label>Old Password</Input.Label>
            <Input.Password
              placeholder="Old Password"
              value={values.oldPassword}
              name={names.oldPassword}
              error={errors.oldPassword}
              isInvalid={!!errors.oldPassword}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
          {/* New Password */}
          <InputGroup>
            <Input.Label>New Password</Input.Label>
            <Input.Password
              placeholder="New Password"
              value={values.password}
              name={names.password}
              error={errors.password}
              isInvalid={!!errors.password}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
          {/* Confirm Password */}
          <InputGroup>
            <Input.Label>Confirm Password</Input.Label>
            <Input.Password
              placeholder="Confirm Password"
              value={values.confirmPassword}
              name={names.confirmPassword}
              error={errors.confirmPassword}
              isInvalid={!!errors.confirmPassword}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isLoading} type="submit">
            Save
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
