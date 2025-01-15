import classNames from 'classnames';
import React, { useRef } from 'react';

/*
Toggle Switch Component
Note: id, checked and onChange are required for ToggleButton component to function.
The props name, small, disabled and optionLabels are optional.
Usage: <ToggleButton id="id" checked={value} onChange={checked => setValue(checked)}} />
*/

export type ToggleButtonProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onClick: () => void;
  name?: string;
  small?: boolean;
  disabled?: boolean;
  className?: string;
};

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  name,
  checked,
  onChange,
  onClick,
  small,
  disabled,
  className,
}) => {
  // Ref.
  const inputRef = useRef<HTMLInputElement>(null);
  const customClassName = classNames([
    'toggle-button' + (small ? ' small-switch' : ''),
    {
      [className ? className : '']: !!className,
    },
  ]);
  return (
    <div
      className={customClassName}
      onClick={() => {
        inputRef.current?.click();
      }}
    >
      <input
        type="checkbox"
        name={name}
        className="toggle-button-checkbox"
        checked={checked}
        onChange={(e) => {
          if (onChange) {
            onChange(e.currentTarget.checked);
          }
        }}
        onClick={onClick}
        ref={inputRef}
        disabled={disabled}
      />

      <label className="toggle-button-label">
        <span
          className={
            disabled
              ? 'toggle-button-inner toggle-button-disabled'
              : 'toggle-button-inner'
          }
        />
        <span
          className={
            disabled
              ? 'toggle-button-switch toggle-button-disabled'
              : 'toggle-button-switch'
          }
        />
      </label>
    </div>
  );
};
