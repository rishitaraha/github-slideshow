import classnames from 'classnames';
import React from 'react';
import {
  Button as BootstrapButton,
  ButtonProps as BootstrapButtonProps,
} from 'react-bootstrap';
import { IconIdentifier } from '../../enums';
import { Modify } from '../../shared/type-utils';
import { Icon } from '../icon';
import { ButtonVariant } from './enums';

export type ButtonProps = Modify<
  BootstrapButtonProps,
  {
    variant?: ButtonVariant;
    leftIconIdentifier?: IconIdentifier;
    rightIconIdentifier?: IconIdentifier;
    isLoading?: boolean;
    separator?: boolean;
    iconSize?: number;
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    active?: boolean;
  }
>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant,
      className,
      leftIconIdentifier,
      rightIconIdentifier,
      separator,
      isLoading,
      disabled,
      iconSize = 16,
      active = false,
      ...rest
    },
    ref,
  ) => {
    const customClassName = classnames([
      'aus-btn',
      className,
      {
        active,
      },
    ]);

    return (
      <BootstrapButton
        {...rest}
        className={customClassName}
        variant={variant}
        prefix="aus"
        disabled={disabled || isLoading}
        ref={ref}
      >
        {isLoading ? (
          <i className="spinner-border" role="status"></i>
        ) : (
          leftIconIdentifier && (
            <Icon identifier={leftIconIdentifier} size={iconSize} />
          )
        )}
        {leftIconIdentifier && separator && <div className="separator"></div>}
        {children}
        {rightIconIdentifier && separator && <div className="separator"></div>}
        {!isLoading && rightIconIdentifier && (
          <Icon identifier={rightIconIdentifier} size={iconSize} />
        )}
      </BootstrapButton>
    );
  },
);
