import { isNil } from 'lodash';
import { apiDataResponseMapper } from '../utils';
import {
  Feature,
  FeatureList,
  FeatureListResponseData,
  FeatureResponseData,
  FeatureInfoResponse,
  FeatureInfo,
  FeatureInfoImageResponse,
  FeatureInfoImage,
  UpdateFeatureInfoPayload,
} from './types';

export const featureListResponseMapper = (
  featureListResponse: FeatureListResponseData,
): FeatureList => {
  const featureList: FeatureList = { features: [] };

  featureList.features = featureListResponse.features.map(
    (featureResponse: FeatureResponseData) => {
      return apiDataResponseMapper<FeatureResponseData, Feature>(
        featureResponse,
      );
    },
  );
  return featureList;
};

export const featureInfoResponseMapper = (
  featureInfoResponse: FeatureInfoResponse,
): FeatureInfo => {
  return {
    ...featureInfoResponse,
    images: featureInfoResponse.images?.map((imageInfo) =>
      apiDataResponseMapper<FeatureInfoImageResponse, FeatureInfoImage>(
        imageInfo,
      ),
    ),
  };
};

export const featureInfoPayloadMapper = (payload: UpdateFeatureInfoPayload) => {
  const { id, info, images } = payload;
  const formDataPayload = new FormData();

  formDataPayload.append('id', id);

  if (images) {
    images.forEach((value) => {
      if (!isNil(value)) {
        formDataPayload.append('image_list', value, value.name);
      }
    });
  }

  if (info) {
    formDataPayload.append('info', info);
  }

  return formDataPayload;
};
