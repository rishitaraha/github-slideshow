import classNames from 'classnames';
import React, { useRef } from 'react';
import { Form } from 'react-bootstrap';
import { FormCheckInputProps } from 'react-bootstrap/esm/FormCheckInput';

type RadioToggleProps = FormCheckInputProps & {
  label?: string;
  disabled?: boolean;
};

export const RadioToggle: React.FC<RadioToggleProps> = ({
  checked,
  label,
  disabled = false,
  className,
  ...rest
}) => {
  // Refs.
  const checkInputRef = useRef<HTMLInputElement>(null);

  // States.
  const customClassName = classNames([
    'aus-radio-toggle',
    className,
    { checked },
    { disabled },
  ]);

  return (
    <div
      className={customClassName}
      onClick={() => checkInputRef.current?.click()}
    >
      <div className="aus-radio-toggle__radio-container">
        <Form.Check.Input
          {...rest}
          className="aus-radio-toggle__radio"
          type="radio"
          ref={checkInputRef}
          checked={checked}
          disabled={disabled}
          readOnly
        />
      </div>
      <Form.Check.Label className="aus-radio-toggle__label">
        {label}
      </Form.Check.Label>
    </div>
  );
};
