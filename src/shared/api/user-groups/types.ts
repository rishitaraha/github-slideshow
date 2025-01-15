import { Pagination } from '..';

export type UserGroupResponse = {
  id: string;
  name: string;
  users: string[];
  access_tags: string[];
};

export type UserGroup = {
  id: string;
  name: string;
  users: string[];
  accessTags: string[];
};

export type UserGroupItem = {
  id: string;
  name: string;
  membersCount: number;
};

export type UserGroupListResponseObj = {
  id: string;
  name: string;
  members_count: number;
};

export type UserGroupListResponse = {
  user_groups: UserGroupListResponseObj[];
  total: number;
};

export type UserGroupList = {
  userGroups: UserGroupItem[];
  total: number;
};

export type ListUserGroupPayload = {
  searchQuery: string;
} & Pagination;

export type UserGroupPayload = {
  name: string;
  users?: string[];
  accessTags?: string[];
};

export type UserGroupRequestBody = {
  name: string;
  users: string[];
  access_tags: string[];
};
