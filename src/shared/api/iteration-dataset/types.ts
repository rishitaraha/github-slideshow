import {
  CamelCasedProperties,
  SnakeCasedProperties,
  SnakeCasedPropertiesDeep,
} from 'type-fest';
import { Task, TaskResponse } from '../task';
import {
  EPSGCode,
  GCPImageTagType,
  GeotagSchemaField,
  HorizontalCRS,
  VerticalCRS,
} from 'shared/enums';
import { GCPType, GCPUploadAction } from 'src/tasks/enums';
import { GeotagImageEntity } from 'src/tasks/geotag-images-modal/enum';

export type IterationDatasetResponse = {
  id: string;
  is_archived: boolean;
  geotag_column_order: Array<string>;
  have_geotags: boolean;
  have_gcps: boolean;
  is_gcp_tagged: boolean;
  geotag_horizontal_crs: number;
  geotag_vertical_crs: string;
  gcp_horizontal_crs: number;
  gcp_vertical_crs: string;
  is_preparing_geotags: boolean;
  rotation_angle_type: string;
  number_of_images: number;
  number_of_images_enabled: number;
  created_at: string;
  updated_at: string;
  tasks?: TaskResponse[];
};

export type CreateIterationDatasetResponse = {
  processing_data: IterationDatasetResponse;
};

export type InputCrs = {
  geotagHorizontalCrs: EPSGCode;
  geotagVerticalCrs: VerticalCRS;
  gcpHorizontalCrs: EPSGCode;
  gcpVerticalCrs: VerticalCRS;
};

export type InputCrsName = {
  geotagHorizontalCrs: HorizontalCRS;
  geotagVerticalCrs: VerticalCRS;
  gcpHorizontalCrs: HorizontalCRS;
  gcpVerticalCrs: VerticalCRS;
};

export type IterationDataset = {
  id: string;
  isArchived: boolean;
  geotagColumnOrder: Array<GeotagSchemaField>;
  areGeotagsPresent: boolean;
  areGcpsPresent: boolean;
  isGcpTagged: boolean;
  geotagHorizontalCrs: EPSGCode;
  geotagVerticalCrs: VerticalCRS;
  gcpHorizontalCrs: EPSGCode;
  gcpVerticalCrs: VerticalCRS;
  isPreparingGeotags: boolean;
  rotationAngleType: string;
  numberOfImages: number;
  numberOfImagesEnabled: number;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
};

export type UpdateCrsPayload = {
  geotagHorizontalCrs?: number;
  geotagVerticalCrs?: string;
  gcpHorizontalCrs?: number;
  gcpVerticalCrs?: string;
};

export type IterationDatasetIdPayload = {
  iterationDatasetId: string;
};
export type UpdateIterationDatasetCrsPayload = IterationDatasetIdPayload &
  UpdateCrsPayload;

export type CompleteIterationImagesUploadPayload = IterationDatasetIdPayload & {
  uploadStatus: string;
};

export type ImagesUploadSuccessPayload = IterationDatasetIdPayload & {
  imageName: string;
};

export type FilenamesPresignedUrlsPayload = IterationDatasetIdPayload & {
  filenames: Array<string>;
};

export type UploadGeotagDataPayload = {
  iterationDataset?: string;
  mergedDatasetDataset?: string;
  geotagHorizontalCrs: string;
  geotagVerticalCrs: string;
  geotagRotationAngle: string;
  columnOrder: GeotagSchemaField[];
  geotagImageFile: File;
};

export type GeotagImageListQueryParams = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  imagesWithGeotags?: boolean;
  imagesWithoutGeotags?: boolean;
  geotagsWithoutImages?: boolean;
};

export type GeotagImageListForIterationDataset = GeotagImageListQueryParams & {
  iterationDataset: string;
};

export type GeotagImageListForMergedDataset = GeotagImageListQueryParams & {
  mergedDataset: string;
};

export type GeotagImageListPayload =
  | GeotagImageListForIterationDataset
  | GeotagImageListForMergedDataset;

export type GeotagImageIdPayload = {
  id: string;
};

export type GeotagImageDownloadPayload = DatasetParamPayload & {
  geotagColumnOrder: Array<GeotagSchemaField>;
};

export type GeotagImageResponseData = {
  id: string;
  filename: string;
  iteration_dataset: string | null;
  merged_dataset: string | null;
  is_image_available: boolean;
  image_orientation: number;
  is_geotag_disabled: boolean;
  is_image_disabled: boolean;
  location_wgs84: string;
  x_coordinate: number;
  y_coordinate: number;
  z_coordinate: number;
  x_accuracy: number;
  y_accuracy: number;
  horizontal_accuracy: number;
  vertical_accuracy: number;
  omega: number;
  omega_accuracy: number;
  phi: number;
  phi_accuracy: number;
  kappa: number;
  kappa_accuracy: number;
  yaw: number;
  yaw_accuracy: number;
  pitch: number;
  pitch_accuracy: number;
  roll: number;
  roll_accuracy: number;
  is_deleted: boolean;
  deleted_at: Date;
  created_at: Date;
  updated_at: Date;
};

export type GeotagImageObj = {
  id: string;
  filename: string;
  iterationDataset: string | null;
  mergedDataset: string | null;
  isImageAvailable: boolean;
  imageOrientation: number;
  isGeotagDisabled: boolean;
  isImageDisabled: boolean;
  locationWgs84: string;
  xCoordinate: number;
  yCoordinate: number;
  zCoordinate: number;
  xAccuracy: number;
  yAccuracy: number;
  horizontalAccuracy: number;
  verticalAccuracy: number;
  omega: number;
  omegaAccuracy: number;
  phi: number;
  phiAccuracy: number;
  kappa: number;
  kappaAccuracy: number;
  yaw: number;
  yawAccuracy: number;
  pitch: number;
  pitchAccuracy: number;
  roll: number;
  rollAccuracy: number;
  isDeleted: boolean;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type GeotagImageListResponseData = {
  geotag_images: GeotagImageResponseData[];
  total: number;
};

export type GeotagImageListResponse = {
  geotagImages: GeotagImageObj[];
  total: number;
};

export type GeotagImagePresignedUrlResponseData = {
  presigned_url: string;
};
export type GeotagImagePresignedUrlResponse = {
  presignedUrl: string;
};

export type PatchGeotagImagePayload = {
  geotagImageId: string;
  xCoordinate?: string;
  yCoordinate?: string;
  zCoordinate?: string;
  isGeotagDisabled?: boolean;
  isImageDisabled?: boolean;
};

export type PatchGeotagImageBulkPayload = {
  iterationDataset?: string;
  geotagImageIds: string[];
  isGeotagDisabled?: boolean;
  isImageDisabled?: boolean;
};
export type UploadGCPPayload = {
  gcpFile: File;
  gcpHorizontalCRS: EPSGCode;
  gcpVerticalCRS: VerticalCRS;
  action: GCPUploadAction;
  iterationDataset?: string;
  mergedDataset?: string;
};

export type GCPUpdatePayload = {
  id: string;
  body: Partial<{
    label: string;
    type: GCPType;
    numberOfTaggedImages: number;
    xCoordinate: number;
    yCoordinate: number;
    zCoordinate: number;
  }>;
};

export type GCPBulkUpdatePayload = {
  iterationDataset?: string;
  type: GCPType;
  gcpIds: string[];
};

export type DatasetParamPayload = {
  iterationDataset?: string;
  mergedDataset?: string;
};

export type GCPRequestBody = SnakeCasedProperties<UploadGCPPayload>;

export type GCPListPayload = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  mergedDataset?: string;
  iterationDataset?: string;
};

export type GCPListDataGeneric<T> = {
  gcps: T[];
  total: number;
};

export type GCPResponseData = {
  id: string;
  label: string;
  type: GCPType;
  iteration_dataset: string | null;
  merged_dataset: string | null;
  x_coordinate: number;
  y_coordinate: number;
  z_coordinate: number;
  location_wgs84: string | null;
  number_of_images_tagged: number;
  created_at: string;
  updated_at: string;
};

export type GCPListResponse = GCPListDataGeneric<GCPResponseData>;

export type GCPData = CamelCasedProperties<GCPResponseData>;

export type GCPList = GCPListDataGeneric<GCPData>;

export type DeleteGeotagImagePayload = {
  iterationDataset: string;
  entity: GeotagImageEntity;
  geotagImageIds: string[];
};

export type DeleteGcpDataPayload = {
  gcpIds: string[];
  iterationDataset?: string;
};

export type GcpIdPayload = {
  gcpId: string;
};

export type GcpIdPagePayload = GcpIdPayload & {
  pageNumber?: number;
  pageSize?: number;
};

export type ImageInfoObj = {
  imageId: string;
  imageFilename: string;
  imageX: number;
  imageY: number;
  imageOrientation: string;
  presignedUrl: string;
  tagType: GCPImageTagType;
};

export type ImagesObjList = {
  images: ImageInfoObj[];
};

export type ImageUrlsListResponse = SnakeCasedPropertiesDeep<ImagesObjList>;

export type GCPImageTagData = {
  imageId: string;
  imageX: number;
  imageY: number;
  isDeleted?: boolean;
};

export type TagGcpImagePayload = {
  gcp: string;
  gcpImageTags: GCPImageTagData[];
};

export type TaggedGcpImagesResponse = SnakeCasedPropertiesDeep<ImageInfoObj>;
