import { forwardRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types'; // eslint-disable-line import/no-unresolved

import { BarChartOptions, BarChartProps } from './types';

export const BarChart = forwardRef<ChartJSOrUndefined<'bar'>, BarChartProps>(
  ({ data, options, stacked = false }, ref) => {
    // Options.
    const barChartOptions: BarChartOptions = {
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked,
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          mode: 'index',
        },
      },
      ...options,
    };

    return <Bar ref={ref} data={data} options={barChartOptions} />;
  },
);
