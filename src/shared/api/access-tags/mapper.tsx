import {
  AccessTag,
  AccessTagList,
  AccessTagListResponseData,
  AccessTagObj,
} from './types';

export const accessTagListMapper = (
  responseData: AccessTagListResponseData,
): AccessTagList => {
  const { access_tags, ...rest } = responseData;
  return {
    list: access_tags.map((accessTag) => accessTagMapper(accessTag)),
    ...rest,
  };
};

export const accessTagMapper = (accessTag: AccessTag): AccessTagObj => {
  const { created_at, user_groups_count, ...rest } = accessTag;
  return {
    createdAt: created_at,
    userGroupsCount: user_groups_count,
    ...rest,
  };
};
