import { Permissions } from './shared/roles/permissions';
import { UserRole } from './shared/roles/user-role';

export type RolesAndPermissions = {
  permission?: Permissions;
  role?: UserRole;
};
