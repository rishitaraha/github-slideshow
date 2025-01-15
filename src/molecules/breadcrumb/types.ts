import { ReactNode } from 'react';

export type BreadcrumbProps = {
  children: Iterable<ReactNode>;
  showBackButton?: boolean;
  className?: string;
  onClickBackButton?: VoidFunction;
};

export type BreadcrumbItemProps = {
  children: ReactNode;
  className?: string;
  onClick?: VoidFunction;
};
