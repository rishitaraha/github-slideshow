import { ApiResponse } from '../types';
import {
  ProcessingConnectionResponseType,
  ProcessingConnectionData,
} from './types';

export const processingConnectionResponseMapper = (
  res: ApiResponse<ProcessingConnectionResponseType>,
) => {
  const mappedData: ProcessingConnectionData = {
    id: res.data.id,
    processingOrgId: res.data.processing_org_id,
    processingOrgName: res.data.processing_org_name,
    connectionToken: res.data.connection_token,
  };
  return mappedData;
};
