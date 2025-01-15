import { SelectOption } from '@aus-platform/design-system';
import { AreaCategory } from 'shared/api';

export const areaCategoryOptions: SelectOption<AreaCategory>[] = [
  { value: AreaCategory.Other, label: 'Other (O)' },
  {
    value: AreaCategory.PlannedAndActive,
    label: 'Planned & Active (P/A)',
  },
  {
    value: AreaCategory.PlannedAndInactive,
    label: 'Planned & Inactive (P/I)',
  },
  {
    value: AreaCategory.UnplannedAndActive,
    label: 'Unplanned & Active (U/A)',
  },
  {
    value: AreaCategory.UnplannedAndActiveBeyondCriticalBoundary,
    label: 'Unplanned & Active - Beyond Critical Boundary (U/A-BCB)',
  },
];

export const areaCategoryPillLabel = {
  [AreaCategory.Other]: 'O',
  [AreaCategory.PlannedAndActive]: 'P/A',
  [AreaCategory.PlannedAndInactive]: 'P/I',
  [AreaCategory.UnplannedAndActive]: 'U/A',
  [AreaCategory.UnplannedAndActiveBeyondCriticalBoundary]: 'U/A-BCB',
};
