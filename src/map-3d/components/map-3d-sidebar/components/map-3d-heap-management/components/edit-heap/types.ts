import { SelectOption } from '@aus-platform/design-system';
import {
  HeapCategory,
  HeapMaterialType,
} from '../../../../../../../shared/api';

export type InitialInputStateType = {
  name: string;
  description: string;
  bulkDensity: number | null;
  category: SelectOption<HeapCategory>;
  materialType: SelectOption<HeapMaterialType>;
  includedInKpi: boolean;
};

export type EditHeapProps = {
  onClose: () => void;
  heapId: string;
  refetchHeapList: () => void;
  show: boolean;
};
