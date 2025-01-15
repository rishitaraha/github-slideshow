import { SelectOption } from '@aus-platform/design-system';
import {
  HeapCategory,
  HeapMaterialType,
  IterationListItem,
} from '../../../../../../../shared/api';
import { WorkspaceLayer } from '../../../../shared';
import { HeapApiOptionType } from '../../types';

export type HeapInputFieldType = {
  otherIteration: SelectOption<IterationListItem> | null;
  baseReference: SelectOption;
  heapName: string;
  heapDescription: string | null;
  bulkDensity: number | null;
  materialType: SelectOption<HeapMaterialType>;
  category: SelectOption<HeapCategory>;
  includedInKpi: boolean;
  workspaceLayer: SelectOption<WorkspaceLayer> | null;
};

export type VolumeCalculationPropsType = Omit<
  HeapApiOptionType,
  'heapListResponse' | 'isHeapListLoading' | 'selectedHeaps'
>;
