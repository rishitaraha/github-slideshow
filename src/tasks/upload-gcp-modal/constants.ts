import { GCPUploadAction } from '../enums';

export const uploadActionLabels = {
  [GCPUploadAction.REPLACE]: 'New GCPs will replace the existing ones.',
  [GCPUploadAction.APPEND]: 'New GCPs will be combined with the existing GCPs.',
};
