import React from 'react';
import {
  Dropdown as BootstrapDropdown,
  DropdownProps as BootstrapDropdownProps,
} from 'react-bootstrap';
import { DropdownItemProps as BootstrapDropdownItemProps } from 'react-bootstrap/esm/DropdownItem';
import { ForwardRef, Modify } from '../../shared/type-utils';
import { IconIdentifier } from '../../enums';
import { ButtonProps, ButtonVariant, Button } from '../../atoms';

export enum DropDownButtonDirection {
  Up = 'up',
  Down = 'down',
  Start = 'start',
  End = 'end',
}

type DropDownButtonComponents = {
  Item: ForwardRef<HTMLElement, BootstrapDropdownItemProps>;
};

type DropDownButtonProps = Modify<
  BootstrapDropdownProps,
  {
    drop?: DropDownButtonDirection;
    separator?: boolean;
    rightIconIdentifier?: IconIdentifier;
    leftIconIdentifier?: IconIdentifier;
  }
> & {
  btnProps?: ButtonProps;
  btnText?: string;
  disabled?: boolean;
};

export const DropDownButton: React.FC<DropDownButtonProps> &
  DropDownButtonComponents = ({
  children,
  drop = DropDownButtonDirection.End,
  btnProps,
  btnText,
  disabled,
  separator,
  leftIconIdentifier,
  rightIconIdentifier,
  ...rest
}) => {
  const dropIcon: IconIdentifier = rightIconIdentifier
    ? rightIconIdentifier
    : IconIdentifier.CaretDownFill;
  return (
    <BootstrapDropdown className={'aus-dropdown-button'} drop={drop} {...rest}>
      <BootstrapDropdown.Toggle
        as="div"
        className={'aus-dropdown-button__button '}
      >
        <Button
          variant={ButtonVariant.Outline}
          {...btnProps}
          leftIconIdentifier={leftIconIdentifier}
          rightIconIdentifier={dropIcon}
          disabled={disabled}
          separator={separator}
        >
          <div className="aus-dropdown-button__text">{btnText}</div>
        </Button>
      </BootstrapDropdown.Toggle>
      <BootstrapDropdown.Menu className="aus-dropdown-card">
        {children}
      </BootstrapDropdown.Menu>
    </BootstrapDropdown>
  );
};

DropDownButton.Item = React.forwardRef<HTMLElement, BootstrapDropdownItemProps>(
  ({ children, ...rest }, ref) => {
    return (
      <BootstrapDropdown.Item ref={ref} {...rest}>
        {children}
      </BootstrapDropdown.Item>
    );
  },
);
