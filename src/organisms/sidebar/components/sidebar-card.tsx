import classNames from 'classnames';
import React from 'react';
import { Icon } from '../../../atoms';
import { IconIdentifier } from '../../../enums';
import { SideBarCardProps } from './types';

export const SideBarCard: React.FC<SideBarCardProps> = ({
  title,
  show,
  onClose,
  children,
  className,
}) => {
  const customClassnames = classNames([
    'sidebar-card',
    className,
    { active: show },
  ]);

  return (
    <>
      <div className={customClassnames}>
        <div className="sidebar-card__header">
          <div className="sidebar-card__header-title"> {title} </div>
          <Icon
            className="sidebar-card__header-icon"
            identifier={IconIdentifier.Cross}
            onClick={onClose}
          />
        </div>
        <div className="sidebar-card__body">{children}</div>
      </div>
    </>
  );
};
