import { SelectOption } from '@aus-platform/design-system';
import { AccessType } from '../enums';

export const accessTypeOptions: SelectOption<AccessType>[] = [
  {
    label: 'Basic All Access',
    value: AccessType.Basic,
  },
  {
    label: 'Advanced Tag Based Access',
    value: AccessType.Advance,
  },
];
