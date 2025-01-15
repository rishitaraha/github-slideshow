import { useMemo, forwardRef } from 'react';

import { ChartEvent } from 'chart.js';
import { Line } from 'react-chartjs-2';

import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types'; // eslint-disable-line import/no-unresolved
import { LineChartOptions, LineChartProps } from '.';

export const LineChart = forwardRef<ChartJSOrUndefined<'line'>, LineChartProps>(
  ({ data, options, ...rest }, ref) => {
    const lineChartOptions: LineChartOptions = useMemo(
      () => ({
        onHover: (event: ChartEvent, chartElement) => {
          if (event && event.native && event.native.target) {
            (event.native.target as HTMLCanvasElement).style.cursor =
              chartElement[0] ? 'pointer' : 'default';
          }
        },

        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            mode: 'index',
          },
        },

        ...options,
      }),
      [],
    );

    return <Line options={lineChartOptions} data={data} ref={ref} {...rest} />;
  },
);
