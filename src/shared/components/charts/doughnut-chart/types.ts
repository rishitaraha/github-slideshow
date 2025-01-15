import { ChartData, ChartOptions } from 'chart.js';

export type DoughnutChartData = ChartData<'doughnut'>;
export type DoughnutChartOptions = ChartOptions<'doughnut'>;

export type DoughnutChartProps = {
  data: DoughnutChartData;
  options?: DoughnutChartOptions;
};
