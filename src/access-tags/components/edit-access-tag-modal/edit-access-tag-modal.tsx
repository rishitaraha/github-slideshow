import {
  Button,
  ButtonVariant,
  ColorCodes,
  FormMessage,
  Input,
  InputGroup,
  Pill,
  PillShape,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import { isArray, isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { AccessTagObj, ApiErrorResponse } from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';
import { colorList } from '../../shared';
import { accessTagInputValidator } from '../../shared/validator';

type EditAccessTagModalProps = ModalProps & {
  onClose: () => void;
  onUpdate: (tagName: string, color: string) => void;
  isLoading: boolean;
  accessTag: AccessTagObj | null;
  apiError?: ApiErrorResponse | null;
};

export const EditAccessTagModal: React.FC<EditAccessTagModalProps> = ({
  onClose,
  onUpdate,
  isLoading,
  apiError,
  accessTag,
}) => {
  // States.
  const [formError, setFormError] = useState<string>('');

  // Hooks.
  const {
    values,
    names,
    errors,
    dirty,
    setValues,
    setErrors,
    setDirty,
    onBlur,
    onChange,
    onFocus,
    inputHasError,
    inputIsDirty,
  } = useInputFields(
    {
      color: accessTag?.color ?? ColorCodes.DefaultAccessTagColor.toString(),
      tagName: accessTag?.name ?? '',
    },
    accessTagInputValidator,
    true,
    true,
  );

  // UseEffects.
  useEffect(() => {
    if (apiError?.meta?.details?.form && !isArray(apiError.meta.details.form)) {
      setFormError(apiError.meta.details.form.message);
    }
  }, [apiError]);

  // Handlers.
  const onClickColor = (color: string) => {
    setValues({ ...values, color });
    setErrors({ ...errors, [names.color]: '' });
    setDirty({ ...dirty, [names.color]: true });
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!inputHasError() && inputIsDirty()) {
      onUpdate(values.tagName, values.color);
    } else {
      setFormError(errors.color);
    }
  };

  return (
    <Modal
      show={true}
      onHide={onClose}
      dialogClassName="access-tag-dialog"
      backdrop="static"
      centered
    >
      <Modal.Header closeButton>Edit Access Tag</Modal.Header>
      <Modal.Body>
        <InputGroup>
          <Input.Label>Access Tag Name</Input.Label>
          <Input.Text
            placeholder="Enter access tag name"
            name={names.tagName}
            error={errors.tagName}
            value={values.tagName}
            maxLength={33}
            isInvalid={!!(errors.tagName && dirty.tagName)}
            {...{ onBlur, onChange, onFocus }}
          />
        </InputGroup>
        <div className="access-tag-preview">
          <Pill
            color={
              values.color === ColorCodes.White.toString()
                ? ColorCodes.Black.toString()
                : values.color
            }
            shape={PillShape.Oval}
          >
            {values.tagName ? values.tagName : 'SampleAccessTag'}
          </Pill>
        </div>
        <div className="access-tag-color__box">
          <div className="access-tag-color__header">Choose Color</div>
          <div className="access-tag-color__list">
            {colorList.map((colorItem, index) => (
              <div
                key={index + ' color'}
                className={classNames([
                  'access-tag-color__list-item',
                  colorItem.colorClass,
                  {
                    active: values.color === colorItem.colorValue,
                  },
                ])}
                onClick={() => onClickColor(colorItem.colorValue)}
              ></div>
            ))}
          </div>
        </div>
      </Modal.Body>
      {!isEmpty(formError) && <FormMessage message={formError} />}
      <Modal.Footer>
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={onSubmit}
          isLoading={isLoading}
          disabled={inputHasError()}
        >
          Update
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
