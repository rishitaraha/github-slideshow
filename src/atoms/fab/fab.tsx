import classNames from 'classnames';
import React from 'react';
import { Button } from 'react-bootstrap';
import { Icon } from '../icon';
import { FabProps } from './types';

export const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  (
    {
      variant,
      className,
      active,
      leftIconIdentifier,
      rightIconIdentifier,
      isLoading,
      disabled,
      dataTestId,
      size = 16,
      children,
      ...rest
    },
    ref,
  ) => {
    const ausFabClassName = classNames(['aus-fab', className], {
      'aus-fab--active': active,
    });

    return (
      <Button
        {...rest}
        className={ausFabClassName}
        variant={variant}
        disabled={disabled || isLoading}
        ref={ref}
        data-testid={dataTestId}
      >
        {leftIconIdentifier && (
          <Icon identifier={leftIconIdentifier} size={size} />
        )}
        {children}
        {rightIconIdentifier && (
          <Icon identifier={rightIconIdentifier} size={size} />
        )}
      </Button>
    );
  },
);
