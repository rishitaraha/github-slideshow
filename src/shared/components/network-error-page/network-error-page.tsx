import { Button, ButtonVariant } from '@aus-platform/design-system';

export const NetworkErrorPage = () => {
  return (
    <div className="network-error-page">
      <div className="network-error-page__txt-box">
        <div className="network-error-page__txt-heading-2">
          SOMETHING’S WRONG
        </div>
        <div className="network-error-page__txt-body">
          Please try again in sometime
        </div>
        <div className="network-error-page__txt-btn-box">
          <Button
            className="network-error-page__txt-btn"
            variant={ButtonVariant.Secondary}
            onClick={() => {
              location.href = '/';
            }}
          >
            Go Home
          </Button>{' '}
          <Button
            className="network-error-page__txt-btn"
            variant={ButtonVariant.Secondary}
            onClick={() => {
              location.reload();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
      <div className="network-error-page__network-man"></div>
      <div className="network-error-page__dog-server"></div>
    </div>
  );
};
