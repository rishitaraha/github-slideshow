import React from 'react';
import { BoxProps } from './types';

export const Box: React.FC<BoxProps> = ({
  header,
  text,
  link,
  children,
  onClick,
}) => {
  return (
    <div className={'aus-box'}>
      <h2 className="aus-box-header">{header}</h2>
      <p
        className={link ? 'aus-box__text-link' : 'aus-box__text'}
        onClick={onClick}
      >
        {text}
      </p>
      {children}
    </div>
  );
};
