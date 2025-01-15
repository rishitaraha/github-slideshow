import { ActiveElement, Chart, ChartEvent, Point } from 'chart.js';
import { isEmpty, isNull, isUndefined } from 'lodash';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import {
  ElevationProfileLineChartProps,
  HighlightPointRef,
  LineChartData,
} from './types';
import {
  externalTooltipHandler,
  getNearestPointOnLineForX,
  prepareElevationChartDataset,
} from './line-chart-helper';
import {
  ChartCustomTooltip,
  LineChart,
  LineChartOptions,
  highlightPointPlugin,
} from 'shared/components';
import { selectElevationTool } from 'map-3d/shared/map-3d-slices';
import { useAppSelector } from 'app/hooks';

const highlightedPointInitialValue: Point = {
  x: NaN,
  y: NaN,
};

export const ElevationLineChart = forwardRef<
  Chart<'line'>,
  ElevationProfileLineChartProps
>(
  (
    {
      xAxisData,
      xAxisLabel,
      yAxisLabel,
      coordinatesData,
      datasetLabels,
      slopePoints,
      ...rest
    },
    ref,
  ) => {
    // Refs.
    const highlightPointRef = useRef<HighlightPointRef>({
      datasetIndex: null,
      dataIndex: null,
      point: highlightedPointInitialValue,
    });

    // Variables.
    const lineChartData = prepareElevationChartDataset({
      xAxisData,
      coordinatesData,
      datasetLabels,
      slopePoints,
    });

    // States.
    const [chartData, setChartData] = useState<LineChartData>(lineChartData);

    // Selectors.
    const { lineTool } = useAppSelector(selectElevationTool);

    // useEffects.
    useEffect(() => {
      if (slopePoints) {
        const lineChartData = prepareElevationChartDataset({
          xAxisData,
          coordinatesData,
          datasetLabels,
          slopePoints,
        });

        setChartData(lineChartData);
      }
    }, [slopePoints]);

    // Handlers.
    const onClickChartHandler = (
      _event: ChartEvent,
      chartDataPoints: ActiveElement[],
      chart: Chart,
    ) => {
      if (isEmpty(chartDataPoints)) {
        highlightPointRef.current = {
          point: highlightedPointInitialValue,
          datasetIndex: null,
          dataIndex: null,
        };
        removeHighlighPointFromMap();
        chart.update();
      } else {
        const chartDataPoint =
          chartData.datasets[chartDataPoints[0].datasetIndex].data[
            chartDataPoints[0].index
          ];

        if (chartDataPoint) {
          const point = { x: chartDataPoint.x, y: chartDataPoint.y };
          highlightPointRef.current = {
            point,
            dataIndex: chartDataPoints[0].index,
            datasetIndex: chartDataPoints[0].datasetIndex,
          };
          highlighPointOnMap(point);
        }
      }
    };

    const onHoverChartHandler = (
      event: ChartEvent,
      chartDataPoints: ActiveElement[],
      chart: Chart,
    ) => {
      const chartPoint = chartDataPoints[0];
      let { dataIndex, datasetIndex } = highlightPointRef.current;
      let point: Point | null = null;

      // Change cursor style if hover on chart data point.
      if (event && event.native && event.native.target) {
        (event.native.target as HTMLCanvasElement).style.cursor = chartPoint
          ? 'pointer'
          : 'default';
      }

      if (isNaN(highlightPointRef.current.point.x)) {
        return;
      }

      // If hovering on chart data point and highlight point is enabled,
      // Then update the values of point and dataIndex.
      if (chartPoint?.datasetIndex === datasetIndex || isNull(datasetIndex)) {
        const chartDataPoint =
          chartData.datasets[chartPoint.datasetIndex].data[chartPoint.index];

        if (chartDataPoint) {
          point = chartDataPoint;
          dataIndex = chartPoint.index;

          datasetIndex = isNull(datasetIndex)
            ? chartPoint.datasetIndex
            : datasetIndex;
        }
      }
      // Else if hovering outside of line on chart and highlight point is enabled,
      // Then find the nearest data point and update the values of point and dataIndex.
      else if (!isNull(event.x) && !isNull(event.y)) {
        const xDataValue = chart.scales.x.getValueForPixel(event.x);

        if (!isNull(datasetIndex) && !isUndefined(xDataValue)) {
          const nearestPointResult = getNearestPointOnLineForX(
            chartData.datasets[datasetIndex],
            xDataValue,
          );

          if (!isNull(nearestPointResult)) {
            point = nearestPointResult.point;
            dataIndex = nearestPointResult.index;
          }
        }
      }

      if (!isNull(point)) {
        highlighPointOnMap(point);
        highlightPointRef.current = {
          dataIndex,
          point,
          datasetIndex,
        };
      }

      chart.update('none');
    };

    // Helpers.
    const highlighPointOnMap = (point: { x: number; y: number }) => {
      const line = lineTool?.getLines()[0];

      if (!isUndefined(line)) {
        line.saveHighlightPoint(point.x);
      }
    };

    const removeHighlighPointFromMap = () => {
      const line = lineTool?.getLines()[0];

      if (!isUndefined(line)) {
        line.removeHighlightPoint();
      }
    };

    // Custom options.
    const options: LineChartOptions = useMemo(
      () => ({
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: xAxisLabel,
            },
          },
          y: {
            title: {
              display: true,
              text: yAxisLabel,
            },
          },
        },
        onClick: onClickChartHandler,
        onHover: onHoverChartHandler,
        plugins: {
          highlightPoint: {
            getHighlightPoint: () => highlightPointRef.current.point,
          },
          zoom: {
            limits: {
              x: { min: 'original', max: 'original' },
            },
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: 'x',
            },
          },

          legend: {
            position: 'bottom',
            labels: {
              filter: (item) => item.text !== undefined,
            },
          },

          tooltip: {
            enabled: false,
            external: externalTooltipHandler,
            displayColors: true,
          },
        },
      }),
      [xAxisLabel, yAxisLabel],
    );

    return (
      <>
        <LineChart
          options={options}
          data={chartData}
          ref={ref}
          plugins={[highlightPointPlugin]}
          {...rest}
        />
        <ChartCustomTooltip />
      </>
    );
  },
);

export default ElevationLineChart;
