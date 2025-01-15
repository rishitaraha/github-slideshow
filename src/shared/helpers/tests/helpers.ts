import {
  OrgMetaManager,
  TokenManager,
  UserLocalDataManager,
} from '../local-storage-managers';

export const removeTestUserTokens = () => {
  TokenManager.removeRefreshToken();
  TokenManager.removeToken();
  UserLocalDataManager.removeUserName();
  OrgMetaManager.removeOrgId();
  OrgMetaManager.removeOrgName();
  sessionStorage.removeItem('orgAccessToken');
};
