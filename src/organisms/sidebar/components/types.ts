import { Ref } from 'react';
import { Modify } from '../../../shared/type-utils';
import { SideCardProps } from '../../../molecules/sidecard/types';
import { SideCardType } from './enums';

export type SideBarCardProps = Pick<SideCardProps, 'placement'> & {
  title: string | React.ReactNode;
  onClose: () => void;
  show?: boolean;
  className?: string;
  children?: React.ReactNode | React.ReactNode[];
  ref?: Ref<HTMLElement> | undefined;
};

export type CustomSideCardProps = Modify<
  SideBarCardProps,
  { component?: React.ReactNode | React.ReactNode[] }
> & {
  sidecardType?: SideCardType;
};
