import { ApiResponse } from '../types';
import { SSOLoginResponse, LoginResponse } from './types';

export const loginResponseMapper = (res: ApiResponse) => {
  const mappedData: LoginResponse = {
    name: res.data.name,
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
  };
  return mappedData;
};

export const ssoLoginResponseMapper = (res: ApiResponse) => {
  const mappedData: SSOLoginResponse = {
    name: res.data.name,
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
    loginMode: res.data.login_mode,
  };
  return mappedData;
};
