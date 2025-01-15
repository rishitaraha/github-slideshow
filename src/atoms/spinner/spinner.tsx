import classNames from 'classnames';
import React from 'react';
import {
  Spinner as BootstrapSpinner,
  SpinnerProps as BootstrapSpinnerProps,
} from 'react-bootstrap';

export enum SpinnerVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Danger = 'danger',
  Dark = 'dark',
  Light = 'light',
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
}

export const Spinner: React.FC<Omit<BootstrapSpinnerProps, 'animation'>> = ({
  variant = SpinnerVariant.Primary,
  ...rest
}) => {
  const customClassName = classNames(['aus-spinner', variant]);

  return (
    <div className="aus-spinner-container">
      <BootstrapSpinner
        className={customClassName}
        animation="border"
        {...rest}
      />
    </div>
  );
};
