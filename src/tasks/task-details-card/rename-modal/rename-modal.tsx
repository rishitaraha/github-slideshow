import React from 'react';
import { Modal } from 'react-bootstrap';
import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
} from '@aus-platform/design-system';
import { RenameModalProps } from './types';
import { useInputFields } from 'src/shared/hooks';

export const RenameModal: React.FC<RenameModalProps> = ({
  show,
  onClose,
  title,
  onSubmit,
  value,
}) => {
  //Hooks.
  const {
    values,
    names,
    onBlur,
    onChange,
    onFocus,
    inputIsDirty,
    validateAllFields,
  } = useInputFields({
    name: value,
  });

  //Handlers.
  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputIsDirty()) {
      onSubmit(values);
    } else {
      validateAllFields();
    }
  };

  return (
    <Modal
      className="rename-modal body-txt-3"
      contentClassName="w-40"
      aria-labelledby="contained-modal-title-hcenter"
      centered
      show={show}
      onHide={onClose}
    >
      <Modal.Header closeButton>{`Rename ${title}`}</Modal.Header>
      <form onSubmit={onFormSubmit}>
        <Modal.Body>
          <InputGroup>
            <Input.Label>{`${title} Name`}</Input.Label>
            <Input.Text
              placeholder={`New ${title} Name`}
              value={values.name}
              name={names.name}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <div className="rename-modal__buttons">
            <Button variant={ButtonVariant.Outline} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
