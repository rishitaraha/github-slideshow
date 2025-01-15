import { Converter } from '../../utils';
import { ApiResponse } from '../types';
import { apiDataResponseMapper } from '../utils';
import {
  FileDataType,
  FileInfoResponses,
  FileResponse,
  MetadataResponseType,
  MetadataType,
} from './types';

export const fileMapper = (payload: FileResponse): FileDataType => {
  const { size, ...rest } = payload;
  return {
    ...apiDataResponseMapper(rest),
    size: Converter.bytesToSizeConverter(size),
  };
};

export const fileInfoMapper = (
  payload: ApiResponse<FileInfoResponses>,
): FileDataType => {
  const { size, ...rest } = payload.data.file_info;
  return {
    ...apiDataResponseMapper(rest),
    size: Converter.bytesToSizeConverter(size),
  };
};

export const metadataMapper = (
  response: MetadataResponseType,
): MetadataType => {
  const {
    min_elevation,
    max_elevation,
    pixel_size,
    unit_type,
    max_zoom,
    min_zoom,
    ...rest
  } = response.properties;

  return {
    minElevation: min_elevation,
    maxElevation: max_elevation,
    pixelSize: pixel_size,
    unitType: unit_type,
    maxZoom: max_zoom,
    minZoom: min_zoom,
    ...rest,
  };
};
