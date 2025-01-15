import { isEmpty } from 'lodash';
import {
  ApiResponse,
  FileDataType,
  FileResponse,
  IterationDataset,
  IterationDatasetResponse,
  apiDataResponseMapper,
} from '..';
import { Converter, CustomDate } from '../../utils';
import {
  AnalyticsRequestPayload,
  CapturedDsmCogInfo,
  CapturedDsmCogInfoResponse,
  ElevationProfileData,
  ElevationProfileResponse,
  GenerateElevationProfilePayload,
  GenerateElevationProfilePayloadMapper,
  Iteration,
  IterationList,
  IterationListData,
  IterationListItem,
} from './types';

export const iterationListMapper = (
  payload: IterationListData,
): IterationList => {
  return {
    list: payload.iterations.map((iteration) => {
      const mappedData: IterationListItem = apiDataResponseMapper(iteration);
      mappedData.date = new CustomDate(mappedData.date);

      if (!isEmpty(iteration.captured_dsm)) {
        mappedData.capturedDsm = apiDataResponseMapper<
          FileResponse,
          FileDataType
        >(iteration.captured_dsm);
      }

      if (!isEmpty(iteration.captured_dsm_cog)) {
        mappedData.capturedDsmCog = apiDataResponseMapper<
          CapturedDsmCogInfoResponse,
          CapturedDsmCogInfo
        >(iteration.captured_dsm_cog);
      }

      return mappedData;
    }),
    total: payload.total,
    siteName: payload.site_name,
    projectId: payload.project_id,
    canManageIterations: payload.can_manage_iterations,
    accessType: payload.access_type,
  };
};

export const iterationResponseMapper = (res: ApiResponse): Iteration => {
  const mappedData: Iteration = {
    id: res.data.id,
    name: res.data.name,
    date: res.data.date,
    info: res.data.info,
  };

  const { bytesToSizeConverter } = Converter;

  if (res.data.captured_dsm) {
    mappedData['capturedDSM'] = {
      id: res.data.captured_dsm.id,
      status: res.data.captured_dsm.status,
      name: res.data.captured_dsm.filename,
      size: bytesToSizeConverter(res.data.captured_dsm.size),
      downloadUrl: res.data.captured_dsm.download_url,
    };
  }

  if (res.data.orthomosaic) {
    mappedData['orthomosaic'] = {
      id: res.data.orthomosaic.id,
      status: res.data.orthomosaic.status,
      name: res.data.orthomosaic.filename,
      size: bytesToSizeConverter(res.data.orthomosaic.size),
      downloadUrl: res.data.orthomosaic.download_url,
    };
  }

  if (res.data.iteration_dataset) {
    const iterationDataset = apiDataResponseMapper<
      IterationDatasetResponse,
      IterationDataset
    >(res.data.iteration_dataset);

    mappedData['iterationDataset'] = iterationDataset;
  }

  return mappedData;
};

export const elevationProfilePayloadMapper = (
  payload: GenerateElevationProfilePayload,
): GenerateElevationProfilePayloadMapper => {
  const { lineWkt, ...rest } = payload;
  return {
    ...rest,
    line_wkt: lineWkt,
  };
};

export const elevationProfileResponseMapper = (
  payload: ElevationProfileResponse,
): ElevationProfileData => {
  const { elevation_profiles, distance_points, ...rest } = payload;
  return {
    elevationProfiles: elevation_profiles,
    distancePoints: distance_points,
    ...rest,
  };
};

export const analyticsRequestPayloadMapper = (
  payload: AnalyticsRequestPayload,
) => {
  return {
    polygon_wkt: payload.polygonWkt,
    selected_outputs: payload.selectedOutputs,
  };
};
