import { LoginInfo } from '../../../auth/types';
import { TokenManager } from './token-manager';
import { UserLocalDataManager } from './user-manager';

export const LoginModeManager = {
  saveLoginMode: (loginMode: string): void => {
    localStorage.setItem('login-mode', loginMode);
  },

  getLoginMode: (): string | null => localStorage.getItem('login-mode'),

  removeLoginMode: () => localStorage.removeItem('login-mode'),
};

export const saveLoginInfoLocalStorage = ({
  name,
  accessToken,
  refreshToken,
  loginMode,
}: LoginInfo) => {
  TokenManager.saveToken(accessToken);
  TokenManager.saveRefreshToken(refreshToken);
  UserLocalDataManager.saveUserName(name.split(' ')[0]);

  if (loginMode) {
    LoginModeManager.saveLoginMode(loginMode);
  }
};
