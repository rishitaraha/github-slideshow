import { Line, Point, Polygon, Textbox } from '@aus-platform/cesium';
import { RenameKey } from '../../type-utils';
import { FeatureGeometryType } from './enums';

export enum FeatureType {
  Textbox = 'TextBox',
  Point = 'Point',
  LineString = 'LineString',
  Polygon = 'Polygon',
}

export type FeatureProperties = {
  text?: string;
};

export type FeatureObj = Polygon | Line | Point | Textbox | null;

export type FeaturesCount = {
  [FeatureGeometryType.Line]: number;
  [FeatureGeometryType.Polygon]: number;
  [FeatureGeometryType.Point]: number;
  [FeatureGeometryType.Textbox]: number;
};

export type FeatureResponseData = {
  id: string;
  geometry: string;
  layer: string;
  type: FeatureType;
  name?: string;
  feature?: FeatureObj;
  properties?: FeatureProperties;
  created_at?: string;
};

export type FeatureListResponseData = {
  features: FeatureResponseData[];
};

export type Feature = RenameKey<
  {
    created_at: 'createdAt';
  },
  FeatureResponseData
>;

export type FeatureList = {
  features: Feature[];
};

export type BulkFeatures = FeatureList & {
  featuresCount: FeaturesCount;
};

export type BulkDeleteFeatures = {
  featuresCount: FeaturesCount;
};

export type FeatureInfoImageResponse = {
  id: string;
  name: string;
  image_s3_key: string;
  thumbnail_s3_key: string;
};

export type FeatureInfoResponse = {
  id: string;
  layer: string;
  geometry: string;
  info?: string;
  attributes?: Record<string, any>;
  images?: FeatureInfoImageResponse[];
};

export type FeatureInfoImage = RenameKey<
  {
    image_s3_key: 'imageS3Key';
    thumbnail_s3_key: 'thumbnailS3Key';
  },
  FeatureInfoImageResponse
>;

export type FeatureInfo = Omit<FeatureInfoResponse, 'images'> & {
  images?: FeatureInfoImage[];
};

// Payloads.
export type AddFeaturePayload = Omit<Feature, 'createdAt'>;
export type BulkAddFeaturesPayload = AddFeaturePayload[];
export type UpdateFeaturePayload = AddFeaturePayload;
export type BulkUpdateFeaturesPayload = Omit<Feature, 'createdAt' | 'layer'>[];
export type BulkDeleteFeaturesPayload = string[];

export type UpdateFeatureInfoPayload = {
  id: string;
  info?: string;
  images?: File[];
};
