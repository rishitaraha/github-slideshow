import React from 'react';

export type DashboardCardProps = {
  children: React.ReactNode;
};

export type DashboardCardHeader = {
  children: React.ReactNode;
};

export type DashboardCardTitle = {
  title: string;
  unit?: React.ReactElement | string;
};

export type DashboardCardBody = {
  children: React.ReactNode;
  isLoading?: boolean;
};

export type DashboardCardComponents = {
  Header: React.FC<DashboardCardHeader>;
  Title: React.FC<DashboardCardTitle>;
  Body: React.FC<DashboardCardBody>;
};

export type DashboardChartCardProps = {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  headerChildren?: React.ReactNode;
  unit?: React.ReactElement | string;
};
