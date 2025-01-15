import React from 'react';
import { OffcanvasProps } from 'react-bootstrap';
import { SideCardLocation } from '../../enums';
import { Modify } from '../../shared/type-utils';

export type SideCardProps = Modify<
  OffcanvasProps,
  {
    placement?: SideCardLocation;
  }
> & {
  // TODO: Remove React.ReactNode type from title after fixing sidenav in Rainbow.
  title: string | React.ReactNode;
  onClose: VoidFunction;
  showCloseButton: boolean;
  footer?: JSX.Element;
  footerClassName?: string;
  formError?: string | string[];
  showBackButton?: boolean;
  onBackButtonClick?: VoidFunction;
  info?: string;
  headerChildren?: React.ReactNode;
  onClickToggleSidecardButton?: VoidFunction;
  containerClassName?: string;
};
