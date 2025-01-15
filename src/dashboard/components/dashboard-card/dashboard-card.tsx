import { Spinner } from '@aus-platform/design-system';
import React from 'react';
import { DashboardCardComponents, DashboardCardProps } from './types';

export const DashboardCard: React.FC<DashboardCardProps> &
  DashboardCardComponents = ({ children }) => {
  return <div className="dashboard-card">{children}</div>;
};

DashboardCard.Header = ({ children }) => {
  return <div className="dashboard-card__header">{children}</div>;
};

DashboardCard.Title = ({ title, unit }) => {
  return (
    <div className="dashboard-card__header__title">
      {title} {unit && <span>({unit})</span>}
    </div>
  );
};

DashboardCard.Body = ({ children, isLoading }) => {
  return (
    <div className="dashboard-card__body">
      {isLoading ? <Spinner /> : children}
    </div>
  );
};
