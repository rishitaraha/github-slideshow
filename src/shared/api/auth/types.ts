import { LoginMode } from './enums';

export type LoginRequestPayload = {
  email: string;
  password: string;
};

export type ssoLoginRequestPayload = {
  code: string;
};

export type LoginResponse = {
  name: string;
  accessToken: string;
  refreshToken: string;
};

export type SSOLoginResponse = LoginResponse & {
  loginMode: string;
};

export type LogoutRequestPayload = {
  refresh_token: string;
};

export type LoginModeResponse = {
  loginMode: LoginMode.SSO;
};
