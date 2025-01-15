import { ChartData, ChartOptions } from 'chart.js';

export type BarChartData = ChartData<'bar'>;
export type BarChartOptions = ChartOptions<'bar'>;

export type BarChartProps = {
  data: BarChartData;
  stacked?: boolean;
  options?: BarChartOptions;
};
