import { dateFormatter } from '../../helpers';
import { ApiResponse } from '../types';
import {
  Project,
  ProjectList,
  ProjectListItem,
  ProjectPermissionPayload,
  ProjectResponse,
} from './types';

export const projectListResponseMapper = (res: ApiResponse): ProjectList => {
  const mappedData: ProjectListItem[] = res.data.projects.map((project) => {
    const createdAt = dateFormatter(new Date(project.created_at))
      .replaceAll('-', ' ')
      .split(',')[0];
    const data = {
      ...project,
      totalSites: project.total_sites,
      date: createdAt,
    };
    return data;
  });
  return { projects: mappedData, total: res.data.total };
};

export const projectResponseMapper = (response: ProjectResponse): Project => {
  const permissionList = response.permissions.reduce(
    (previousPermissions, currentPermission) => {
      return {
        ...previousPermissions,
        [currentPermission['user_group']]: {
          canView: currentPermission['can_view'],
          canManageSites: currentPermission['can_manage_sites'],
        },
      };
    },
    {},
  );

  const mappedData: Project = {
    ...response,
    permissions: permissionList,
  };
  return mappedData;
};

export const projectPermissionPayloadMapper = (
  payload: ProjectPermissionPayload,
) => {
  const { userGroupId, canView, canManageSites } = payload;
  const mappedData = {
    user_group: userGroupId,
    can_view: canView,
    can_manage_sites: canManageSites,
  };
  return mappedData;
};
