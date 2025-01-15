import { ProcessingStagesValue } from '../enums';
import { PresetValue } from 'src/shared/api';

export type TaskOptionsModalProps = {
  show: boolean;
  taskEndStage?: ProcessingStagesValue;
  taskOptions: PresetValue;
  onClose: VoidFunction;
};
