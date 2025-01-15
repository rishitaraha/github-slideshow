export type ChartCustomTooltipHeaderProps = {
  title?: string;
  lineColor?: string;
};

export type ChartCustomTooltipBodyProps = {
  x?: number;
  y?: number;
};

export type ChartCustomTooltipProps = {
  headerProps?: ChartCustomTooltipHeaderProps;
  bodyProps?: ChartCustomTooltipBodyProps;
};
