import { capitalize, isEmpty } from 'lodash';
import { ApiResponse, apiDataResponseMapper } from '..';
import { Converter, CustomDate } from '../../utils';
import {
  EditSitePayload,
  ProductionKPI,
  SafetyIndexKPI,
  SiteListItem,
  SitePermissionPayload,
  SiteTypes,
  SitesProductionKpiResponse,
  SitesSafetyIndexKpiResponse,
  SitesStockVolumeKpiResponse,
  StockVolumeKPI,
  UploadProductionKpiData,
  UploadProductionKpiResponse,
  UploadSafetyIndexKpiData,
  UploadSafetyIndexKpiResponse,
  UploadStockVolumeKpiData,
  UploadStockVolumeKpiResponse,
} from './types';
import {
  AddSitePayload,
  SearchedSite,
  SiteList,
  SiteListData,
  SitePayload,
} from '.';
import { Formatter } from 'src/shared/helpers';

export const addSitePayloadMapper = (payload: AddSitePayload) => {
  const { siteName, siteType, longitude, latitude, siteBoundary, project } =
    payload;
  const validatedSiteBoundary = isEmpty(siteBoundary) ? null : siteBoundary;
  return {
    name: siteName,
    longitude: longitude,
    latitude: latitude,
    type: siteType,
    boundary: validatedSiteBoundary,
    project,
  };
};

export const updateSitePayloadMapper = (payload: EditSitePayload) => {
  const { siteName, siteType, longitude, latitude, siteBoundary } = payload;
  const validatedSiteBoundary = isEmpty(siteBoundary) ? null : siteBoundary;
  return {
    name: siteName,
    longitude: longitude,
    latitude: latitude,
    type: siteType,
    boundary: validatedSiteBoundary,
  };
};

export const siteListResponseMapper = (payload: SiteListData): SiteList => {
  return {
    list: payload.sites.map((site) => {
      const mappedData: SiteListItem = apiDataResponseMapper(site);
      mappedData.createdAt = new CustomDate(mappedData.createdAt);

      return mappedData;
    }),
    total: payload.total,
    project: payload.project,
    canManageSites: payload.can_manage_sites,
  };
};

export const searchedSiteMapper = (response: ApiResponse) => {
  const mappedData: SearchedSite[] = [];
  response.data.map((site) => {
    mappedData.push({
      id: site.site_id,
      name: site.dis_name,
    });
  });
  return mappedData;
};

export const siteResponseMapper = (res: ApiResponse): SitePayload => {
  const { name, latitude, longitude, type, boundary } = res.data;
  const { bytesToSizeConverter } = Converter;
  const mappedData: SitePayload = {
    siteName: name,
    siteType: {
      label: Formatter.toTitleCase(type.replace('_', ' '), ' '),
      value: SiteTypes[type.toUpperCase()],
    },
    longitude,
    latitude,
    siteBoundary: boundary,
  };
  if (res.data.permissions) {
    const { permissions } = res.data;
    mappedData['permissions'] = permissions.reduce(
      (previousPermissions, currentPermission) => {
        return {
          ...previousPermissions,
          [currentPermission['user_group']]: {
            canView: currentPermission['can_view'],
            canManageIterationsAndLayers:
              currentPermission['can_manage_iterations_and_layers'],
            accessType: capitalize(currentPermission['access_type']),
          },
        };
      },
      {},
    );
  }
  if (res.data.base_dsm) {
    const baseDsmData = res.data.base_dsm;
    mappedData['baseDSM'] = {
      id: baseDsmData.id,
      status: baseDsmData.status,
      name: baseDsmData.filename,
      size: bytesToSizeConverter(baseDsmData.size),
      downloadUrl: baseDsmData.download_url,
    };
  }
  if (res.data.legend_image) {
    const legendImageFile = res.data.legend_image;
    mappedData['legendImage'] = {
      id: legendImageFile.id,
      status: legendImageFile.status,
      name: legendImageFile.filename,
      size: bytesToSizeConverter(legendImageFile.size),
      downloadUrl: legendImageFile.download_url,
    };
  }
  return mappedData;
};

export const sitePermissionPayloadMapper = (payload: SitePermissionPayload) => {
  const { userGroupId, canView, canManageIterationsAndLayers, accessType } =
    payload;
  const mappedData = {
    user_group: userGroupId,
    access_type: accessType.toLowerCase(),
    can_view: canView,
    can_manage_iterations_and_layers: canManageIterationsAndLayers,
  };
  return mappedData;
};

// Production target response mapper.
export const productionKpiResponseMapper = (
  response: SitesProductionKpiResponse,
): ProductionKPI => {
  const mappedData: ProductionKPI = {
    id: response.id,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    year: response.year,
    month: response.month,
    targetOverburdenProduction: response.target_overburden_production,
    targetOreProduction: response.target_ore_production,
    actualOverburdenProduction: response.actual_overburden_production,
    actualOreProduction: response.actual_ore_production,
    site: response.site,
  };
  return mappedData;
};

export const productionKpiListResponseMapper = (
  response: SitesProductionKpiResponse[],
) => {
  return response.map((productionKpiResponse) =>
    apiDataResponseMapper<SitesProductionKpiResponse, ProductionKPI>(
      productionKpiResponse,
    ),
  );
};

// Upload production target response mapper.
export const uploadProductionTargetResponseMapper = (
  response: UploadProductionKpiResponse,
): UploadProductionKpiData => {
  const mappedData: UploadProductionKpiData = {
    createdProductionKPI: response.created_production_kpi.map(
      (createdProductionKpi) =>
        productionKpiResponseMapper(createdProductionKpi),
    ),
    updatedProductionKPI: response.updated_production_kpi.map(
      (updatedProductionKpi) =>
        productionKpiResponseMapper(updatedProductionKpi),
    ),
  };

  return mappedData;
};

// Safety index mapper.
export const safetyIndexKpiResponseMapper = (
  response: SitesSafetyIndexKpiResponse,
): SafetyIndexKPI => {
  const mappedData: SafetyIndexKPI = {
    id: response.id,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    year: response.year,
    month: response.month,
    haulRoadDistanceUnderGradientIssue:
      response.haul_road_distance_under_gradient_issue,
    haulRoadDistanceUnderWidthIssue:
      response.haul_road_distance_under_width_issue,
    site: response.site,
  };
  return mappedData;
};

export const uploadSafetyIndexResponseMapper = (
  response: UploadSafetyIndexKpiResponse,
): UploadSafetyIndexKpiData => {
  const mappedData: UploadSafetyIndexKpiData = {
    createdSafetyIndexKPI: response.created_safety_index_kpi.map(
      (createdSafetyIndexKpi) =>
        safetyIndexKpiResponseMapper(createdSafetyIndexKpi),
    ),
    updatedSafetyIndexKPI: response.updated_safety_index_kpi.map(
      (updatedSafetyIndexKPI) =>
        safetyIndexKpiResponseMapper(updatedSafetyIndexKPI),
    ),
  };

  return mappedData;
};

// Stock volume mapper.
export const stockVolumeKpiResponseMapper = (
  response: SitesStockVolumeKpiResponse,
): StockVolumeKPI => {
  const mappedData: StockVolumeKPI = {
    id: response.id,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    year: response.year,
    month: response.month,
    stockVolume: response.stock_volume,
    site: response.site,
  };
  return mappedData;
};

export const uploadStockVolumeResponseMapper = (
  response: UploadStockVolumeKpiResponse,
): UploadStockVolumeKpiData => {
  const mappedData: UploadStockVolumeKpiData = {
    createdStockVolumeKPI: response.created_stock_volume_kpi.map(
      (createdStockVolumeKpi) =>
        stockVolumeKpiResponseMapper(createdStockVolumeKpi),
    ),
    updatedStockVolumeKPI: response.updated_stock_volume_kpi.map(
      (updatedStockVolumeKPI) =>
        stockVolumeKpiResponseMapper(updatedStockVolumeKPI),
    ),
  };

  return mappedData;
};
