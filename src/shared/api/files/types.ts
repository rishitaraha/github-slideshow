import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { RenameKey } from '../../type-utils';
import { FileType } from 'shared/hooks';

export type OrthoFileMetadata = {
  bounds: [number, number, number, number];
  minzoom: number;
  maxzoom: number;
  width: number;
  height: number;
  statistics: any;
};

export type FileResponse = {
  id: string;
  filename: string;
  s3_key: string;
  status: StatusIndicatorLevel;
  size: number;
  download_url: string;
  extension: string;
  type: FileType;
  created_at: string;
  properties?: OrthoFileMetadata;
  errors: string[];
};

export type FileDataType = {
  size: string;
  id: string;
  filename: string;
  s3Key: string;
  status: StatusIndicatorLevel;
  downloadUrl: string;
  extension: string;
  type: FileType;
  createdAt: string;
  properties?: OrthoFileMetadata;
  errors?: string[];
};

export type FileInfoResponses = {
  file_info: FileResponse;
};

export type StartMultipartUploadResponse = {
  file_info: string;
  upload_id: string;
};

export type PresignedUrlResponse = {
  file_info: string;
  url: string;
};

// Payload
export type AddFilePayload = {
  filename: string;
  filetype: string;
};

export type FilePayload = {
  id: string;
  iterationId: string;
};

export type DeleteFilePayload = FilePayload;

export type MetadataType = {
  crs: string;
  bounds: [number, number, number, number];
  origin: [number, number];
  height: number;
  width: number;
  pixelSize: number;
  unitType: string;
  // @TODO - remove we dont get minzoom and maxzoom
  maxZoom: number;
  minZoom: number;
  minElevation?: number;
  maxElevation?: number;
  statistics?: any;
};

export type MetadataResponseType = {
  properties: {
    crs: string;
    min_elevation: number;
    max_elevation: number;
    pixel_size: number;
    unit_type: string;
    bounds: [number, number, number, number];
    origin: [number, number];
    height: number;
    width: number;
    max_zoom: number;
    min_zoom: number;
  };
};

export type MetadataPayload = RenameKey<{ id: 'fileId' }, FilePayload>;
