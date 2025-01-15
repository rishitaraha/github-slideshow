import classNames, { default as classnames } from 'classnames';
import { isArray, isEmpty } from 'lodash';
import React, { useRef } from 'react';
import { Form } from 'react-bootstrap';
import { Button, Icon, IconButton, InputSearchVariant, Tooltip } from '..';
import { ColorClass, IconIdentifier, Placement } from '../../enums';
import { Select } from '../../molecules/select';

import { isForwardRefHTMLElement } from '../../shared/type-utils';
import {
  CheckboxProps,
  InputComponents,
  InputProps,
  InputSearchProps,
} from './types';

export const Input: React.FC<any> & InputComponents = ({
  children,
  className,
}) => {
  return <div className={classNames(['aus-input', className])}>{children}</div>;
};

Input.Text = React.forwardRef(
  ({ isInvalid, error, className, dataTestId, ...rest }, ref) => {
    const customClassName = classnames([
      'aus-input__txt',
      isInvalid && 'aus-input--error',
      className,
    ]);
    return (
      <Input>
        <input
          className={customClassName}
          ref={ref}
          type="text"
          data-testid={dataTestId}
          {...rest}
        />
        {error && <Input.Error error={error} />}
      </Input>
    );
  },
);
Input.TextArea = React.forwardRef(
  ({ isInvalid, error, className, dataTestId, rows = 5, ...rest }, ref) => {
    const customClassName = classnames([
      'aus-input__textarea',
      isInvalid && 'aus-input--error',
      className,
    ]);
    return (
      <Input>
        <Form.Control
          className={customClassName}
          as="textarea"
          ref={ref}
          rows={rows}
          data-testid={dataTestId}
          {...rest}
        />
        {error && <Input.Error error={error} />}
      </Input>
    );
  },
);

Input.Number = React.forwardRef(
  ({ isInvalid, error, className, dataTestId, ...rest }, ref) => {
    const customClassName = classnames([
      'aus-input__number',
      isInvalid && 'aus-input--error',
      className,
    ]);
    return (
      <Input>
        <input
          className={customClassName}
          ref={ref}
          type="number"
          data-testid={dataTestId}
          {...rest}
        />
        {error && <Input.Error error={error} />}
      </Input>
    );
  },
);

Input.Password = React.forwardRef<HTMLInputElement, InputProps>(
  ({ isInvalid, error, className, dataTestId, ...rest }, ref) => {
    const customClassName = classnames([
      'aus-input__password',
      isInvalid && 'aus-input--error',
      className,
    ]);
    return (
      <Input>
        <input
          className={customClassName}
          ref={ref}
          type="password"
          data-testid={dataTestId}
          {...rest}
        />
        {error && <Input.Error error={error} />}
      </Input>
    );
  },
);

Input.Select = ({ error, isDisabled, ...rest }) => {
  const customClassName = classnames([isDisabled && 'disabled']);
  return (
    <Input className={customClassName}>
      <Select {...rest} isError={!isEmpty(error)} isDisabled={isDisabled} />
      {error && <Input.Error error={error} />}
    </Input>
  );
};

Input.CheckBox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, className, indeterminate, ...rest }, ref) => {
    const customClassName = classnames([
      'form-check-input aus-input__checkbox ',
      checked && 'active',
      indeterminate && 'indeterminate',
      className,
    ]);

    return (
      <Form.Check.Input
        className={customClassName}
        type={'checkbox'}
        checked={checked}
        ref={ref}
        onChange={() => {}}
        {...rest}
      />
    );
  },
);

Input.File = React.forwardRef<HTMLInputElement, InputProps>(
  ({ isInvalid, error, disabled, ...rest }, ref) => {
    const customClassName = classnames([
      'aus-input__file',
      isInvalid && 'aus-input--error',
      disabled && 'disabled',
    ]);
    return (
      <Input disabled={disabled}>
        <div className="aus-input__file-container">
          <input
            className={customClassName}
            ref={ref}
            type="file"
            disabled={disabled}
            {...rest}
          />
          <Button className="aus-input__file-btn">Browse</Button>
          {error && <Input.Error error={error} />}
        </div>
      </Input>
    );
  },
);

Input.Error = ({ error }) => {
  if (isArray(error)) {
    return (
      <ul className="aus-input__error">
        {error.map((err, index) => (
          <li key={index}> {err} </li>
        ))}
      </ul>
    );
  }
  return <div className="aus-input__error">{error}</div>;
};

Input.Label = React.forwardRef(
  (
    {
      className,
      tooltipClassname,
      isRequired,
      children,
      info,
      infoPlacement = Placement.Right,
      dataTestId,
      ...rest
    },
    ref,
  ) => {
    const customClassName = classnames([
      'aus-input-label',
      isRequired && 'aus-input-label--required',
      className,
    ]);
    return (
      <div className="aus-input-label-container">
        <label
          className={customClassName}
          data-testid={dataTestId}
          {...rest}
          ref={ref}
        >
          {children}
        </label>
        {info && (
          <Tooltip
            hoverText={info}
            placement={infoPlacement}
            className={tooltipClassname}
          >
            <Icon
              identifier={IconIdentifier.InfoCircle}
              size={16}
              colorClass={ColorClass.Primary500}
            />
          </Tooltip>
        )}
      </div>
    );
  },
);

Input.Search = React.forwardRef<HTMLInputElement, InputSearchProps>(
  (
    {
      isInvalid,
      error,
      className,
      placeholder,
      variant = InputSearchVariant.Button,
      onKeyDown,
      onSubmit,
      iconSize = 15,
      dataTestId,
      ...rest
    },
    ref,
  ) => {
    // Refs.
    const searchRef = useRef<HTMLInputElement>(null);

    // Constants.
    const customClassName = classnames([
      'aus-input__search',
      isInvalid && 'aus-input--error',
      className,
      variant,
    ]);

    // Handlers.
    const onClickSearchButtonDefault = () => {
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });

      if (isForwardRefHTMLElement<HTMLInputElement>(ref, HTMLInputElement)) {
        ref.current.dispatchEvent(keyboardEvent);
      } else if (searchRef.current) {
        searchRef.current.dispatchEvent(keyboardEvent);
      }
    };

    const onKeyDownDefault = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        onSubmit?.(event);
      }
    };

    return (
      <Input className={'aus-input__search-box'} onSubmit={onSubmit}>
        <input
          id="search-box-input-field"
          className={customClassName}
          ref={ref ?? searchRef}
          type="text"
          onKeyDown={onKeyDown ?? onKeyDownDefault}
          placeholder={placeholder ? placeholder : 'Search'}
          data-testid={dataTestId}
          {...rest}
        />
        {error && <Input.Error error={error} />}
        {variant == InputSearchVariant.Button && (
          <IconButton
            iconSize={iconSize}
            onClick={() => onClickSearchButtonDefault()}
            iconIdentifier={IconIdentifier.Search}
          />
        )}
      </Input>
    );
  },
);

Input.Date = React.forwardRef(
  ({ isInvalid, error, className, dataTestId, ...rest }, ref) => {
    const customClassName = classnames([
      'aus-input__date',
      isInvalid && 'aus-input--error',
      className,
    ]);
    return (
      <Input>
        <input
          className={customClassName}
          ref={ref}
          type="date"
          data-testid={dataTestId}
          {...rest}
        />
        {error && <Input.Error error={error} />}
      </Input>
    );
  },
);

Input.Color = React.forwardRef(
  ({ isInvalid, className, value = '#ffffff', dataTestId, ...rest }, ref) => {
    const customClassName = classnames([
      'aus-input__color',
      isInvalid && 'aus-input--error',
      className,
    ]);
    return (
      <Input className="aus-input__color-box">
        <input
          className={customClassName}
          ref={ref}
          type="color"
          value={value}
          data-testid={dataTestId}
          {...rest}
        />
        <span className="aus-input__color-text">{value}</span>
      </Input>
    );
  },
);

export default Input;
