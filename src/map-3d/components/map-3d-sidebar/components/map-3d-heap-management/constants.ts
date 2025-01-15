import { SelectOption } from '@aus-platform/design-system';
import {
  BaseReference,
  HeapCategory,
  HeapMaterialType,
} from '../../../../../shared/api';
import { Formatter } from '../../../../../shared/helpers';

export const heapTabs = {
  Draw: 'Draw',
  List: 'List',
  Guide: 'Guide',
};

export const baseReferenceLabel = {
  [BaseReference.VisibleGround]: 'Visible Ground',
  [BaseReference.OtherIterationDsm]: 'Other Iteration',
  [BaseReference.SiteBaseDsm]: 'Site Base DSM',
};

export const heapMaterialOptions: SelectOption<HeapMaterialType>[] = [
  {
    label: Formatter.toTitleCase(HeapMaterialType.Other),
    value: HeapMaterialType.Other,
  },
  {
    label: Formatter.toTitleCase(HeapMaterialType.Ore),
    value: HeapMaterialType.Ore,
  },
  {
    label: Formatter.toTitleCase(HeapMaterialType.Overburden),
    value: HeapMaterialType.Overburden,
  },
];

export const heapCategoryOptions: SelectOption<HeapCategory>[] = [
  {
    label: Formatter.toTitleCase(HeapCategory.Other, '_'),
    value: HeapCategory.Other,
  },
  {
    label: Formatter.toTitleCase(HeapCategory.ExcavatedVolume, '_'),
    value: HeapCategory.ExcavatedVolume,
  },
  {
    label: Formatter.toTitleCase(HeapCategory.IncrementalDumpVolume, '_'),
    value: HeapCategory.IncrementalDumpVolume,
  },
  {
    label: Formatter.toTitleCase(HeapCategory.StockVolume, '_'),
    value: HeapCategory.StockVolume,
  },
];
