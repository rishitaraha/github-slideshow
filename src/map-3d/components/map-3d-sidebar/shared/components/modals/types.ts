import { SelectOption } from '@aus-platform/design-system';
import { IterationListItem, SiteListItem } from 'src/shared/api';

export type SelectTerrainInput = {
  site: SelectOption<SiteListItem> | null;
  iteration: SelectOption<IterationListItem> | null;
};
