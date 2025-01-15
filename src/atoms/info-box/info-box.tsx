import classNames from 'classnames';
import React from 'react';
import { PillSeriesVariant } from '../pill-series';

export type BoxProps = {
  header: string;
  text?: string;
  link?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  taskStages?: { variant: PillSeriesVariant; text: string }[];
};
export const InfoBox: React.FC<BoxProps> = ({
  header,
  text,
  link,
  taskStages,
  children,
  onClick,
}) => {
  const customClassName = classNames([
    'aus-box',
    { 'aus-box-task-stages': taskStages },
    { 'aus-box__text-link': link },
  ]);
  return (
    <div className={customClassName}>
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
