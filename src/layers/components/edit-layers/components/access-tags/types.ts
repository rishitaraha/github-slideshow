import { InputDirtyState } from '../../../../../shared/hooks';
import { AccessTagProps } from '../../../types';

export type EditLayerAccessTag = AccessTagProps & {
  dirty: InputDirtyState;
  setDirty: (dirty: InputDirtyState) => void;
};
