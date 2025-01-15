import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
import { IconIdentifier } from '../../enums';
import { Icon } from '../icon';
import { Spinner, SpinnerVariant } from '../spinner';
import { Variant as SpinnerVariantType } from 'react-bootstrap/types';

export type PillProps = {
  className?: string;
  leftIconIdentifier?: IconIdentifier;
  onClick?: () => void;
  rightIconIdentifier?: IconIdentifier;
  shape?: PillShape;
  variant?: PillVariant;
  color?: string;
  children?: React.ReactNode;
  showSpinner?: boolean;
  spinnerVariant?: SpinnerVariantType;
  iconSize?: number;
};

export enum PillVariant {
  Active = 'active',
  Default = 'default',
  Error = 'error',
  Info = 'info',
  Success = 'success',
  Unique = 'unique',
  Warning = 'warning',
}

export enum PillShape {
  Rectangle = 'rectangle',
  Oval = 'oval',
}

export const Pill: React.FC<PillProps> = ({
  children,
  leftIconIdentifier,
  rightIconIdentifier,
  className,
  onClick,
  shape = PillShape.Rectangle,
  variant = PillVariant.Default,
  color,
  showSpinner = false,
  spinnerVariant = SpinnerVariant.Primary,
  iconSize = 24,
}) => {
  // useRef.
  const pillRef = useRef<HTMLDivElement>(null);
  const pillLabelRef = useRef<HTMLDivElement>(null);

  // useEffect - color.
  useEffect(() => {
    if (pillRef.current && pillLabelRef.current && color) {
      let bgColor = '';
      // Check if color's hexcode has alpha value or not (last two hexadecimal digits).
      if (color.length > 7) {
        // Replace alpha value with 10% hexa value.
        bgColor = color.slice(0, color.length - 2) + '1A';
      } else {
        // If no hexacode for alpha is there. Add 10% alpha hexacode to the background color.
        bgColor = color + '1A';
      }

      pillRef.current.style.backgroundColor = bgColor;
      pillLabelRef.current.style.color = color;
    }
  }, [color]);

  // Variables.
  const customClassName = classNames(['aus-pill', variant, shape, className]);
  const customIconClassName = classNames(['aus-pill__icon', variant, shape]);

  return (
    <div className={customClassName} onClick={onClick} ref={pillRef}>
      {leftIconIdentifier && (
        <Icon
          identifier={leftIconIdentifier}
          size={iconSize}
          className={customIconClassName}
        />
      )}
      {children && (
        <span className="aus-pill__label" ref={pillLabelRef}>
          {children} {showSpinner && <Spinner variant={spinnerVariant} />}
        </span>
      )}
      {rightIconIdentifier && (
        <Icon
          identifier={rightIconIdentifier}
          size={iconSize}
          className={customIconClassName}
        />
      )}
    </div>
  );
};
