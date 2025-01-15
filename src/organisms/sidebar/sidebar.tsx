import React from 'react';
import { Icon } from '../../atoms';
import classNames from 'classnames';
import { SideBarItemProps, SideBarProps } from './types';
import { SideBarItemComponents } from './types';
import { SideBarCard } from './components/sidebar-card';
import { CustomSideCardProps } from './components/types';

export const SideBar: React.FC<SideBarProps> = ({ children, className }) => {
  const customClassName = classNames(['aus-sidebar', className]);
  return <div className={customClassName}> {children}</div>;
};

export const SideBarItem: React.FC<SideBarItemProps> &
  SideBarItemComponents = ({ children, className }) => {
  return (
    <div className={classNames(['aus-sidebar-item', className])}>
      {children}
    </div>
  );
};

SideBarItem.Icon = ({ className, isActive, isHidden, identifier, ...rest }) => {
  const customClassName = classNames([
    'aus-sidebar-item__icon',
    className,
    isActive && isHidden ? 'active' : '',
    !isHidden && isActive ? 'hidden' : '',
  ]);

  return (
    <div className={customClassName} {...rest}>
      <Icon identifier={identifier} />
    </div>
  );
};

SideBarItem.Card = React.forwardRef<HTMLElement, CustomSideCardProps>(
  ({ className, children, ...rest }, ref) => {
    const customClassName = classNames([
      'aus-sidebar-item__sidecard ',
      className,
    ]);

    return (
      <SideBarCard ref={ref} className={customClassName} {...rest}>
        {children}
      </SideBarCard>
    );
  },
);
