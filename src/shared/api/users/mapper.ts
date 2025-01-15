import { ApiResponse } from '..';
import {
  AddUserPayload,
  User,
  UserResponse,
  UserList,
  UserListResponse,
  UpdateUserPayload,
  LoggedUser,
  LoggedUserResponse,
} from '.';

export const userListResponseMapper = (
  res: ApiResponse<UserListResponse>,
): UserList => {
  const mappedData: User[] = res.data.users.map((item) => ({
    ...item,
    firstName: item.first_name,
    lastName: item.last_name,
    isActive: item.is_active,
    lastLogin: item.last_login ? new Date(item.last_login) : null,
  }));
  return { ...res.data, users: mappedData };
};

export const userResponseMapper = (res: ApiResponse<UserResponse>): User => ({
  ...res.data,
  firstName: res.data.first_name,
  lastName: res.data.last_name,
  lastLogin: res.data.last_login,
  isActive: res.data.is_active,
});

export const addUserPayloadMapper = (payload: AddUserPayload) => {
  const { firstName, lastName, password, email, type } = payload;
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    type,
  };
};

export const updateUserPayloadMapper = (payload: UpdateUserPayload) => {
  const { firstName, lastName, type, isActive } = payload;
  return {
    first_name: firstName,
    last_name: lastName,
    type,
    is_active: isActive,
  };
};

export const loggedUserResponseMapper = (
  res: ApiResponse<LoggedUserResponse>,
): LoggedUser => ({
  ...res.data,
  firstName: res.data.first_name,
  lastName: res.data.last_name,
  lastLogin: res.data.last_login,
  isActive: res.data.is_active,
  isConnectedWithProcessing: res.data.is_connected_with_processing,
  featureFlags: res.data.feature_flags,
});
