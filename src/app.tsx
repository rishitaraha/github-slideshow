import '@aus-platform/design-system/dist/style.css';
import './assets/scss/main.scss';

// Overriding.
import './overrides';

import { Spinner } from '@aus-platform/design-system';
import { lazy, Suspense, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SSOAuthorizationFailed } from './auth/sso-auth/sso-authorization-failed';
import { Home } from './home';
import { LoggedUser } from './shared/api';
import ProtectedRoutes, { NotFoundPage } from './shared/components';
import AuthRoutes from './shared/components/auth-route';
import { history } from './shared/constants/history';
import { GlobalContext } from './shared/context';
import { RoutesEnum } from './shared/routes';
import { GoogleTagManagerProvider } from './shared/helpers/google-tag-manager-provider';

const Users = lazy(() => import('./users'));
const Projects = lazy(() => import('./projects'));
const Processing = lazy(() => import('./processing'));
const Iterations = lazy(() => import('./iterations'));
const DatasetResources = lazy(() => import('./dataset-resources'));
const Logout = lazy(() => import('./auth/logout'));
const Login = lazy(() => import('./auth/login'));
const AccessTags = lazy(() => import('./access-tags'));
const Dashboard = lazy(() => import('./dashboard'));
const UserGroups = lazy(() => import('./user-groups'));
const Map3D = lazy(() => import('./map-3d'));
const SwipeMap = lazy(() => import('./swipe-map'));
const SwipeMap3D = lazy(() => import('./swipe-map-3d'));
const Sites = lazy(() => import('./sites'));

export const App = () => {
  // States.
  const [loggedUser, setLoggedUser] = useState<LoggedUser>();

  // Render.
  return (
    <div className="app">
      <GlobalContext.Provider value={{ loggedUser, setLoggedUser }}>
        <GoogleTagManagerProvider>
          {/* TODO: Add custom loading page */}
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route element={<AuthRoutes />}>
                <Route
                  path={RoutesEnum.Login}
                  element={<Login history={history} />}
                />
              </Route>
              <Route element={<ProtectedRoutes />}>
                <Route
                  path={RoutesEnum.Home}
                  element={<Navigate to={RoutesEnum.Map3D} />}
                />
                <Route path={RoutesEnum.Logout} element={<Logout />} />
                <Route path={RoutesEnum.Home} element={<Home />}>
                  <Route path={RoutesEnum.Users} element={<Users />} />
                  <Route
                    path={RoutesEnum.UserGroups}
                    element={<UserGroups />}
                  />
                  <Route
                    path={RoutesEnum.AccessTags}
                    element={<AccessTags />}
                  />
                  <Route path={RoutesEnum.Projects} element={<Projects />} />
                  <Route path={RoutesEnum.Sites} element={<Sites />} />
                  <Route
                    path={RoutesEnum.Iterations}
                    element={<Iterations />}
                  />
                  <Route path={RoutesEnum.Map3DWorkspace} element={<Map3D />} />
                  <Route
                    path={RoutesEnum.Layers}
                    element={<DatasetResources />}
                  />
                  <Route
                    path={RoutesEnum.Tasks}
                    element={<DatasetResources />}
                  />
                  <Route path={RoutesEnum.Map3D} element={<Map3D />} />
                  <Route path={RoutesEnum.SwipeMap} element={<SwipeMap />} />
                  <Route
                    path={RoutesEnum.SwipeMap3D}
                    element={<SwipeMap3D />}
                  />
                  <Route path={RoutesEnum.Dashboard} element={<Dashboard />} />
                  <Route
                    path={RoutesEnum.Processing}
                    element={<Processing />}
                  />
                </Route>
              </Route>
              <Route
                path="*"
                element={<Navigate to={RoutesEnum.PageNotFound} />}
              />

              <Route
                path={RoutesEnum.PageNotFound}
                element={<NotFoundPage />}
              />
              <Route
                path={RoutesEnum.UnAuthorizedSSO}
                element={<SSOAuthorizationFailed />}
              />
            </Routes>
          </Suspense>
        </GoogleTagManagerProvider>
      </GlobalContext.Provider>
    </div>
  );
};
