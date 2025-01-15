import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { apiPayloadMapper } from '../utils';
import { SmartDetectCreatePayload } from './types';

export const addSmartDetectRequest = async (
  payload: SmartDetectCreatePayload,
): Promise<any> => {
  const response = await api.post<SmartDetectCreatePayload, ApiResponse>(
    '/analytics/smart-detect',
    apiPayloadMapper(payload),
  );

  return response.data;
};

export const useAddSmartDetectRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, SmartDetectCreatePayload>({
    mutationFn: addSmartDetectRequest,
  });
