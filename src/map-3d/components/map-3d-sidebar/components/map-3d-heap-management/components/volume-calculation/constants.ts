import { SelectOption } from '@aus-platform/design-system';
import { BaseReference } from '../../../../../../../shared/api/iterations/heap-boundary/enums';
import {
  baseReferenceLabel,
  heapCategoryOptions,
  heapMaterialOptions,
} from '../../constants';

import { HeapInputFieldType } from './types';

export const baseReferenceOptions: SelectOption[] = [
  {
    label: baseReferenceLabel[BaseReference.VisibleGround],
    value: BaseReference.VisibleGround,
  },
  {
    label: baseReferenceLabel[BaseReference.SiteBaseDsm],
    value: BaseReference.SiteBaseDsm,
  },
  {
    label: baseReferenceLabel[BaseReference.OtherIterationDsm],
    value: BaseReference.OtherIterationDsm,
  },
];

export const heapInitialState: HeapInputFieldType = {
  otherIteration: null,
  baseReference: baseReferenceOptions[0],
  heapName: '',
  heapDescription: null,
  bulkDensity: null,
  materialType: heapMaterialOptions[0],
  category: heapCategoryOptions[0],
  includedInKpi: false,
  workspaceLayer: null,
};
