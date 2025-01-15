import React from 'react';
import { CheckboxAlignment } from '../../atoms';
import { FormCheckInputProps } from 'react-bootstrap/esm/FormCheckInput';
import { default as classnames } from 'classnames';
import { Form } from 'react-bootstrap';

export type CheckBoxProps = FormCheckInputProps & {
  isLoading?: boolean;
  alignCheckbox?: CheckboxAlignment;
  showCard?: boolean;
  children?: React.ReactNode;
};

export const CheckBox = React.forwardRef<HTMLInputElement, CheckBoxProps>(
  (
    {
      children,
      checked,
      title,
      className,
      disabled,
      isLoading,
      onClick,
      alignCheckbox = CheckboxAlignment.Left,
      showCard = false,
      ...rest
    },
    ref,
  ) => {
    const customClassName = classnames([
      'checkbox',
      className,
      { disabled: disabled },
    ]);

    const checkboxCardContainerClass = classnames([
      'checkbox__txt-box',
      `align-${alignCheckbox}`,
      { card: !!showCard, active: checked && showCard, disabled: disabled },
    ]);

    return (
      <div
        className={customClassName}
        ref={ref}
        onClick={!Boolean(disabled) ? onClick : () => {}}
      >
        <div className={checkboxCardContainerClass}>
          <div className="checkbox__txt-box__inner">
            {/* Empty onChange function to suppress controlled props input warning in console */}
            <Form.Check.Input
              type={'checkbox'}
              checked={checked}
              title={title}
              onChange={() => {}}
              {...rest}
            />
            <span>{title}</span>
          </div>
          {showCard &&
            (isLoading ? <span className="spinner-border" /> : children)}
        </div>
      </div>
    );
  },
);
