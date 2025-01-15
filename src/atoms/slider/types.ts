import { SliderProps } from 'rc-slider';

export type SliderComponentProps = SliderProps & {
  tipFormatter?: (value: number) => React.ReactNode;
  tipProps?: any;
  dataTestId?: string;
};
