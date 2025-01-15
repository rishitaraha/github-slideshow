// eslint-disable-next-line @typescript-eslint/no-unused-vars
export enum Permissions {
  // # Project permissions
  CREATE_PROJECT = 'create_projects',
  VIEW_PROJECTS = 'view_projects',
  EDIT_PROJECT = 'edit_project',

  // # Site permissions.
  CREATE_SITE = 'create_site',
  VIEW_SITES = 'view_sites',
  VIEW_SITES_ASSIGNED = 'view_sites_assigned',
  EDIT_SITE = 'edit_site',
  ASSIGN_SITE = 'assign_site',

  // # Iteration permissions.
  CREATE_ITERATION = 'create_iteration',
  VIEW_ITERATIONS = 'view_iterations',
  EDIT_ITERATION = 'edit_iteration',

  // # Task permissions.
  CREATE_TASK = 'create_ task',
  VIEW_TASKS = 'view_tasks',
  EDIT_TASK = 'edit_task',

  // # User permissions.
  CREATE_USER = 'create_user',
  VIEW_USERS = 'view_users',
  EDIT_USER = 'edit_user',

  // # Organisation permissions.
  CREATE_ORGANISATION = 'create_organisation',
  CHANGE_ORGANISATION = 'change_organisation',
  EDIT_ORGANISATION = 'edit_organisation',
  VIEW_ORGANISATION_ANALYSTS = 'view_organisation_analysts',
}
