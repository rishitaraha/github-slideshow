import { EditUserInput } from '../../../users/components/edit-user/types';
import { FeatureFlag, UserType } from '../../enums';
import { Modify } from '../../type-utils';

export type UserResponse = {
  id: string;
  first_name: string;
  last_name: string;
  org: string | null;
  type: UserType;
  email: string;
  is_active: boolean;
  last_login: Date | null;
};

export type User = Omit<
  UserResponse,
  'first_name' | 'last_name' | 'last_login' | 'is_active'
> & {
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin: Date | null;
};

export type UserListResponse = {
  users: UserResponse[];
  total: number;
};

export type UserList = {
  users: User[];
  total: number;
};

export type AddUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  type: UserType;
};

export type ListUserPayload = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  isDeactivatedUsers?: boolean;
  membersOnly?: boolean;
};

export type UpdateUserPayload = Modify<
  EditUserInput,
  {
    id: string;
    org: string;
    type: UserType;
    isActive: boolean;
  }
>;

export type ChangePasswordPayload = {
  id: string;
  password: string;
  confirmPassword: string;
};

export type ChangeLoggedUserPasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type LoggedUserResponse = UserResponse & {
  feature_flags: Record<FeatureFlag, boolean>;
  is_connected_with_processing: boolean;
};

export type LoggedUser = User & {
  featureFlags: Record<FeatureFlag, boolean>;
  isConnectedWithProcessing: boolean;
};
