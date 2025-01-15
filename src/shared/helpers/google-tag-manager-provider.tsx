import { GTMProvider } from '@elgorditosalsero/react-gtm-hook';
import { ReactNode } from 'react';
import { isUndefined } from 'lodash';
import { EnvVariables } from '../env-variables';

const TRACKING_ID = EnvVariables.googleTagManagerId;
const isProduction = EnvVariables.environment === 'production';

export const GoogleTagManagerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const gtmParams = { id: TRACKING_ID };

  if (isProduction && !isUndefined(TRACKING_ID)) {
    return <GTMProvider state={gtmParams}> {children} </GTMProvider>;
  }

  return children;
};
