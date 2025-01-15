import { Modify } from '../../type-utils';

export type ProjectPermission = {
  canView: boolean;
  canManageSites: boolean;
};

export type Project = {
  id: string;
  name: string;
  permissions: Record<string, ProjectPermission>;
};

export type ProjectListItem = {
  id: string;
  name: string;
  date?: string;
  totalSites?: number;
};

export type ProjectList = {
  projects: ProjectListItem[];
  total: number;
};

export type ProjectListPayload = {
  searchQuery?: string;
};

export type AddProjectPayload = {
  name: string;
};

export type UpdateProjectPayload = {
  id: string;
  name: string;
};

export type ProjectPermissionPayload = {
  id: string;
  userGroupId: string;
  canView: boolean;
  canManageSites: boolean;
};

export type ProjectResponse = Modify<
  Project,
  { permissions: ProjectPermissionResponse[] }
>;

export type ProjectPermissionResponse = {
  project: string;
  user_group: string;
  can_view: boolean;
  can_manage_sites: boolean;
};
