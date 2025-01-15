import classnames from 'classnames';
import React from 'react';
import {
  Button as BootstrapButton,
  ButtonProps as BootstrapButtonProps,
} from 'react-bootstrap';
import { IconProps } from '..';
import { IconIdentifier } from '../../enums';
import { Modify } from '../../shared/type-utils';
import { Icon } from '../icon';
import { IconButtonVariant } from './enums';

export type IconButtonProps = Modify<
  BootstrapButtonProps,
  {
    iconSize?: number;
    variant?: IconButtonVariant;
    iconIdentifier: IconIdentifier;
    iconProps?: Omit<IconProps, 'identifier'>;
    isLoading?: boolean;
    isActive?: boolean;
    dataTestId?: string;
  }
>;

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      iconSize,
      variant,
      className,
      iconIdentifier,
      isLoading,
      disabled,
      iconProps,
      isActive,
      dataTestId,
      ...rest
    },
    ref,
  ) => {
    const customClassName = classnames([
      'aus-icon-btn',
      className,
      { 'is-active': isActive },
    ]);

    return (
      <BootstrapButton
        {...rest}
        className={customClassName}
        variant={variant}
        disabled={disabled || isLoading}
        ref={ref}
        data-testid={dataTestId}
      >
        {isLoading ? (
          <i className="spinner-border" role="status"></i>
        ) : (
          <Icon identifier={iconIdentifier} size={iconSize} {...iconProps} />
        )}
      </BootstrapButton>
    );
  },
);
