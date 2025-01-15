import { useMutation, useQuery } from '@tanstack/react-query';
import { isNil } from 'lodash';
import api from '../api';
import { layerTypeResponseMapping } from '../layers/helpers';
import { ApiErrorResponse, ApiResponse } from '../types';
import { apiDataResponseMapper, apiPayloadMapper } from '../utils';
import {
  ShareableWorkspaceResponse,
  ShareableWorkspacePayload,
  WorkspaceMappedResponse,
  WorkspaceResponseLayer,
} from './types';
import { CustomDate } from 'shared/utils';

export const addWorkspaceRequest = async (
  payload: ShareableWorkspacePayload,
): Promise<ShareableWorkspaceResponse> => {
  const response = await api.post<ShareableWorkspacePayload, ApiResponse>(
    '/workspaces/',
    apiPayloadMapper(payload),
  );

  return response.data;
};

export const getWorkspaceRequest = async ({ queryKey }) => {
  const [, workspaceId] = queryKey;
  const response = await api.get<any, ApiResponse>(
    `/workspaces/${workspaceId}/`,
  );

  const mappedResponse = apiDataResponseMapper<any, WorkspaceMappedResponse>(
    response.data,
  );

  mappedResponse.workspaceLayers =
    mappedResponse.workspaceLayers.map<WorkspaceResponseLayer>(
      ({ type, ...rest }) => ({
        ...rest,
        type: layerTypeResponseMapping[type],
      }),
    );

  mappedResponse.terrainIteration.date = new CustomDate(
    mappedResponse.terrainIteration.date,
  );

  return mappedResponse;
};

export const useAddWorkspace = () =>
  useMutation<
    ShareableWorkspaceResponse,
    ApiErrorResponse,
    ShareableWorkspacePayload
  >({
    mutationFn: addWorkspaceRequest,
  });

export const useWorkspace = (workspaceId?: string) =>
  useQuery<WorkspaceMappedResponse, ApiErrorResponse>({
    queryKey: ['/workspace', workspaceId],
    queryFn: getWorkspaceRequest,
    enabled: !isNil(workspaceId),
  });
