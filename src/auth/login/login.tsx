import {
  Button,
  Input,
  InputGroup,
  Spinner,
} from '@aus-platform/design-system';
import { BrowserHistory } from 'history';
import { isEmpty, trim } from 'lodash';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Image } from '../../assets/images';
import {
  LoginMode,
  useEnvironment,
  useLoginRequest,
  useSSOLoginRequest,
} from '../../shared/api';
import {
  LoginModeManager,
  saveLoginInfoLocalStorage,
  validate,
} from '../../shared/helpers';
import { useInputFields } from '../../shared/hooks';
import { RoutesEnum } from '../../shared/routes';
import { LoginInfo } from '../types';
import { ErrorSlugs } from '../../shared/enums';

type LoginProps = {
  history: BrowserHistory;
};

export const Login: React.FC<LoginProps> = ({ history }) => {
  // States.
  const [showSpinner, setShowSpinner] = useState(true);

  // Hooks.
  const {
    mutate: sendLoginRequest,
    isPending: isLoadingLoginRequest,
    data: loginRequestResponse,
    isSuccess: isSuccessLoginRequest,
    isError: isErrorLoginRequest,
    error: apiError,
  } = useLoginRequest();

  const {
    mutate: sendSSOLoginRequest,
    data: ssoLoginRequestResponse,
    isSuccess: isSuccessSSOLogin,
    isError: isErrorSSOLogin,
    error: ssoLoginResponseError,
  } = useSSOLoginRequest();

  const {
    data: environmentRequestResponse,
    refetch: refetchEnvironmentRequest,
    isSuccess: isSuccessEnvironment,
  } = useEnvironment();

  const navigate = useNavigate();
  const location = useLocation();

  const { values, dirty, errors, setErrors, onChange, onBlur, onFocus } =
    useInputFields(
      {
        email: '',
        password: '',
      },
      validate,
    );

  // useEffect.
  useEffect(() => {
    // SSO login.
    const searchParamsCode = new URLSearchParams(history.location.search).get(
      'code',
    );
    if (searchParamsCode) {
      sendSSOLoginRequest({ code: searchParamsCode });
    } else {
      refetchEnvironmentRequest();
    }
  }, []);

  useEffect(() => {
    if (isSuccessEnvironment) {
      if (environmentRequestResponse.data.loginMode === LoginMode.SSO) {
        navigate(RoutesEnum.UnAuthorizedSSO);
      } else {
        setShowSpinner(false);
      }
    }
  }, [isSuccessEnvironment, environmentRequestResponse]);

  useEffect(() => {
    // Email authentication.
    if (isSuccessLoginRequest && loginRequestResponse) {
      LoginModeManager.removeLoginMode();
      saveLoginInfo(loginRequestResponse.data);
    }
  }, [isSuccessLoginRequest]);

  useEffect(() => {
    if (isSuccessSSOLogin && ssoLoginRequestResponse) {
      saveLoginInfo(ssoLoginRequestResponse.data);
    } else if (isErrorSSOLogin && ssoLoginResponseError) {
      navigate(RoutesEnum.UnAuthorizedSSO);
    }
  }, [isSuccessSSOLogin, isErrorSSOLogin]);

  // Handlers.
  const onSubmit = (e: any) => {
    e.preventDefault();
    let errorFlag = false;
    for (const error in errors) {
      if (!isEmpty(errors[error])) {
        errorFlag = true;
        break;
      }
    }

    if (!errorFlag) {
      if (!values.password) {
        setErrors({ ...errors, password: 'Password is Required' });
      } else {
        sendLoginRequest({
          email: trim(values.email),
          password: values.password,
        });
      }
    }
  };

  const saveLoginInfo = ({
    name,
    accessToken,
    refreshToken,
    loginMode,
  }: LoginInfo) => {
    saveLoginInfoLocalStorage({ name, accessToken, refreshToken, loginMode });

    // Redirect to previous link if it exists.
    const path = location.state?.from ?? '/';
    navigate(path);
  };

  // Renders.
  return (
    <>
      {showSpinner ? (
        <Spinner />
      ) : (
        <div className="login">
          <div className="login-card shadow-lg">
            <div className="login-card__content">
              <img className="login-card__logo" src={Image.AereoLogo}></img>
              <h1 className="login-card__title header-txt-1 bold-txt">LOGIN</h1>
              <form className="login-card__form" onSubmit={onSubmit}>
                <div className="line"></div>
                <InputGroup className="login-card__input">
                  <Input.Label>Email</Input.Label>
                  <Input.Text
                    value={values.email}
                    name="email"
                    isInvalid={!!(errors.email && dirty.email)}
                    error={errors.email}
                    {...{ onChange, onBlur, onFocus }}
                  />
                </InputGroup>
                <InputGroup className="login-card__input">
                  <Input.Label>Password</Input.Label>
                  <Input.Password
                    value={values.password}
                    name="password"
                    isInvalid={!!(errors.password && dirty.password)}
                    error={errors.password}
                    {...{ onChange, onBlur, onFocus }}
                  />
                </InputGroup>

                {isErrorLoginRequest && apiError?.meta?.status_code === 400 && (
                  <div className="login-card__error">
                    {apiError?.meta?.slug === ErrorSlugs.InactiveUser
                      ? apiError.meta.message
                      : 'Incorrect email or password'}
                  </div>
                )}
                <div className="line line-2"></div>
                <Button
                  className="login-card__btn"
                  isLoading={isLoadingLoginRequest}
                  type="submit"
                  data-testid="login-btn"
                >
                  Sign In
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
