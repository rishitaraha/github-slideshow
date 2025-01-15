import { UserType } from '../../enums';
import {
  isAuthenticated,
  isOrgAdmin,
  isSupportUser,
  logout,
} from '../auth-helper';
import {
  LoginModeManager,
  OrgMetaManager,
  TokenManager,
  UserLocalDataManager,
} from '../local-storage-managers';
import { removeTestUserTokens } from './helpers';
import { mockTestUser, mockTestUserTokens } from './mock';

describe('logout', () => {
  beforeEach(() => {
    // Ref: https://github.com/jestjs/jest/issues/890#issuecomment-577405951
    window.history.replaceState({}, 'logout', '/logout');
  });

  it('should change path to /  when logout is called', () => {
    // Arrange.
    mockTestUserTokens();

    // Act.
    logout();
    const path = global.window.location.pathname;

    // Assert.
    expect(path).toBe('/');
    expect(TokenManager.getToken()).toBeNull();
    expect(TokenManager.getRefreshToken()).toBeNull();
    expect(UserLocalDataManager.getUserName()).toBeNull();
    expect(OrgMetaManager.getOrgId()).toBeNull();
    expect(OrgMetaManager.getOrgName()).toBeNull();
    expect(sessionStorage.getItem('orgAccessToken')).toBeNull();
  });

  it('should change path to /logout when logout is called for SSO', () => {
    // Arrange.
    mockTestUserTokens('SSO');

    // Act.
    logout();
    const path = global.window.location.pathname;

    // Assert.
    expect(path).toBe('/logout');
    expect(TokenManager.getToken()).toBeNull();
    expect(TokenManager.getRefreshToken()).toBeNull();
    expect(UserLocalDataManager.getUserName()).toBeNull();
    expect(OrgMetaManager.getOrgId()).toBeNull();
    expect(OrgMetaManager.getOrgName()).toBeNull();
    expect(sessionStorage.getItem('orgAccessToken')).toBeNull();
    expect(LoginModeManager.getLoginMode()).toBe('SSO');
  });
});

describe('is user authenticated', () => {
  beforeEach(() => {
    removeTestUserTokens();
  });

  it('should return true, when user is authenticated', () => {
    // Arrange.
    mockTestUserTokens();

    // Act.
    const result = isAuthenticated();

    // Assert.
    expect(result).toBeTruthy();
  });

  it('should return false, when user is not authenticated', () => {
    // Act.
    const result = isAuthenticated();

    // Assert.
    expect(result).toBeFalsy();
  });
});

describe('is user org admin', () => {
  it('should return true, when user is of type org admin', () => {
    // Arrange.
    const testUser = mockTestUser({});

    // Act.
    const result = isOrgAdmin(testUser);

    // Assert.
    expect(result).toBeTruthy();
  });

  it('should return false, when user is not of type org admin', () => {
    // Arrange.
    const testUserMember = mockTestUser({ type: UserType.Member });
    const testUserSupport = mockTestUser({ type: UserType.Support });

    // Act.
    const result1 = isOrgAdmin(testUserMember);
    const result2 = isOrgAdmin(testUserSupport);

    // Assert.
    expect(result1).toBeFalsy();
    expect(result2).toBeFalsy();
  });
});

describe('is user a support user', () => {
  it('should return true, when user is of type support', () => {
    // Arrange.
    const testUser = mockTestUser({ type: UserType.Support });

    // Act.
    const result = isSupportUser(testUser);

    // Assert.
    expect(result).toBeTruthy();
  });

  it('should return false, when user is not of type support', () => {
    // Arrange.
    const testUserMember = mockTestUser({ type: UserType.Member });
    const testUserOrgAdmin = mockTestUser({ type: UserType.OrgAdmin });

    // Act.
    const result1 = isSupportUser(testUserMember);
    const result2 = isSupportUser(testUserOrgAdmin);

    // Assert.
    expect(result1).toBeFalsy();
    expect(result2).toBeFalsy();
  });
});
