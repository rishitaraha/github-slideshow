import classNames from 'classnames';
import { isUndefined } from 'lodash';
import React from 'react';
import {
  ProgressBar as BootstrapProgressBar,
  ProgressBarProps as BootstrapProgressBarProps,
} from 'react-bootstrap';
import { Modify } from '../../shared/type-utils';
import { ProgressBarState } from '../../enums';

export enum ProgressBarVariant {
  Processing = 'processing',
  Completed = 'completed',
  Cancelled = 'error',
  Success = 'success',
  Error = 'danger',
  Info = 'info',
  Validating = 'validating',
  Warning = 'warning',
}

type ProgressBarProps = Modify<
  BootstrapProgressBarProps,
  {
    variant?: ProgressBarVariant;
    isLoading?: boolean;
  }
>;

export const ProgressBar: React.FC<ProgressBarProps> = ({
  className,
  variant,
  now,
  label,
  isLoading,
  animated,
  striped,
  ...rest
}) => {
  const customClassName = classNames(['aus-progress-bar', className]);

  let variantModified = variant;
  if (
    now === ProgressBarState.Uploaded &&
    variant != ProgressBarVariant.Error
  ) {
    variantModified = ProgressBarVariant.Completed;
  } else if (now === ProgressBarState.Error) {
    variantModified = ProgressBarVariant.Error;
  } else if (now === ProgressBarState.Cancelled) {
    variantModified = ProgressBarVariant.Cancelled;
  } else if (now === ProgressBarState.Processing) {
    variantModified = ProgressBarVariant.Validating;
    now = 100;
  } else if (now === ProgressBarState.Completed) {
    variantModified = ProgressBarVariant.Processing;
  }

  label = !isUndefined(label) ? label : `${now}%`;

  switch (variantModified) {
    case ProgressBarVariant.Error:
      label = 'Error';
      now = 100;
      striped = false;
      break;
    case undefined:
    case ProgressBarVariant.Processing:
      if (now === ProgressBarState.Completed) {
        striped = false;
        animated = false;
        now = 100;
        label = 'Completed';
        variantModified = ProgressBarVariant.Completed;
      } else {
        striped = true;
        animated = true;
      }
      break;
    case ProgressBarVariant.Validating:
      label = label ? label : '';
      striped = true;
      animated = true;
      break;
    case ProgressBarVariant.Completed:
      striped = false;
      animated = false;
      break;

    case ProgressBarVariant.Cancelled:
      now = 100;
      label = 'Cancelled';
      striped = false;
      animated = false;
      break;
  }

  if (isLoading) {
    variantModified = ProgressBarVariant.Validating;
    now = 100;
    label = label ? label : '';
    striped = true;
    animated = true;
  }

  variant = variantModified;
  return (
    <BootstrapProgressBar
      className={customClassName}
      variant={variant}
      now={now}
      label={label}
      max={100}
      {...{ striped, animated }}
      {...rest}
    />
  );
};
