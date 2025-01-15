import React from 'react';
import classNames from 'classnames';
import { InputGroupProps } from './types';

export const InputGroup: React.FC<InputGroupProps> = ({
  className,
  children,
  onClick,
}) => {
  const customClassName = classNames(['aus-input-group', className]);
  return (
    <div className={customClassName} onClick={onClick}>
      {children}
    </div>
  );
};
