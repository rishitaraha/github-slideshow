import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../helpers';

const AuthRoutes: React.FC = () => {
  return isAuthenticated() ? <Navigate to="/" /> : <Outlet />;
};

export default AuthRoutes;
