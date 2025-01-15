import React from 'react';
import classNames from 'classnames';

export type PillSeriesProps = {
  variant?: PillSeriesVariant;
  children?: React.ReactNode;
};

export enum PillSeriesVariant {
  Error = 'error',
  Unique = 'unique',
  Active = 'active',
  Green = 'green',
  Success = 'success',
  Neutral = 'neutral',
  Teal = 'teal',
  Primary = 'primary',
  Name = 'name',
}

export const PillSeries: React.FC<PillSeriesProps> = ({
  children,
  variant,
}) => {
  const customClassName = classNames([
    'aus-pill-series',
    {
      'aus-pill-series--error': variant === PillSeriesVariant.Error,
    },
    {
      'aus-pill-series--unique': variant === PillSeriesVariant.Unique,
    },
    {
      'aus-pill-series--active': variant === PillSeriesVariant.Active,
    },
    {
      'aus-pill-series--green': variant === PillSeriesVariant.Green,
    },
    {
      'aus-pill-series--success': variant === PillSeriesVariant.Success,
    },
    {
      'aus-pill-series--neutral': variant === PillSeriesVariant.Neutral,
    },
    {
      'aus-pill-series--teal': variant === PillSeriesVariant.Teal,
    },
    {
      'aus-pill-series--primary': variant === PillSeriesVariant.Primary,
    },
    {
      'aus-pill-series--name': variant === PillSeriesVariant.Name,
    },
  ]);
  return <div className={customClassName}>{children}</div>;
};
