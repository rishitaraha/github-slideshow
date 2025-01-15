import { ApiResponse } from '..';
import {
  UserGroupList,
  UserGroupListResponse,
  UserGroupItem,
  UserGroupRequestBody,
  UserGroupResponse,
} from '.';

export const userGroupListResponseMapper = (
  response: ApiResponse<UserGroupListResponse>,
): UserGroupList => {
  const mappedData: UserGroupItem[] = response.data.user_groups.map(
    ({ members_count, ...rest }) => ({
      ...rest,
      membersCount: members_count,
    }),
  );
  return { userGroups: mappedData, total: response.data.total };
};

export const userGroupResponseMapper = (response: UserGroupResponse) => {
  const { access_tags, ...userGroupData } = response;
  return {
    ...userGroupData,
    accessTags: access_tags,
  };
};

export const userGroupPayloadMapper = (payload): UserGroupRequestBody => {
  return {
    name: payload.name,
    users: payload.users,
    access_tags: payload.accessTags,
  };
};
