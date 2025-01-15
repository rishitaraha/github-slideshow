import { capitalize, isNull, update } from 'lodash';
import { FileDataType, FileResponse } from '../files';
import { AccessType } from '../../../sites/components/enums';
import { LayerType, featureListResponseMapper } from '..';
import { apiDataResponseMapper, apiPayloadMapper } from '../utils';
import { Converter, CustomDate } from '../../utils';
import {
  layerClampedStatusResponseMapping,
  layerTypeResponseMapping,
} from './helpers';
import {
  AddLayerPayload,
  ContourPayloadType,
  LayerListResponse,
  LayerListResponseData,
  LayerResponseData,
  UpdateLayerPayload,
  UpdateLayerMappedPayload,
  SlopeMapPayloadType,
  LayerListResponseItemData,
  LayerResponse,
} from './types';

export const layerListResponseMapper = (
  response: LayerListResponseData,
): LayerListResponse => {
  return {
    list: response.layers.map((layer: LayerListResponseItemData) => {
      let mappedTiles: FileDataType | undefined,
        mappedFiles: FileDataType[] | undefined;

      const {
        status,
        tiles,
        files,
        source_id,
        created_at,
        features_count,
        features_styles,
        area_category,
        type,
        clamped_status,
        styles,
        can_edit_features,
        ...rest
      } = layer;

      if (tiles) {
        mappedTiles = apiDataResponseMapper<FileResponse, FileDataType>(tiles);
      }

      if (files) {
        mappedFiles = files?.map((file) =>
          apiDataResponseMapper<FileResponse, FileDataType>(file),
        );
      }

      /*
        Changing the fontSize from string to number (because a string type fontSize field won't render).
      */
      if (features_styles?.textbox?.fontSize) {
        update(layer, 'features_styles.textbox.fontSize', (size) => +size);
      }

      return {
        ...rest,
        status,
        files: mappedFiles,
        tiles: mappedTiles,
        type: layerTypeResponseMapping[type],
        sourceId: source_id,
        createdAt: new CustomDate(created_at),
        featuresCount: features_count,
        featuresStyles: features_styles,
        areaCategory: area_category,
        clampedStatus: layerClampedStatusResponseMapping[clamped_status],
        mapLayerStyles: styles,
        canEditFeatures: can_edit_features,
      };
    }),
    total: response.total,
    iterationName: response.iteration_name,
    siteId: response.site_id,
    canManageLayers: response.can_manage_layers,
    accessType: capitalize(response.access_type) as AccessType,
    hasDSM: response.has_dsm,
    requestedLayerId: response.requested_layer_id,
    pageNumber: response.page_number,
  };
};

export const layerResponseMapper = (
  responseData: LayerResponseData,
): LayerResponse => {
  const layerTypeValue: LayerType = layerTypeResponseMapping[responseData.type];
  let files: FileDataType[] | undefined;
  let tiles: FileDataType | undefined;

  if (responseData.files) {
    files = responseData.files.map((file) => {
      const size = Converter.bytesToSizeConverter(file.size);
      const mappedFile = apiDataResponseMapper<FileResponse, FileDataType>(
        file,
      );

      return {
        ...mappedFile,
        size,
      };
    });
  }

  if (responseData.tiles) {
    tiles = apiDataResponseMapper<FileResponse, FileDataType>(
      responseData.tiles,
    );
  }

  const mappedResponse = apiDataResponseMapper<
    LayerResponseData,
    LayerResponse
  >(responseData);

  const response: LayerResponse = {
    ...mappedResponse,
    createdAt: new CustomDate(mappedResponse.createdAt),
    type: layerTypeValue,
    mapLayerStyles: responseData.styles,
    tiles,
    files,
  };

  if (responseData.features) {
    const { features } = featureListResponseMapper({
      features: responseData.features,
    });
    response['features'] = features;
  }

  return response;
};

export const addLayerPayloadMapper = (payload: AddLayerPayload) => {
  const {
    sourceId,
    accessTags,
    featuresFile,
    areaCategory,
    fileId,
    clampToTerrain,
    ...rest
  } = payload;
  const formData = new FormData();

  if (fileId) {
    formData.append('file_id', fileId);
  }

  if (areaCategory) {
    formData.append('area_category', areaCategory);
  }

  if (accessTags) {
    accessTags.forEach(function (value) {
      formData.append('access_tags', value);
    });
  }

  if (featuresFile) {
    formData.append('features_file', featuresFile, featuresFile.name);
  }

  if (sourceId) {
    formData.append('source_id', sourceId);
  }

  if (clampToTerrain) {
    formData.append('clamp_to_terrain', clampToTerrain.toString());
  }

  Object.keys(rest).forEach((key) => {
    if (!isNull(rest[key])) {
      formData.set(key, rest[key]);
    }
  });

  return formData;
};

export const updateLayerPayloadMapper = (
  payload: UpdateLayerPayload,
): UpdateLayerMappedPayload => {
  const { featuresStyles, ...rest } = payload;
  const data = apiPayloadMapper<UpdateLayerPayload, UpdateLayerMappedPayload>(
    rest,
  );
  data.features_styles = featuresStyles;

  return data;
};

export const contourPayloadMapper = (payload: ContourPayloadType) => {
  const data = {
    name: payload.name,
    iteration: payload.iteration,
    access_tags: payload.accessTags,
    polygon_wkt: payload.polygonWkt,
    minor_interval: payload.minorInterval,
    major_interval: payload.majorInterval,
    lowest_altitude: payload.lowestAltitude,
    highest_altitude: payload.highestAltitude,
    threshold_value: payload.thresholdValue,
    smoothing_filter_size: payload.smoothingFilterSize,
  };

  return data;
};

export const slopeMapPayloadMapper = (payload: SlopeMapPayloadType) => {
  const { accessTags, ...rest } = payload;
  const data = {
    access_tags: accessTags,
    ...rest,
  };

  return data;
};
