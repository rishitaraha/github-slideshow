import { UserCheckBoxInput } from '../../types';

export type AddUserGroupProps = {
  show: boolean;
  closeAddUserGroup: () => void;
  refetchUserGroups: () => void;
};
export type AddUserGroupInput = {
  name: string;
  searchQuery?: string;
  users?: UserCheckBoxInput[];
  selectedUsersCount: number;
};
