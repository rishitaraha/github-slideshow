import { UserCheckBoxInput } from '../../types';

export type EditUserGroupProps = {
  show: boolean;
  userGroupId: string;
  closeEditUserGroup: () => void;
  refetchUserGroups: () => void;
};
export type EditUserGroupInput = {
  name: string;
  searchQuery?: string;
  users?: UserCheckBoxInput[];
};
