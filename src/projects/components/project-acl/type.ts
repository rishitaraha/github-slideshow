import { AccordionCheckBoxStatus } from '@aus-platform/design-system';

export type ProjectACLProps = {
  userGroups: ProjectUserGroupList;
  projectId: string;
  isLoading: boolean;
  totalUserGroups: number;
  selectedUserGroupsCount?: number;
};

export type ProjectUserGroup = {
  name: string;
  show: boolean;
  canView: boolean;
  canManageSites: boolean;
  checkboxStatus: AccordionCheckBoxStatus;
};

export type ProjectPermission = {
  id: string;
  groupId: string;
  canView: boolean;
  canManageSites: boolean;
};

export type ProjectUserGroupList = Record<string, ProjectUserGroup>;

export type ProjectPermissionList = Record<string, ProjectPermission>;
