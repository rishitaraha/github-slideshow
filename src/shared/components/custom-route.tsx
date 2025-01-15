import { isUndefined } from 'lodash';
import React, { useEffect } from 'react';
import { Route, RouteProps } from 'react-router-dom';
import { RouteType } from '../routes/enums';
import AuthRoutes from './auth-route';
import ProtectedRoute from './protected-route';

export type CustomRouteProps = {
  title?: string;
  type: RouteType;
  exact?: boolean;
} & RouteProps;

const CustomRoute: React.FC<CustomRouteProps> = ({
  title,
  children,
  type,
  ...rest
}) => {
  useEffect(() => {
    if (!isUndefined(title)) {
      document.title = title || '';
    }
  }, [title]);

  let RouteComponent;

  switch (type) {
    case RouteType.Auth:
      RouteComponent = AuthRoutes;
      break;
    case RouteType.Protected:
      RouteComponent = ProtectedRoute;
      break;
    default:
      RouteComponent = Route;
  }
  return <RouteComponent {...rest}>{children}</RouteComponent>;
};

export default CustomRoute;
