import { LayersOptionType } from '../../../shared/types';
import { Modify } from '../../../shared/type-utils';

export type RadioToggleGroupProps<T = string> = {
  radioOptions: Modify<LayersOptionType, { value: T }>[];
  onChange: (event) => void;
  checked: (string) => boolean;
  disabled?: (string) => boolean;
  className?: string;
  hideRadioOptions?: string[];
};
