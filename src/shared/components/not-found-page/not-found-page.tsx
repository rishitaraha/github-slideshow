import React from 'react';
import { Button, ButtonVariant } from '@aus-platform/design-system';
import { history } from '../../constants/history';

export const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-page__txt-box">
        <div className="not-found-page__txt-heading-1">404</div>
        <div className="not-found-page__txt-heading-2">
          OOPS! PAGE NOT FOUND
        </div>
        <div className="not-found-page__txt-body">
          The content you are looking for does not exist
        </div>
        <Button
          className="not-found-page__txt-btn"
          variant={ButtonVariant.Secondary}
          onClick={() => history.replace('/')}
        >
          Go Home
        </Button>
      </div>
      <div className="not-found-page__man"></div>
      <div className="not-found-page__tree"></div>
      <div className="not-found-page__drone"></div>
    </div>
  );
};
