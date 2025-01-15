import { v4 } from 'uuid';
import {
  LoginModeManager,
  OrgMetaManager,
  TokenManager,
  UserLocalDataManager,
  saveLoginInfoLocalStorage,
} from '../local-storage-managers';
import { removeTestUserTokens } from './helpers';

describe('orgManager', () => {
  const {
    getOrgId,
    removeOrgId,
    saveOrgId,
    getOrgName,
    removeOrgName,
    saveOrgName,
  } = OrgMetaManager;

  it("should return null, if the user hasn't saved any org Id", () => {
    // Assert.
    expect(getOrgId()).toBeNull();
  });

  it('should return org Id, if the user has saved the org Id', () => {
    // Arrange.
    const orgId = v4();
    saveOrgId(orgId);

    // Act.
    const response = OrgMetaManager.getOrgId();

    // Assert.
    expect(response).toEqual(orgId);
  });

  it('should remove the org Id from the localstorage', () => {
    // Act.
    removeOrgId();

    // Assert.
    expect(getOrgId()).toBeNull();
  });

  it("should return null, if the user hasn't saved any org name", () => {
    // Assert.
    expect(getOrgName()).toBeNull();
  });

  it('should return org name, if the user has saved the org name', () => {
    // Arrange.
    const orgName = 'test';

    // Act.
    saveOrgName(orgName);
    const response = getOrgName();

    // Assert.
    expect(response).toEqual(orgName);
  });

  it('should remove the org name from the localstorgage', () => {
    // Act.
    removeOrgName();

    // Assert.
    expect(getOrgName()).toBeNull();
  });
});

describe('loginManager', () => {
  const { getLoginMode, saveLoginMode, removeLoginMode } = LoginModeManager;
  const { getToken, getRefreshToken } = TokenManager;
  const { getUserName } = UserLocalDataManager;

  const loginInfoWithoutLoginMode = {
    name: 'test',
    accessToken: v4(),
    refreshToken: v4(),
  };

  const loginInfo = {
    ...loginInfoWithoutLoginMode,
    loginMode: 'sso',
  };

  afterAll(() => {
    removeTestUserTokens();
  });

  it("should return null, if the user hasn't save the login mode", () => {
    // Assert.
    expect(getLoginMode()).toBeNull();
  });

  it('should return login mode, if the user has already saved it', () => {
    // Arrange.
    const loginMode = 'sso';

    // Act.
    saveLoginMode(loginMode);

    // Assert.
    expect(getLoginMode()).toEqual(loginMode);
  });

  it('should remove the login mode from the localstorage', () => {
    // Act.
    removeLoginMode();

    // Assert.
    expect(getLoginMode()).toBeNull();
  });

  it('should save login info to localstorage, without loginMode', () => {
    // Arrange.
    const data = loginInfoWithoutLoginMode;

    // Act.
    saveLoginInfoLocalStorage(data);

    // Assert
    expect(getToken()).toEqual(data.accessToken);
    expect(getRefreshToken()).toEqual(data.refreshToken);
    expect(getUserName()).toEqual(data.name);
    expect(getLoginMode()).toBeNull();
  });

  it('should save login info to localstorage, with loginMode', () => {
    // Act.
    saveLoginInfoLocalStorage(loginInfo);

    // Assert
    expect(getLoginMode()).toEqual(loginInfo.loginMode);
  });
});

describe('tokenManager', () => {
  const {
    getToken,
    getRefreshToken,
    saveToken,
    saveRefreshToken,
    removeRefreshToken,
    removeToken,
  } = TokenManager;

  it('should return null, if token is not localstorage', () => {
    // Assert.
    expect(getToken()).toBeNull();
  });

  it('should return token, if already saved by user', () => {
    // Arrange.
    const token = v4();

    // Act.
    saveToken(token);
    const response = getToken();

    // Assert.
    expect(response).toEqual(token);
  });

  it('should remove the token from the localstorage', () => {
    // Act.
    removeToken();

    // Assert.
    expect(getToken()).toBeNull();
  });

  it('should return null, if refresh token is not localstorage', () => {
    // Assert.
    expect(getRefreshToken()).toBeNull();
  });

  it('should return refresh token, if already saved by user', () => {
    // Arrange.
    const token = v4();

    // Act.
    saveRefreshToken(token);
    const response = getRefreshToken();

    // Assert.
    expect(response).toEqual(token);
  });

  it('should remove refresh token from the localstorage', () => {
    // Act.
    removeRefreshToken();

    // Assert.
    expect(getRefreshToken()).toBeNull();
  });
});

describe('userManager', () => {
  const { getUserName, saveUserName, removeUserName } = UserLocalDataManager;

  it('should return null, if username is not localstorage', () => {
    // Assert.
    expect(getUserName()).toBeNull();
  });

  it('should return username, if already saved by user', () => {
    // Arrange.
    const username = 'testUser';

    // Act.
    saveUserName(username);
    const response = getUserName();

    // Assert.
    expect(response).toEqual(username);
  });

  it('should remove username from the localstorage', () => {
    // Act.
    removeUserName();

    // Assert.
    expect(getUserName()).toBeNull();
  });
});
