import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown as BootstrapDropdown } from 'react-bootstrap';
import { MeatBallsSize } from './enums';
import {
  MeatBallsMenuComponents,
  MeatBallsMenuItemProps,
  MeatBallsMenuProps,
} from './types';

export const MeatBallsMenu: React.FC<MeatBallsMenuProps> &
  MeatBallsMenuComponents = ({
  children,
  drop,
  className,
  showMenu = true,
  size = MeatBallsSize.Small,
  ...rest
}) => {
  // States.
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // useEffects.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  //Handlers.
  const handleToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Constants.
  const customClassName = classNames(['aus-meat-balls-menu', className]);
  const meatBallsButtonClassName = classNames([
    'aus-meat-balls-menu__button',
    'body-txt-3',
    size,
  ]);

  return (
    <BootstrapDropdown
      ref={dropdownRef}
      className={customClassName}
      drop={drop}
      show={isDropdownOpen}
      onToggle={handleToggle}
      {...rest}
    >
      <BootstrapDropdown.Toggle
        className={meatBallsButtonClassName}
        disabled={!showMenu}
      >
        <span className="aus-meat-balls-menu__dot"></span>
        <span className="aus-meat-balls-menu__dot"></span>
        <span className="aus-meat-balls-menu__dot"></span>
      </BootstrapDropdown.Toggle>
      <BootstrapDropdown.Menu className="body-txt-3">
        {children}
      </BootstrapDropdown.Menu>
    </BootstrapDropdown>
  );
};

MeatBallsMenu.Item = React.forwardRef<HTMLElement, MeatBallsMenuItemProps>(
  ({ children, isLoading, disabled, ...rest }, ref) => {
    return (
      <BootstrapDropdown.Item
        ref={ref}
        disabled={disabled || isLoading}
        {...rest}
      >
        {isLoading && <span className="spinner-border" />} {children}
      </BootstrapDropdown.Item>
    );
  },
);
