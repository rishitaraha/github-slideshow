import {
  EditTaskOptionsParamsType,
  PresetOption,
} from '../create-task-card/types';

export type TaskOptionsEditModalProps = {
  onClose: () => void;
  onSave: (values: EditTaskOptionsParamsType) => void;
  taskOptions: PresetOption | null;
};
