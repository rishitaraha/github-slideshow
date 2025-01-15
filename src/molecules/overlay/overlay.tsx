import React from 'react';
import {
  Overlay as BootstrapOverlay,
  OverlayProps as BootstrapOverlayProps,
} from 'react-bootstrap';
import { Modify } from '../../shared/type-utils';
import { Placement } from '../../enums/placement';

export type OverlayProps = Modify<
  BootstrapOverlayProps,
  {
    placement?: Placement;
  }
>;

export const Overlay: React.FC<OverlayProps> = ({
  children,
  target,
  show,
  ...rest
}) => {
  return (
    <BootstrapOverlay target={target} show={show} rootClose {...rest}>
      {children}
    </BootstrapOverlay>
  );
};
