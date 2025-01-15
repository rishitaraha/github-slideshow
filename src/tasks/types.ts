import { SelectOption } from '@aus-platform/design-system';
import { EPSGCode, ProcessingStatus, VerticalCRS } from 'shared/enums';
import { IterationDataset } from 'shared/api';

export type SelectedCrsOption = {
  horizontalCRS: SelectOption<EPSGCode> | null;
  verticalCRS: SelectOption<VerticalCRS> | null;
};

export type IterationDatasetContextType = {
  iterationDataset: IterationDataset;
  refetchIterationDataset: VoidFunction;
};

export type NoDataViewProps = {
  resourceName: 'Images' | 'Geotags' | 'Tasks';
  onClick: VoidFunction;
};

export type ProgressDetails = {
  progressStatus: ProcessingStatus;
  progressPercentage?: number;
};
