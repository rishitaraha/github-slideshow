import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiErrorResponse, ApiResponse } from '..';
import api from '../api';
import {
  addUserPayloadMapper,
  loggedUserResponseMapper,
  updateUserPayloadMapper,
  userListResponseMapper,
  userResponseMapper,
} from './mapper';
import {
  AddUserPayload,
  ChangeLoggedUserPasswordPayload,
  ChangePasswordPayload,
  ListUserPayload,
  LoggedUser,
  UpdateUserPayload,
  User,
  UserList,
} from '.';

// APIs.
export const getUserRequest = async ({
  queryKey,
}): Promise<ApiResponse<User>> => {
  const [, id] = queryKey;
  const res = await api.get<any, ApiResponse>(`/users/${id}/`);
  res.data = userResponseMapper(res);
  return res;
};

export const getLoggedUserRequest = async (): Promise<
  ApiResponse<LoggedUser>
> => {
  const res = await api.get<any, ApiResponse>('/users/logged/');
  res.data = loggedUserResponseMapper(res);
  return res;
};

export const getUserListRequest = async ({
  queryKey,
}): Promise<ApiResponse<User[]>> => {
  const [, payload] = queryKey;
  const res = await api.get<any, ApiResponse>('/users/', {
    params: {
      page: payload.page,
      page_size: payload.pageSize,
      search: payload.searchQuery,
      deactivated_users: payload.isDeactivatedUsers ? 1 : 0,
      members_only: payload.membersOnly ? 1 : 0,
    },
  });
  res.data = userListResponseMapper(res);
  return res;
};

export const addUserRequest = async (
  payload: AddUserPayload,
): Promise<ApiResponse> =>
  await api.post('/users/', addUserPayloadMapper(payload));

export const updateUserRequest = async (
  payload: UpdateUserPayload,
): Promise<ApiResponse> => {
  const { id } = payload;
  const res = await api.patch<any, ApiResponse>(
    `/users/${id}/`,
    updateUserPayloadMapper(payload),
  );
  res.data = userResponseMapper(res);
  return res;
};

export const changePasswordRequest = async (
  payload: ChangePasswordPayload,
): Promise<ApiResponse> => {
  return await api.patch(`/users/change-password/`, {
    user_id: payload.id,
    new_password: payload.password,
    confirm_new_password: payload.confirmPassword,
  });
};

export const changeLoggedUserPasswordRequest = async (
  payload: ChangeLoggedUserPasswordPayload,
): Promise<ApiResponse> => {
  return await api.patch('/users/change-password/', {
    old_password: payload.currentPassword,
    new_password: payload.newPassword,
    confirm_new_password: payload.confirmNewPassword,
  });
};

// Hooks.
export const useUser = (id: string) =>
  useQuery<any, ApiErrorResponse, ApiResponse<User>>({
    queryKey: ['/user', id],
    queryFn: getUserRequest,
    enabled: false,
  });

export const useLoggedUser = (enabled = true) =>
  useQuery<any, ApiErrorResponse, ApiResponse<LoggedUser>>({
    queryKey: ['/user'],
    enabled,
    queryFn: getLoggedUserRequest,
  });

export const useUserList = (payload: ListUserPayload) =>
  useQuery<any, ApiErrorResponse, ApiResponse<UserList>>({
    queryKey: ['users', payload],
    queryFn: getUserListRequest,
  });

export const useAddUserRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, AddUserPayload>({
    mutationFn: async (payload: AddUserPayload) => addUserRequest(payload),
  });

export const useUpdateUserRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: updateUserRequest,
  });

export const useChangePasswordRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: changePasswordRequest,
  });

export const useChangeLoggedUserPasswordRequest = () =>
  useMutation<ApiResponse, ApiErrorResponse, any>({
    mutationFn: changeLoggedUserPasswordRequest,
  });
