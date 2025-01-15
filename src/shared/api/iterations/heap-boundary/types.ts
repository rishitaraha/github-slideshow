import { Modify } from '../../../type-utils';
import { HeapMaterialType, HeapCategory, VolumeReportFormat } from './enums';

export type HeapResponseDataType = {
  id: string;
  name: string;
  geometry: string;
  remarks?: string;
  centroid: string;
  bulk_density: number;
  cut_volume: number;
  fill_volume: number;
  net_volume: number;
  cut_weight: number;
  fill_weight: number;
  net_weight: number;
  created_at?: Date | string;
  updated_at?: Date | string;
  base_reference: string;
  base_iteration?: string;
  included_in_kpi: boolean;
  material_type: HeapMaterialType;
  category: HeapCategory;
};

export type EditHeapPayload = HeapObj & {
  weight: number;
};

export type HeapObj = {
  id: string;
  name: string;
  remarks: string | null;
  bulkDensity: number | null;
  weight: number;
  materialType: string;
  category: string;
  includedInKpi: boolean;
};

export type HeapResponseDataTypeObj = {
  id: string;
  name: string;
  bulkDensity: number | null;
  baseReference: string;
  baseIteration?: string;
  createdAt?: Date | string;
  updateAt?: Date | string;
  cutVolume: number | null;
  fillVolume: number | null;
  netVolume: number | null;
  cutWeight: number | null;
  fillWeight: number | null;
  netWeight: number | null;
  geometry: string;
  remarks?: string;
  centroid: string;
  includedInKpi: boolean;
  materialType: HeapMaterialType;
  category: HeapCategory;
};

export type HeapListResponseDataObj = {
  data: HeapResponseDataTypeObj[];
};

export type HeapIdPayload = {
  id: string;
};

export type AddHeapBoundaryPayload = {
  name: string;
  iteration: string;
  status: number;
  remarks: string | null;
  bulkDensity: number | null;
  geometry: string;
  baseReference: string;
  baseIteration: string;
  materialType: string;
  category: string;
  includedInKpi: boolean;
};

export type AddHeapBoundaryResponse = Modify<
  Omit<HeapResponseDataType, 'centroid' | 'bulk_density' | 'weight'>,
  { status: number }
> & {
  iteration: string;
};

export type DownloadVolumeReportPayload = {
  heapIds: string[];
  responseFormat: VolumeReportFormat;
};
