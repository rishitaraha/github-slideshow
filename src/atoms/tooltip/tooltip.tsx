import React from 'react';
import { OverlayTrigger, Tooltip as BootstrapTooltip } from 'react-bootstrap';
import classNames from 'classnames';
import { Placement } from '../../enums';

export type TooltipProps = {
  hoverText?: string | React.ReactNode;
  className?: string;
  placement?: Placement;
  activeState?: boolean;
  children?: React.ReactNode;
  show?: boolean;
};

export const Tooltip: React.FC<TooltipProps> = ({
  hoverText = '',
  className = '',
  placement = Placement.Top,
  activeState = false,
  children,
  show,
}) => {
  const tooltipClasses = classNames(
    'aus-tooltip-copied',
    activeState,
    className,
  );
  const contentClasses = classNames('aus-tooltip-text', className);

  return (
    <OverlayTrigger
      key={placement}
      placement={placement}
      overlay={
        <BootstrapTooltip className={activeState ? tooltipClasses : className}>
          {!activeState ? hoverText : ''}
        </BootstrapTooltip>
      }
      show={show}
    >
      <span className={contentClasses}>{children}</span>
    </OverlayTrigger>
  );
};
