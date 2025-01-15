import { SelectOption } from '@aus-platform/design-system';
import { SiteListItem } from '../../shared/api';
import { CesiumProxy } from '../../shared/cesium';

export type DashboardDataset = {
  project: SelectOption | null;
  site: SelectOption<SiteListItem> | null;
  cesiumProxy: CesiumProxy | null;
  userHasManageSitePermission: boolean;
};
