import { AddSiteInput } from '../../../sites/components/types';
import { Modify, RenameKey } from '../../type-utils';
import { DynamicFields, FileDetails, Pagination } from '../types';
import { AccessType } from '../../../sites/components/enums';
import { CustomDate } from '../../utils';

export enum SiteTypes {
  MINE_SITE = 'mine_site',
  WAGON_SITE = 'wagon_site',
  CRUSHED_SITE = 'crushed_site',
  UNCRUSHED_SITE = 'uncrushed_site',
  URBAN_LAND = 'urban_land',
}

export type AddSitePayload = Modify<
  AddSiteInput,
  {
    siteType: SiteTypes;
    project: string;
  }
>;

export type EditSitePayload = Modify<
  AddSiteInput,
  {
    siteType: SiteTypes;
  }
>;

export type SitePermission = {
  canView: boolean;
  canManageIterationsAndLayers: boolean;
  accessType: AccessType;
};

export type SitePayload = Modify<
  AddSiteInput,
  { baseDSM?: FileDetails; legendImage?: FileDetails }
> & {
  permissions?: Record<string, SitePermission>;
};

export type RenameSitePayload = {
  payload: EditSitePayload;
  siteId: string;
};

export type SiteListItem = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt?: CustomDate;
  type?: SiteTypes;
  boundary?: string;
  canManageIterationsAndLayers?: boolean;
};

export type SiteList = {
  list: SiteListItem[];
  total: number;
  project: string;
  canManageSites: boolean;
};

export type SiteData = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: SiteTypes;
  boundary: string;
  created_at: string;
  updated_at: string;
  project: string;
  can_manage_iterations_and_layers?: boolean;
};

export type SiteListData = {
  sites: SiteData[];
  total: number;
  project: string;
  can_manage_sites: boolean;
};

export type SiteIdPayload = {
  siteId: string;
};

export type CurrentSite = {
  siteId: string;
  siteName: string;
};

export type SiteListPayload = {
  projectId: string | undefined;
  searchQuery?: string;
} & Pagination &
  DynamicFields<SiteListItem>;

export type SearchedSite = {
  id: string;
  name: string;
};

export type DeleteSiteFilePayload = {
  siteId: string;
};

export type SitePermissionPayload = {
  id: string;
  userGroupId: string;
  accessType: AccessType;
  canView: boolean;
  canManageIterationsAndLayers: boolean;
};

export type SitesProductionKpiResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  year: number;
  month: number;
  target_overburden_production: number;
  target_ore_production: number;
  actual_overburden_production: number;
  actual_ore_production: number;
  site: string;
};

export type ProductionKPI = RenameKey<
  {
    created_at: 'createdAt';
    updated_at: 'updatedAt';
    target_overburden_production: 'targetOverburdenProduction';
    target_ore_production: 'targetOreProduction';
    actual_overburden_production: 'actualOverburdenProduction';
    actual_ore_production: 'actualOreProduction';
  },
  SitesProductionKpiResponse
>;

export type UploadProductionKpiResponse = {
  created_production_kpi: SitesProductionKpiResponse[];
  updated_production_kpi: SitesProductionKpiResponse[];
};

export type UploadProductionKpiData = {
  createdProductionKPI: ProductionKPI[];
  updatedProductionKPI: ProductionKPI[];
};

// Safety index.
export type SitesSafetyIndexKpiResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  year: number;
  month: number;
  haul_road_distance_under_gradient_issue: number;
  haul_road_distance_under_width_issue: number;
  site: string;
};

export type SafetyIndexKPI = RenameKey<
  {
    created_at: 'createdAt';
    updated_at: 'updatedAt';
    haul_road_distance_under_gradient_issue: 'haulRoadDistanceUnderGradientIssue';
    haul_road_distance_under_width_issue: 'haulRoadDistanceUnderWidthIssue';
  },
  SitesSafetyIndexKpiResponse
>;

export type UploadSafetyIndexKpiResponse = {
  created_safety_index_kpi: SitesSafetyIndexKpiResponse[];
  updated_safety_index_kpi: SitesSafetyIndexKpiResponse[];
};

export type UploadSafetyIndexKpiData = {
  createdSafetyIndexKPI: SafetyIndexKPI[];
  updatedSafetyIndexKPI: SafetyIndexKPI[];
};

//Stock volume.
export type SitesStockVolumeKpiResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  year: number;
  month: number;
  stock_volume: number;
  site: string;
};

export type StockVolumeKPI = RenameKey<
  {
    created_at: 'createdAt';
    updated_at: 'updatedAt';
    stock_volume: 'stockVolume';
  },
  SitesStockVolumeKpiResponse
>;

export type UploadStockVolumeKpiResponse = {
  created_stock_volume_kpi: SitesStockVolumeKpiResponse[];
  updated_stock_volume_kpi: SitesStockVolumeKpiResponse[];
};

export type UploadStockVolumeKpiData = {
  createdStockVolumeKPI: StockVolumeKPI[];
  updatedStockVolumeKPI: StockVolumeKPI[];
};

export type UploadKpiPayload = {
  siteId: string;
  csvFile: File;
};
