import { BatchJobStatus } from '../../enums';
import { FileType } from '../../hooks';
import { RenameKey } from '../../type-utils';
import { CustomDate } from '../../utils';
import { FileDataType, FileResponse } from '../files';
import { IterationDataset } from '../iteration-dataset';
import { DynamicFields, FileDetails, Pagination } from '../types';
import { AccessType } from 'src/sites/components/enums';

export type AddIterationPayload = {
  name: string;
  date: string;
  site: string;
  info?: string;
};

export type Iteration = {
  id: string;
  name: string;
  date: Date;
  info?: string;
  capturedDSM?: FileDetails;
  orthomosaic?: FileDetails;
  iterationDataset?: IterationDataset;
};

export type UpdateIterationPayload = {
  id: string;
  name: string;
  date: string;
  info?: string;
};

export type DeleteIterationFilePayload = {
  iterationId: string;
};

export type IterationListItem = {
  id: string;
  name: string;
  date?: CustomDate;
  info?: string;
  capturedDsm?: FileDataType;
  capturedDsmCog?: CapturedDsmCogInfo;
  terrainTiles?: TerrainTilesInfo;
};

export type IterationList = {
  list: IterationListItem[];
  total: number;
  siteName: string;
  projectId: string;
  canManageIterations: boolean;
  accessType: AccessType | null;
};

export type IterationListRequestPayload = {
  siteId: string | null;
  searchQuery?: string;
} & Pagination &
  DynamicFields<IterationListItem>;

export type CurrentIteration = {
  iterationId: string;
  iterationName: string;
};

export type IterationIdPayload = {
  iterationId: string;
};

export type IterationMetadataPayload = IterationIdPayload & {
  fileType: FileType;
};

export type IterationData = {
  id: string;
  site: string;
  name: string;
  date: Date | string;
  info?: string;
  orthomosaic_cog?: OrthomosaicCogInfo;
  terrain_tiles?: TerrainTilesInfo;
  orthomosaic?: FileResponse;
  captured_dsm?: FileResponse;
  captured_dsm_cog?: CapturedDsmCogInfoResponse;
};

export type IterationListData = {
  iterations: IterationData[];
  total: number;
  site_name: string;
  project_id: string;
  can_manage_iterations: boolean;
  access_type: AccessType | null;
};

export type CapturedDsmCogInfoResponse = FileResponse & {
  batch_job: OrthomosaicCogInfo;
};

export type OrthomosaicCogInfo = {
  path: string;
  status: BatchJobStatus;
};

export type CapturedDsmCogInfo = Omit<
  FileDataType,
  'downloadUrl' | 'extension' | 'errors'
> & {
  batchJob: OrthomosaicCogInfo;
};

export type TerrainTilesInfo = OrthomosaicCogInfo;

export type GenerateElevationProfilePayload = {
  iterations: string[];
  lineWkt: string;
  feature: string;
};

export type GenerateElevationProfilePayloadMapper = {
  iterations: string[];
  line_wkt: string;
  feature: string;
};

export type ElevationProfile = {
  elevations: [number, number][];
  iteration: string;
};

export type ElevationProfileResponse = {
  elevation_profiles: ElevationProfile[];
  distance_points: number[];
};

export type ElevationProfileData = RenameKey<
  {
    elevation_profiles: 'elevationProfiles';
    distance_points: 'distancePoints';
  },
  ElevationProfileResponse
>;

export type AltitudeData = {
  altitudes: Record<string, number | null>;
};

// Payload.
export type SubtractDsmPayload = {
  newIterationName: string;
  date: string;
  firstIteration: string;
  secondIteration: string;
  thresholdValue: number;
  copyOrthoFromIteration: string;
  orthoLayer: string;
};

export type DownloadElevationPathPayload = {
  iterations: string[];
  lineWkt?: string;
  feature?: string;
};

export type AnalyticsRequestPayload = {
  polygonWkt: string;
  selectedOutputs: string[];
  iterationId: string;
};

export type GetAltitudePayload = {
  iterations?: Array<string | undefined>;
  longitude?: number;
  latitude?: number;
};
