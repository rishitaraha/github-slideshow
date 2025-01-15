import { ChartData, ChartOptions } from 'chart.js';
import { ChartProps } from 'react-chartjs-2';

export type LineChartData = ChartData<'line'>;
export type LineChartOptions = ChartOptions<'line'>;

export type LineChartProps = Omit<ChartProps<'line'>, 'type'>;
