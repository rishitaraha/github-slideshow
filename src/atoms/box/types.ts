import { PillSeriesVariant } from '../pill-series';

export type BoxProps = {
  header: string;
  text?: string;
  link?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  taskStages?: { variant: PillSeriesVariant; text: string }[];
};
