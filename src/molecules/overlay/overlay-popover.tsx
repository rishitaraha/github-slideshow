import React, { useState } from 'react';
import {
  Overlay as BootstrapOverlay,
  OverlayProps as BootstrapOverlayProps,
  Popover as BootstrapPopover,
  PopoverProps as BootstrapPopoverProps,
} from 'react-bootstrap';
import { Modify } from '../../shared/type-utils';
import { Placement } from '../../enums/placement';
import { generatePopoverId } from './helpers';

export type OverlayPopoverProps = Modify<
  Omit<BootstrapOverlayProps, 'children'>,
  {
    placement?: Placement;
  }
> & {
  popoverProps?: BootstrapPopoverProps;
  header?: React.ReactNode | string;
  body?: React.ReactNode | string;
};

export const OverlayPopover: React.FC<OverlayPopoverProps> = ({
  target,
  show,
  popoverProps,
  header,
  body,
  ...rest
}) => {
  const [id] = useState(popoverProps?.id || generatePopoverId());
  return (
    <BootstrapOverlay target={target} show={show} rootClose {...rest}>
      <BootstrapPopover id={id} {...popoverProps}>
        {header && (
          <BootstrapPopover.Header as="h3">{header}</BootstrapPopover.Header>
        )}
        <BootstrapPopover.Body>{body}</BootstrapPopover.Body>
      </BootstrapPopover>
    </BootstrapOverlay>
  );
};
