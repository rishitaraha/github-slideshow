import classNames from 'classnames';
import React, { useRef } from 'react';
import { ForwardRef } from '../../shared/type-utils';

/*
Toggle Switch Component
Note: id, checked and onChange are required for ToggleButton component to function.
The props name, small, disabled and optionLabels are optional.
Usage: <ToggleButton id="id" checked={value} onChange={checked => setValue(checked)}} />
*/

export type SwitchProps = {
  checked: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: (event: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
  name?: string;
  small?: boolean;
  disabled?: boolean;
  className?: string;
};

export const Switch: ForwardRef<HTMLInputElement, SwitchProps> =
  React.forwardRef(
    ({ name, checked, onChange, onClick, small, disabled, className }, ref) => {
      // Ref.
      const inputRef = useRef<HTMLInputElement>(null);
      const customClassName = classNames([
        'switch' + (small ? ' small-switch' : ''),
        className ? className : '',
      ]);
      return (
        <div
          ref={ref}
          className={customClassName}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          <input
            type="checkbox"
            className="switch-checkbox"
            ref={inputRef}
            {...{ checked, disabled, name, onChange, onClick }}
          />

          <label className="switch-label">
            <span
              className={
                disabled ? 'switch-inner switch-disabled' : 'switch-inner'
              }
            />
            <span
              className={
                disabled ? 'switch-switch switch-disabled' : 'switch-switch'
              }
            />
          </label>
        </div>
      );
    },
  );
