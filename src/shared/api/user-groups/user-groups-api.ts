import { useMutation, useQuery } from '@tanstack/react-query';

import { ApiErrorResponse, ApiResponse } from '..';
import api from '../api';
import {
  userGroupListResponseMapper,
  userGroupPayloadMapper,
  userGroupResponseMapper,
} from './mapper';
import {
  ListUserGroupPayload,
  UserGroup,
  UserGroupList,
  UserGroupPayload,
} from '.';

// APIs.
export const getUserGroupRequest = async ({
  queryKey,
}): Promise<ApiResponse<UserGroup>> => {
  const [, id] = queryKey;
  const response = await api.get<any, ApiResponse>(`/user-groups/${id}/`);
  response.data = userGroupResponseMapper(response.data);
  return response;
};

export const getUserGroupListRequest = async ({
  queryKey,
}): Promise<ApiResponse<UserGroupList>> => {
  const [, payload] = queryKey;
  const response = await api.get<any, ApiResponse>('/user-groups/', {
    params: {
      page: payload.page,
      search: payload.searchQuery,
    },
  });
  response.data = userGroupListResponseMapper(response);
  return response;
};

export const addUserGroupRequest = async (
  payload: UserGroupPayload,
): Promise<ApiResponse> =>
  await api.post('/user-groups/', userGroupPayloadMapper(payload));

export const editUserGroupRequest = async (
  userGroupId,
  payload: UserGroupPayload,
): Promise<ApiResponse> =>
  await api.patch(
    `/user-groups/${userGroupId}/`,
    userGroupPayloadMapper(payload),
  );

export const deleteUserGroupRequest = async (
  userGroupId: string,
): Promise<ApiResponse> => await api.delete(`/user-groups/${userGroupId}/`);

// Hooks.
export const useUserGroup = (id: string, enabled) =>
  useQuery<any, ApiErrorResponse, ApiResponse<UserGroup>>({
    queryKey: ['/user-groups', id],
    queryFn: getUserGroupRequest,
    enabled,
  });

export const useUserGroupList = (
  enabled = true,
  payload?: Partial<ListUserGroupPayload>,
) =>
  useQuery<any, ApiErrorResponse, ApiResponse<UserGroupList>>({
    queryKey: ['user-groups', payload],
    queryFn: getUserGroupListRequest,
    enabled,
  });

export const useAddUserGroup = () =>
  useMutation<ApiResponse, ApiErrorResponse, UserGroupPayload>({
    mutationFn: async (payload: UserGroupPayload) =>
      addUserGroupRequest(payload),
  });

export const useEditUserGroup = (userGroupId) =>
  useMutation<ApiResponse, ApiErrorResponse, UserGroupPayload>({
    mutationFn: async (payload: UserGroupPayload) =>
      editUserGroupRequest(userGroupId, payload),
  });

export const useDeleteUserGroup = (userGroupId: string) =>
  useMutation<ApiResponse, ApiErrorResponse>({
    mutationFn: async () => deleteUserGroupRequest(userGroupId),
  });
