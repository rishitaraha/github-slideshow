import { Icon, IconIdentifier } from '@aus-platform/design-system';

export const SSOAuthorizationFailed = () => {
  return (
    <div className="sso-auth-failed-container">
      <Icon identifier={IconIdentifier.LockCloseCross} size={114}></Icon>
      <div className="sso-auth-failed-textbox">
        <span>Authorisation Failed</span>
        <span>Please access through SSO provider</span>
      </div>
    </div>
  );
};
