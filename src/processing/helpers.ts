import { EnvVariables } from '../shared/env-variables';

export const formatProcessingUrl = (processingOrgId: string): string => {
  const processingSearchParams = new URLSearchParams(window.location.search);
  processingSearchParams.set('org_id', processingOrgId);

  const processingPath = window.location.pathname.replace('/processing', '');

  return `${
    EnvVariables.processingUrl
  }${processingPath}?${processingSearchParams.toString()}`;
};
