import { AccordionCheckBoxStatus } from '@aus-platform/design-system';
import { AccessType } from '../enums';

export type SiteACLProps = {
  userGroups: SiteUserGroupList;
  siteId: string;
  isLoading: boolean;
  totalUserGroups: number;
  selectedUserGroupsCount?: number;
};

export type SitePermission = {
  id: string;
  groupId: string;
  canView: boolean;
  canManageSites: boolean;
};

export type SiteUserGroup = {
  name: string;
  show: boolean;
  canView: boolean;
  canManageIterationsAndLayers: boolean;
  accessType: AccessType | undefined;
  checkboxStatus: AccordionCheckBoxStatus;
};

export type SiteUserGroupList = Record<string, SiteUserGroup>;

export type SitePermissionList = Record<string, SitePermission>;

export type CheckboxStatusParams = {
  groupId: string;
  newStatus: AccordionCheckBoxStatus;
  accessType: AccessType;
  canView: boolean;
  canManageIterationsAndLayers: boolean;
  sendRequest?: boolean;
};

export type SiteACLUserGroupListProps = {
  uniqueKey: number;
  groupId: string;
  group: SiteUserGroup;
  setCheckboxStatus: (params: CheckboxStatusParams) => void;
};
