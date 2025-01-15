import classNames from 'classnames';
import React, { MouseEventHandler } from 'react';
import { ColorClass, IconIdentifier } from '../../enums';
import IcoMoon from 'react-icomoon';
import iconSet from '../../assets/icons/selection.json';

export type IconProps = {
  identifier: IconIdentifier;
  className?: string;
  id?: string;
  colorClass?: ColorClass;
  fillColorClass?: ColorClass;
  onClick?: (e: any) => void;
  cursor?: boolean;
  size?: number;
  isDisabled?: boolean;
};

export const Icon: React.FC<IconProps> = ({
  identifier,
  className,
  colorClass: color,
  cursor,
  onClick,
  size = 24,
  isDisabled = false,
}) => {
  const customClassName = classNames(
    'aus-icon',
    [className ? className : '', identifier],
    {
      'cursor-pointer': cursor,
    },
    color ? `${color}-txt` : '',
    isDisabled ? 'is-disabled' : '',
  );

  const onClickHandler: MouseEventHandler<SVGElement> = (
    event: React.MouseEvent<SVGElement, MouseEvent>,
  ) => {
    if (onClick && !isDisabled) {
      onClick(event);
    }
  };

  return (
    <IcoMoon
      className={customClassName}
      iconSet={iconSet}
      icon={identifier}
      size={size}
      color={color}
      onClick={onClickHandler}
    />
  );
};
