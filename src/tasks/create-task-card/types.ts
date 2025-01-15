import { ProcessingStagesValue } from '../enums';
import { EPSGCode, VerticalCRS } from 'src/shared/enums';
import { CreateTaskPayload, Preset, Task } from 'src/shared/api';

export type CreateTaskCardProps = {
  color: string;
  tasksList: Task[];
  presetsList: Preset[];
  onCancel: VoidFunction;
  onStartProcessing: (taskDetails: CreateTaskPayload) => void;
  duplicatedTask?: Task;
};

export type PresetOption = Preset & { label: string };

export type TaskInputType = {
  taskName: string;
  taskOptions: PresetOption | null;
};

export type TaskConfigParams = {
  reoptimizeCamera: boolean;
  stopAfterReoptimize: boolean;
  disableContinueFromTask: boolean;
  isContinuedFromTask: boolean;
  endProcessingStage: EndProcessingSelectOption | null;
  taskContinuedFrom?: ContinuableTaskObjType;
};

export type EditTaskOptionsParamsType = {
  outputHorizontalCrs: EPSGCode;
  outputVerticalCrs: VerticalCRS;
  horizontalAccuracy: number;
  verticalAccuracy: number;
  keyPointLimit: number;
  tiePointLimit: number;
  splitInBlocks: boolean;
  blockWidth: number;
  blockHeight: number;
  generateReportWithCheckpoints: boolean;
};

export type InputCrsOptionsType = {
  geotagHorizontal: string | null;
  geotagVertical: string | null;
  gcpHorizontal: string | null;
  gcpVertical: string | null;
};

export type EndProcessingSelectOption = {
  label: JSX.Element;
  stage: number;
  value: ProcessingStagesValue;
};

export type ContinuableTaskObjType = {
  label: JSX.Element;
  value: string;
  taskName: string;
  endStage: ProcessingStagesValue;
};
