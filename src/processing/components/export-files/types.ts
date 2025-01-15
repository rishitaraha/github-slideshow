import { SelectOption } from '@aus-platform/design-system';

export type ExportFileFormInputType = {
  isOrthoExported: boolean;
  isDsmExported: boolean;
  orthoLayerName: string;
  project: SelectOption<string> | null;
  site: SelectOption<string> | null;
  iteration: SelectOption<string> | null;
};
