import { Pill, PillVariant } from '@aus-platform/design-system';
import { ProcessingStagesValue } from '../enums';
import { EndProcessingSelectOption } from './types';

export const ProcessingStages: EndProcessingSelectOption[] = [
  {
    value: ProcessingStagesValue.AlignPhotos,
    stage: 1,
    label: (
      <div className="processing-stage-dropdown">
        {'Align Photos'}
        <Pill variant={PillVariant.Success}>Stage 1</Pill>
      </div>
    ),
  },
  {
    value: ProcessingStagesValue.GeneratePointCloud,
    stage: 2,
    label: (
      <div className="processing-stage-dropdown">
        {'Generate Point Cloud'}
        <Pill variant={PillVariant.Success}>Stage 2 </Pill>
      </div>
    ),
  },
  {
    value: ProcessingStagesValue.GenerateOrthomosaic,
    stage: 3,
    label: (
      <div className="processing-stage-dropdown">
        {'Generate Orthomosaic'}
        <Pill variant={PillVariant.Success}>Stage 3</Pill>
      </div>
    ),
  },
];

export const EndStageToIndexMapping = {
  [ProcessingStagesValue.GenerateOrthomosaic]: ProcessingStages[2],
  [ProcessingStagesValue.GeneratePointCloud]: ProcessingStages[1],
  [ProcessingStagesValue.AlignPhotos]: ProcessingStages[0],
};
