import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
} from '@aus-platform/design-system';
import React from 'react';
import { Modal } from 'react-bootstrap';
import { AddTextboxModalProps } from './types';
import { useInputFields } from 'shared/hooks';

export const AddTextboxModal: React.FC<AddTextboxModalProps> = ({
  onHide,
  onAddTextBoxClick,
}) => {
  // Hooks.
  const {
    names,
    values,
    errors,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    validateAllFields,
  } = useInputFields({ text: '' });

  // Handlers.
  const onSubmit = (event) => {
    event.preventDefault();
    if (!inputHasError() && inputIsDirty()) {
      onAddTextBoxClick(values.text);
    } else {
      validateAllFields();
    }
  };

  return (
    <Modal
      show={true}
      onHide={onHide}
      size="sm"
      backdrop="static"
      dialogClassName="add-textbox-modal workspace-modal"
      centered
    >
      <Modal.Header closeButton>Create Textbox</Modal.Header>
      <form onSubmit={onSubmit}>
        <Modal.Body>
          <InputGroup>
            <Input.Label>Enter Text</Input.Label>
            <Input.Text
              className="add-textbox-modal__text"
              name={names.text}
              error={errors.text}
              value={values.text}
              placeholder="Enter text to put it in textbox"
              {...{ onChange, onBlur, onFocus }}
            ></Input.Text>
          </InputGroup>
        </Modal.Body>
        <Modal.Footer className="add-textbox-modal__footer">
          <Button variant={ButtonVariant.Secondary} onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit">Add Textbox</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
