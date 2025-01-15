import { UserGroupAccessTagsList } from 'src/user-groups/types';

export type UserGroupACLProps = {
  accessTagsList: UserGroupAccessTagsList;
  setAccessTagsList: (accessTag: UserGroupAccessTagsList) => void;
  totalAccessTags: number;
  isLoadingAccessTag: boolean;
  selectedAccessTags?: number;
};
