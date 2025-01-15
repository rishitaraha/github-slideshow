import { BatchJobStatus } from '../shared/enums';
import { Map3DCapturedDsmLayerType } from './types';

export const capturedDsmLayerInitialData: Map3DCapturedDsmLayerType = {
  iterationId: '',
  name: '',
  isProcessing: false,
  sourceFilePath: '',
  createdAt: '',
  status: BatchJobStatus.Processing,
};
