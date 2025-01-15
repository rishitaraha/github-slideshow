import { isNil } from 'lodash';
import { User } from '../api/users';
import { history } from '../constants';
import { UserType } from '../enums';
import { LoginModeManager } from './local-storage-managers';
import { OrgMetaManager } from './local-storage-managers/org-manager';
import { TokenManager } from './local-storage-managers/token-manager';
import { UserLocalDataManager } from './local-storage-managers/user-manager';

export const logout = () => {
  TokenManager.removeToken();
  TokenManager.removeRefreshToken();
  UserLocalDataManager.removeUserName();
  OrgMetaManager.removeOrgId();
  OrgMetaManager.removeOrgName();
  sessionStorage.removeItem('orgAccessToken');

  if (isNil(LoginModeManager.getLoginMode())) {
    history.push('/');
  }
};

export const isAuthenticated = () => {
  const orgAccessToken = sessionStorage.getItem('orgAccessToken');
  return !!TokenManager.getToken() || !!orgAccessToken;
};

export const isOrgAdmin = (user: User | undefined | null) => {
  if (isNil(user)) {
    return false;
  }
  return user.type === UserType.OrgAdmin;
};

export const isSupportUser = (user: User) => {
  return user.type === UserType.Support;
};

export const logServiceAuthHeader = () => {
  const token = TokenManager.getToken();
  const authObj = {
    Authorization: `Bearer ${token}`,
  };

  return authObj;
};
