import { Doughnut } from 'react-chartjs-2';

import { forwardRef } from 'react';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types'; // eslint-disable-line import/no-unresolved
import { DoughnutChartProps, DoughnutChartOptions } from '.';

export const DoughnutChart = forwardRef<
  ChartJSOrUndefined<'doughnut'>,
  DoughnutChartProps
>(({ data, options }, ref) => {
  // Options.
  const DoughnutChartOptions: DoughnutChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    ...options,
  };

  return <Doughnut ref={ref} data={data} options={DoughnutChartOptions} />;
});
