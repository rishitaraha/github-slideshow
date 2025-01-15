import React, { ForwardedRef, ReactNode } from 'react';
import { IconProps } from '../../atoms';
import { ForwardRef, Modify } from '../../shared/type-utils';
import { IconIdentifier } from '../../enums';
import { SideCardType } from './components/enums';
import { CustomSideCardProps, SideBarCardProps } from './components/types';

export type SideBarProps = {
  className?: string;
  children?: React.ReactNode;
};

export type IsActive = {
  isActive: boolean;
};

export type IsHidden = {
  isHidden: boolean;
};

export type SideBarItemComponents = {
  Icon: React.FC<IconProps & IsActive & IsHidden>;
  Card: ForwardRef<HTMLElement, CustomSideCardProps>;
};

type SideBarIcon = { identifier: IconIdentifier; toolTipText: string };

export type SideBarOption = {
  icon: SideBarIcon;
  cardProps: Modify<SideBarCardProps, { onClose?: () => void }> & {
    component?: ReactNode;
  };
  isOutsideSidecard?: boolean;
  sidecardType?: SideCardType;
} & Partial<IsHidden>;

export type SideBarItemProps = {
  className?: string;
  ref?: ForwardedRef<HTMLElement>;
  children?: React.ReactNode;
};
