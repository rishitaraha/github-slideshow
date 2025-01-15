import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { ApiErrorResponse, ApiResponse } from '../types';
import { CompleteIterationImagesUploadPayload } from './types';

const completeIterationImagesUploadRequest = async (
  payload: CompleteIterationImagesUploadPayload,
): Promise<ApiResponse> => {
  const { iterationDatasetId, uploadStatus } = payload;
  return api.post(
    `/processing/iteration-dataset/${iterationDatasetId}/images-upload-complete/`,
    {
      upload_status: uploadStatus,
    },
  );
};

export const useCompleteImageUploadRequest = () =>
  useMutation<
    ApiResponse,
    ApiErrorResponse,
    CompleteIterationImagesUploadPayload
  >({
    mutationFn: async (payload: CompleteIterationImagesUploadPayload) =>
      completeIterationImagesUploadRequest(payload),
  });
