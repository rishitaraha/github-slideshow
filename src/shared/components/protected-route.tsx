import { isNull } from 'lodash';
import React, { useContext } from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { GlobalContext } from '../context';
import { FeatureFlag } from '../enums';
import { isAppOpenInIframe, isOrgAdmin } from '../helpers';
import { TokenManager } from '../helpers/local-storage-managers/token-manager';
import { RoutesEnum } from '../routes';

export const orgAdminRoutes = [
  RoutesEnum.Users.toString(),
  RoutesEnum.UserGroups.toString(),
  RoutesEnum.AccessTags.toString(),
  RoutesEnum.Processing.toString(),
];

export const routesWithFeatureFlag = {
  [RoutesEnum.Processing]: FeatureFlag.Processing,
  [RoutesEnum.SwipeMap3D]: FeatureFlag.SwipeMap3d,
};

const ProtectedRoutes: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  // States.
  const accessToken = TokenManager.getToken();

  let newPath = '';

  // If app is opened in iframe, then orgAccessToken should be present.
  // Either in session storage or in query param.
  if (isAppOpenInIframe()) {
    const searchParamOrgAccessToken = searchParams.get('iframe_token');
    const sessionStoredOrgAccessToken =
      sessionStorage.getItem('orgAccessToken');
    if (!isNull(searchParamOrgAccessToken)) {
      sessionStorage.setItem('orgAccessToken', searchParamOrgAccessToken);

      // Remove iframe token from query params.
      searchParams.delete('iframe_token');
      setSearchParams(searchParams);
    }
    // If orgAccessToken is not present in both, re-route to login page.
    else if (isNull(sessionStoredOrgAccessToken)) {
      newPath = RoutesEnum.Login;
    }
  }

  // Check if user access token is present in the local storage.
  else if (isNull(accessToken)) {
    newPath = RoutesEnum.Login;
  }

  // Checking if the logged user is org admin before accessing the routes which is restricted for org admin only.
  else if (
    loggedUser &&
    !isOrgAdmin(loggedUser) &&
    orgAdminRoutes.includes(location.pathname)
  ) {
    newPath = RoutesEnum.PageNotFound;
  }

  // Checking if the feature is enabled for this route.
  else if (
    loggedUser &&
    loggedUser.featureFlags[routesWithFeatureFlag[location.pathname]] === false
  ) {
    newPath = RoutesEnum.PageNotFound;
  }

  return newPath ? (
    <Navigate to={newPath} state={{ from: location }} />
  ) : (
    <Outlet />
  );
};

export default ProtectedRoutes;
