import { IconIdentifier } from '@aus-platform/design-system';
import { FeatureFlag, UserType } from '../../../shared/enums';

export type NavItemData = {
  itemKeys: string[];
  itemName: string;
  route: string | null;
  subItems?: NavItemData[];
  includeUserRole?: UserType[];
  iconIdentifier: IconIdentifier;
  editable?: boolean;
  // TODO: Make it an array.
  enableForFeature?: FeatureFlag;
};

export type NavItemGroup = {
  itemType: string;
  items: NavItemData[];
};

export type SideCardType = {
  primary: boolean;
  secondary: boolean;
};
