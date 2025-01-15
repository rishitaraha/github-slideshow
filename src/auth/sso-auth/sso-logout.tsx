import { Icon, IconIdentifier } from '@aus-platform/design-system';

export const SSOLogout = () => {
  return (
    <div className="sso-logout-container">
      <Icon identifier={IconIdentifier.BoxArrowOutToLeft} size={114}></Icon>
      <div className="sso-logout-textbox">
        <span>Logged Out</span>
        <span>Please access through SSO Provider to login again</span>
      </div>
    </div>
  );
};
