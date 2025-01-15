import { useEffect } from 'react';
import { queryClient, useLogoutRequest } from '../shared/api';
import { LoginModeManager, TokenManager, logout } from '../shared/helpers';
import { SSOLogout } from './sso-auth/sso-logout';

const Logout = () => {
  // Api.
  const { mutate: sendLogoutRequest, isError, isSuccess } = useLogoutRequest();

  // useEffect.
  useEffect(() => {
    const token = TokenManager.getRefreshToken();
    if (token) {
      sendLogoutRequest({ refresh_token: TokenManager.getRefreshToken() });
    } else {
      logout();
    }

    // Invalidate user data.
    queryClient.invalidateQueries({ queryKey: ['/user'], refetchType: 'none' });
  }, []);

  // useEffect - isSuccess,isError.
  useEffect(() => {
    if (isSuccess || isError) {
      logout();
    }
  }, [isSuccess, isError]);

  if (LoginModeManager.getLoginMode() === 'SSO') {
    return <SSOLogout />;
  }
  return null;
};
export default Logout;
