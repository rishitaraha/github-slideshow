import { IterationData } from '../../iterations';
import { LayerResponse, LayerResponseData } from '../../layers';
import { DynamicFields } from '../../types';
import { HaulRoadLayerType, HaulRoadLayerTypeResponse } from './enums';
import { BatchJobStatus, FileStatus } from 'src/shared/enums';

// Data object types.
export type HaulRoadList = HaulRoadListItem[];

export type HaulRoadListItem = {
  id: string;
  name: string;
  status: FileStatus;
};

export type HaulRoad = {
  id: string;
  name: string;
  type: string;
  vehicleWidth: number;
  chainageInterval: number;
  iteration: Partial<IterationData>;
  haulRoadLayers: HaulRoadLayer[];
};

export type HaulRoadTypeList = HaulRoadType[];

export type HaulRoadType = {
  id: string;
  name: string;
};

export type HaulRoadAttribute = {
  width: string;
  chainId: number;
  chainDist: string;
  chainName: string;
  chainWidth: number;
  widthRiskCategory: string;
  endElev: string;
  gradient: string;
  gradientX: number;
  patchName: string;
  startElev: string;
  gradientRiskCategory: string;
};

export type HaulRoadLayer = {
  type: HaulRoadLayerType;
  layer: Partial<LayerResponse> & { id: string; isDeleted: boolean };
};

// API Response types.
export type HaulRoadListResponseData = HaulRoadListResponseItem[];

export type HaulRoadListResponseItem = {
  id: string;
  name: string;
  status: BatchJobStatus;
};

export type HaulRoadResponseData = {
  id: string;
  name: string;
  type: string;
  vehicle_width: number;
  chainage_interval: number;
  iteration: Partial<IterationData>;
  haul_road_layers: HaulRoadLayerTypeResponse[];
};

export type HaulRoadAttributeResponseData = {
  width: string;
  chain_id: number;
  chain_dist: string;
  chain_name: string;
  chainwidth: number;
  width_risk_category: string;
  end_elev: string;
  gradient: string;
  gradient_x: number;
  patch_name: string;
  start_elev: string;
  gradient_risk_category: string;
};

export type HaulRoadTypeResponseData = {
  id: string;
  name: string;
};

export type HaulRoadLayerResponseData = {
  type: HaulRoadLayerTypeResponse;
  layer: Partial<LayerResponseData>;
};

// Payload types.
export type HaulRoadsPayload = {
  iteration: string;
} & DynamicFields<HaulRoadResponseData>;

export type AddHaulRoadPayload = {
  smartLineWkt?: string;
  name: string;
  type: HaulRoadTypeResponseData | undefined;
  vehicleWidth: number;
  chainageInterval: number;
  iteration: string | undefined;
  mediansLayer?: string;
  edgeLayer?: string;
  centerLineLayer?: string;
};
