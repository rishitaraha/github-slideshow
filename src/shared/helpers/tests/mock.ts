import { v4 } from 'uuid';
import { User } from '../../api/users';
import { UserType } from '../../enums';
import {
  LoginModeManager,
  OrgMetaManager,
  TokenManager,
  UserLocalDataManager,
} from '../local-storage-managers';

export const mockFiles = (fileType) => {
  const fileName = 'filename' + fileType;
  return new File([''], fileName, {
    type: 'text/html',
  });
};

export const mockTestUser = (user: Partial<User>): User => {
  return {
    id: user.id || v4(),
    firstName: user.firstName || 'test',
    lastName: user.firstName || 'user',
    isActive: user.isActive || true,
    lastLogin: user.lastLogin || new Date(),
    org: user.org || 'testOrg',
    type: user.type || UserType.OrgAdmin,
    email: user.email || 'test@email.com',
  };
};

export const mockTestUserTokens = (loginMode?: string) => {
  OrgMetaManager.saveOrgId(v4());
  OrgMetaManager.saveOrgName('test-org');
  sessionStorage.setItem('orgAccessToken', v4());
  TokenManager.saveToken(v4());
  TokenManager.saveRefreshToken(v4());
  UserLocalDataManager.saveUserName('test');

  if (loginMode) {
    LoginModeManager.saveLoginMode('SSO');
  }
};
