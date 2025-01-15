import { Pagination } from '..';

export type AccessTag = {
  id: string;
  name: string;
  color: string;
  created_at: string;
  user_groups_count: number;
};

export type AccessTagObj = Omit<
  AccessTag,
  'created_at' | 'user_groups_count'
> & {
  createdAt: string;
  userGroupsCount: number;
};

export type AccessTagList = {
  list: AccessTagObj[];
  total: number;
};

export type AccessTagListResponseData = {
  access_tags: AccessTag[];
  total: number;
};

// Payloads.
export type AccessTagListPayload = Pagination;

export type AddAccessTagPayload = {
  tagName: string;
  color: string;
};

export type DeleteAccessTagPayload = {
  id: string;
};

export type UpdateAccessTagPayload = Partial<AddAccessTagPayload> &
  DeleteAccessTagPayload;
