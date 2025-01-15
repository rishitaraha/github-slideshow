export enum RouteType {
  Auth = 'auth',
  Protected = 'protected',
  Default = 'default',
}

export enum RoutesEnum {
  AccessTags = '/access-tags',
  Dashboard = '/dashboard',
  Home = '/',
  Iterations = '/iterations',
  Layers = '/layers',
  Login = '/login',
  Logout = '/logout',
  Map3D = '/3d-map',
  Map3DWorkspace = '/3d-map/:workspaceId?',
  MergedDatasets = '/merged-datasets',
  NetworkError = '/network-error',
  PageNotFound = '/not-found',
  Processing = '/processing/*', // Route all child paths of processing to processing element.
  Projects = '/projects',
  Sites = '/sites',
  SwipeMap = '/swipe-map',
  SwipeMap3D = '/3d-swipe-map',
  Tasks = '/tasks',
  UnAuthorizedSSO = '/sso-not-authorized',
  UserGroups = '/user-groups',
  Users = '/users',
}
