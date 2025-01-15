import classNames from 'classnames';
import React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import { Modify } from '../../shared/type-utils';
import { IconIdentifier } from '../../enums';
import { Icon } from '../icon';

export type PillButtonProps = Modify<
  ButtonProps,
  {
    variant: PillButtonVariant;
    iconIdentifier?: IconIdentifier;
    iconPlacement?: IconPlacement;
  }
>;

export enum IconPlacement {
  Left = 'left',
  Right = 'right',
}

export enum PillButtonVariant {
  Primary = 'primary',
  Error = 'error',
  Warning = 'warning',
  Success = 'success',
}

export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ children, iconPlacement, iconIdentifier, variant, ...rest }, ref) => {
    const customClassName = classNames([
      'aus-pill-button shadow-none',
      {
        'aus-pill-button--primary shadow-none':
          variant === PillButtonVariant.Primary,
      },
      {
        'aus-pill-button--warning shadow-none':
          variant === PillButtonVariant.Warning,
      },
      {
        'aus-pill-button--success shadow-none':
          variant === PillButtonVariant.Success,
      },
      {
        'aus-pill-button--error shadow-none':
          variant === PillButtonVariant.Error,
      },
    ]);
    return (
      <Button
        bsPrefix="aus-pill-button"
        className={customClassName}
        ref={ref}
        {...rest}
      >
        {iconPlacement === IconPlacement.Left && iconIdentifier && (
          <Icon identifier={iconIdentifier} size={16} />
        )}
        {children}
        {iconPlacement === IconPlacement.Right && iconIdentifier && (
          <Icon identifier={iconIdentifier} size={16} />
        )}
      </Button>
    );
  },
);
