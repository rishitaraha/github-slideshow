import { apiDataResponseMapper } from '../utils';
import { GeotagImageListResponseData, GeotagImageListResponse } from '.';

export const geotagImageListResponseMapper = (
  responseData: GeotagImageListResponseData,
): GeotagImageListResponse => {
  return {
    geotagImages: responseData.geotag_images.map((geotagImage) =>
      apiDataResponseMapper(geotagImage),
    ),
    total: responseData.total,
  };
};

export const mapTaskObject = (taskData) => ({
  ...taskData,
  options: JSON.parse(taskData.options as unknown as string),
});
