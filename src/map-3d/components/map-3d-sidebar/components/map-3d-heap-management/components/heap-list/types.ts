import { HeapApiOptionType } from '../../types';

export type SelectedHeapType = Record<
  string,
  {
    name: string;
    geometry: string;
    centroid: string;
    cutVolume: number | null;
    fillVolume: number | null;
    netVolume: number | null;
    cutWeight: number | null;
    fillWeight: number | null;
    netWeight: number | null;
    bulkDensity: number | null;
  }
>;

export type HeapListPropsType = HeapApiOptionType;

export type HeapDeleteConfirmationType = {
  show: boolean;
  index: number;
};

export type ShiftKeyRangeSelectedHeapType = {
  startingIndex: number;
  endingIndex: number;
  isStartHeapSelected: boolean;
};
