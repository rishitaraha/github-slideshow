import classNames from 'classnames';
import React, { useRef } from 'react';
import { Switch } from '../..';

export enum SwitchCardVariant {
  Primary = 'primary',
  Danger = 'danger',
}

export type SwitchCardProps = {
  title: React.ReactNode;
  checked: boolean;
  onClick: () => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLDivElement, Element>) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  dataTestId?: string;
  variant?: SwitchCardVariant;
};

export const SwitchCard: React.FC<SwitchCardProps> = ({
  title,
  checked,
  onChange,
  onClick,
  name,
  disabled,
  className,
  dataTestId,
  onBlur,
  variant = SwitchCardVariant.Primary,
}) => {
  const switchRef = useRef<HTMLInputElement>(null);

  const customClassName = classNames([
    'switch-card',
    className,
    variant,
    {
      active: checked,
    },
    {
      disabled: disabled,
    },
  ]);

  const handleCardOnClick = () => {
    if (!disabled) {
      onClick();
      switchRef.current?.click();
    }
  };

  return (
    <div
      className={customClassName}
      data-testid={dataTestId}
      tabIndex={0}
      // onFocus is void since it is required for onBlur.
      onFocus={() => {}}
      {...{ onBlur }}
      onClick={handleCardOnClick}
    >
      <span className="switch-card__title">{title}</span>
      <Switch
        ref={switchRef}
        checked={checked}
        onClick={(event) => {
          // https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
          event.stopPropagation();
        }}
        className="switch-card__toggle"
        {...{ onChange, name, disabled }}
      />
    </div>
  );
};
