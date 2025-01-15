import { IconIdentifier } from '@aus-platform/design-system';
import { FeatureFlag, ModuleRoute, UserType } from '../../shared/enums';
import { NavItemGroup } from '../components/accordion-sidenav/types';

export const navItems: NavItemGroup[] = [
  {
    itemType: 'Dashboard',
    items: [
      {
        itemName: 'Dashboard',
        itemKeys: ['/dashboard'],
        route: ModuleRoute.Dashboard,
        iconIdentifier: IconIdentifier.Dashboard,
      },
    ],
  },
  {
    itemType: 'Maps',
    items: [
      {
        itemName: 'Projects',
        itemKeys: ['/projects'],
        route: ModuleRoute.Projects,
        iconIdentifier: IconIdentifier.Site,
      },
      {
        itemName: '3D Map',
        itemKeys: ['/3d-map'],
        route: ModuleRoute.Map3D,
        iconIdentifier: IconIdentifier.Map3D,
      },
      {
        itemName: '2D Swipe Map',
        itemKeys: ['/swipe-map'],
        route: ModuleRoute.SwipeMap,
        iconIdentifier: IconIdentifier.SwipeMap,
      },
      {
        itemName: '3D Swipe Map',
        itemKeys: ['/3d-swipe-map'],
        route: ModuleRoute.SwipeMap3D,
        iconIdentifier: IconIdentifier.SwipeMap,
        enableForFeature: FeatureFlag.SwipeMap3d,
      },
    ],
  },
  {
    itemType: 'Management',
    items: [
      {
        itemName: 'Access Tags',
        itemKeys: ['/access-tags'],
        route: ModuleRoute.AccessTags,
        iconIdentifier: IconIdentifier.Tag,
      },
      {
        itemName: 'Users',
        itemKeys: ['/users'],
        route: ModuleRoute.Users,
        iconIdentifier: IconIdentifier.People,
      },
      {
        itemName: 'User Groups',
        itemKeys: ['/user-groups'],
        route: ModuleRoute.UserGroups,
        iconIdentifier: IconIdentifier.UserGroup,
      },
    ],
  },
  {
    itemType: 'Processing',
    items: [
      {
        itemName: 'Processing',
        itemKeys: ['/processing'],
        route: ModuleRoute.Processing,
        iconIdentifier: IconIdentifier.Gears,
        enableForFeature: FeatureFlag.Processing,
      },
      {
        itemName: 'Org Settings',
        itemKeys: ['/org-settings'],
        route: null,
        iconIdentifier: IconIdentifier.GearFill,
        enableForFeature: FeatureFlag.Processing,
        includeUserRole: [UserType.OrgAdmin],
      },
    ],
  },
];
