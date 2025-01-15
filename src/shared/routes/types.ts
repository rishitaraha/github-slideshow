import { RouteType } from '.';

export type RouteItem = {
  path: string;
  component: any;
  title?: string;
  exact?: boolean;
  type: RouteType;
};
