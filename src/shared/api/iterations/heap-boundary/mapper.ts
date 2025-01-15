import { orderBy, round } from 'lodash';
import {
  AddHeapBoundaryPayload,
  HeapObj,
  HeapResponseDataType,
  HeapResponseDataTypeObj,
} from './types';

export const heapListResponseMapper = (
  payload: HeapResponseDataType[],
): HeapResponseDataTypeObj[] => {
  // Sorting with respect to the latest creation Date.
  const sortedPayload = orderBy(payload, 'created_at', 'desc');
  const res = sortedPayload.map((heap) => {
    return {
      id: heap.id,
      name: heap.name,
      geometry: heap.geometry,
      remarks: heap.remarks,
      centroid: heap.centroid,
      bulkDensity: heap.bulk_density,
      cutVolume: heap.cut_volume ? round(heap.cut_volume, 2) : null,
      fillVolume: heap.fill_volume ? round(heap.fill_volume, 2) : null,
      netVolume: heap.net_volume ? round(heap.net_volume, 2) : null,
      cutWeight: heap.cut_weight ? round(heap.cut_weight, 2) : null,
      fillWeight: heap.fill_weight ? round(heap.fill_weight, 2) : null,
      netWeight: heap.net_weight ? round(heap.net_weight, 2) : null,
      createdAt: heap.created_at,
      updatedAt: heap.updated_at,
      baseReference: heap.base_reference,
      baseIteration: heap.base_iteration,
      includedInKpi: heap.included_in_kpi,
      materialType: heap.material_type,
      category: heap.category,
    };
  });
  return res;
};

export const heapResponseMapper = (
  payload: HeapResponseDataType,
): HeapResponseDataTypeObj => {
  const res = {
    id: payload.id,
    name: payload.name,
    geometry: payload.geometry,
    remarks: payload.remarks,
    centroid: payload.centroid,
    bulkDensity: payload.bulk_density,
    cutVolume: payload.cut_volume ? round(payload.cut_volume, 2) : null,
    fillVolume: payload.fill_volume ? round(payload.fill_volume, 2) : null,
    netVolume: payload.net_volume ? round(payload.net_volume, 2) : null,
    cutWeight: payload.cut_weight ? round(payload.cut_weight, 2) : null,
    fillWeight: payload.fill_weight ? round(payload.fill_weight, 2) : null,
    netWeight: payload.net_weight ? round(payload.net_weight, 2) : null,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    baseReference: payload.base_reference,
    baseIteration: payload.base_iteration,
    materialType: payload.material_type,
    category: payload.category,
    includedInKpi: payload.included_in_kpi,
  };

  return res;
};

export const updateHeapPayloadMapper = (updatedHeap: HeapObj) => {
  const { bulkDensity, materialType, includedInKpi, ...rest } = updatedHeap;
  const res = {
    ...rest,
    bulk_density: bulkDensity,
    material_type: materialType,
    included_in_kpi: includedInKpi,
  };
  return res;
};

export const addHeapBoundaryPayloadMapper = (
  payload: AddHeapBoundaryPayload,
) => {
  const {
    bulkDensity,
    baseReference,
    baseIteration,
    materialType,
    includedInKpi,
    ...rest
  } = payload;

  const result = {
    ...rest,
    bulk_density: bulkDensity,
    base_reference: baseReference,
    base_iteration: baseIteration,
    material_type: materialType,
    included_in_kpi: includedInKpi,
  };

  return result;
};
