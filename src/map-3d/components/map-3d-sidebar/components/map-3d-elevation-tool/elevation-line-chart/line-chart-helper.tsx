import { ColorCodes } from '@aus-platform/design-system';
import { ChartDataset, Point } from 'chart.js';
import { isEmpty, isNil, isNull } from 'lodash';
import {
  PointWithIndex,
  PrepareElevationChartDatasetArgs,
  SlopePoints,
} from './types';
import { binarySearchNearestValue } from 'shared/helpers';

const getColorForLine = (lineIndex: number) => {
  // const colorBarColors = [ColorBar1]
  const colors = [
    'rgba(92, 196, 250, 1)',
    'rgba(231, 153, 133, 1)',
    'rgba(145, 156, 239, 1)',
    'rgba(148, 234, 226, 1)',
    'rgba(80, 19, 180, 1)',
    'rgba(135, 213, 65, 1)',
    'rgba(65, 146, 152, 1)',
    'rgba(250, 223, 87, 1)',
    'rgba(236, 104, 161, 1)',
    'rgba(239, 137, 82, 1)',
    'rgba(165, 98, 52, 1)',
    'rgba(109, 218, 152, 1)',
    'rgba(101, 99, 99, 1)',
    'rgba(46, 99, 54, 1)',
    'rgba(130, 26, 18, 1)',
    'rgba(118, 21, 105, 1)',
    'rgba(136, 145, 44, 1)',
    'rgba(9, 33, 206, 1)',
    'rgba(109, 137, 151, 1)',
    'rgba(203, 117, 247, 1)',
  ];
  return colors[lineIndex % colors.length];
};

export const prepareElevationChartDataset = ({
  xAxisData,
  coordinatesData,
  datasetLabels,
  slopePoints,
}: PrepareElevationChartDatasetArgs) => {
  // Function to prepare line chart dataset.
  const getDataset = (slopePoints: SlopePoints) => {
    const dataset: ChartDataset<'line', Point[]>[] = [];
    for (let index = 0; index < coordinatesData.length; index++) {
      const lineColor = getColorForLine(index);
      dataset.push({
        label: datasetLabels[index],
        data: coordinatesData[index],
        borderColor: lineColor,
        backgroundColor: lineColor,
        hoverBackgroundColor: ColorCodes.White,
        hoverBorderColor: lineColor,
        pointHoverRadius: 5,

        // Highlighting selected points.
        pointBackgroundColor: (context) => {
          const { x: currentPoint } = coordinatesData[index][context.dataIndex];
          const { pointA, pointB } = slopePoints;
          const isPointAorBSelected =
            (index == pointA?.lineIndex &&
              currentPoint == pointA?.point?.distance) ||
            (index == pointB?.lineIndex &&
              currentPoint == pointB.point?.distance);

          if (isPointAorBSelected) {
            return ColorCodes.Red500;
          } else {
            // Same color for point as line's.
            return lineColor;
          }
        },
      });
    }

    if (slopePoints.pointA && slopePoints.pointB) {
      if (
        !isNil(slopePoints.pointA.point) &&
        !isNil(slopePoints.pointB.point)
      ) {
        const { distance: distanceA, elevation: elevationA } =
          slopePoints.pointA?.point;
        const { distance: distanceB, elevation: elevationB } =
          slopePoints.pointB.point;

        // Adding slope line.
        dataset.push({
          data: [
            {
              x: distanceA,
              y: elevationA,
            },
            {
              x: distanceB,
              y: elevationB,
            },
          ],
          borderColor: ColorCodes.Red500,
          backgroundColor: ColorCodes.Red500,
          pointHoverRadius: 5,
          animation: false,
          order: -1,
        });
      }
    }
    return dataset;
  };

  const lineChartData = {
    labels: xAxisData,
    datasets: getDataset(slopePoints),
    scale: {},
  };

  return lineChartData;
};

/**
 * Retrieves the nearest point on a line chart dataset based on a
 * given value.
 * @param {ChartDataset<'line', Point[]>} dataset - Dataset of the line.
 * @param {number} dataIndex - The index of the data point.
 * @param {number} xDataValue - The x value of coordinate data point, to find the nearest point on line relative.
 * @returns The function `getNearestPointOnLine` returns an object with two properties: `point` and
 * `index`. If the dataset data is not empty, it will call the `binarySearchNearestValue` function with the
 * dataset data array and the x value of the given coordinate data. If the dataset data is empty, it
 * will return an object with `point` set to `undefined` and
 */
export const getNearestPointOnLineForX = (
  dataset: ChartDataset<'line', Point[]>,
  xDataValue: number,
): PointWithIndex | null => {
  if (isEmpty(dataset.data)) {
    return null;
  }

  const dataArray: Point[] = dataset.data;
  const index = binarySearchNearestValue(
    dataArray.map((coordinate) => coordinate.x),
    xDataValue,
  );
  return {
    index: index,
    point: dataset.data[index],
  };
};

/**
 * It handles the display of a custom tooltip for a chart based on the provided context.
 * @param context - The `externalTooltipHandler` function you provided is responsible for handling the
 * display of a custom tooltip for a chart. It takes a `context` parameter which contains information
 * about the tooltip to be displayed.
 * @returns The `externalTooltipHandler` function returns nothing explicitly. It updates the tooltip
 * element's content and position based on the provided context data.
 */
export const externalTooltipHandler = (context) => {
  const { tooltip } = context;
  const tooltipEl = document.getElementById('chart-tooltip');

  if (isNull(tooltipEl)) {
    return;
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  const { dataset, parsed } = tooltip.dataPoints[0];

  const lineColor = tooltip.labelColors[0].backgroundColor;

  const title = dataset.label;

  const headerColorBlock: HTMLDivElement | null = tooltipEl.querySelector(
    '.elc-tooltip-header__color-block',
  );
  const headerTextElement: HTMLDivElement | null = tooltipEl.querySelector(
    '.elc-tooltip-header__text',
  );
  const bodyAltitudeElement: HTMLDivElement | null = tooltipEl.querySelector(
    '.elc-tooltip-body__value--altitude',
  );
  const bodyDistanceElement: HTMLDivElement | null = tooltipEl.querySelector(
    '.elc-tooltip-body__value--distance',
  );

  if (
    !isNull(headerColorBlock) &&
    !isNull(headerTextElement) &&
    !isNull(bodyDistanceElement) &&
    !isNull(bodyAltitudeElement)
  ) {
    headerColorBlock.style.backgroundColor = lineColor;
    headerTextElement.innerText = title;
    bodyDistanceElement.innerText = `${parsed.x} (m)`;
    bodyAltitudeElement.innerText = `${parsed.y} (m)`;
  }

  const { offsetWidth: tooltipWidth, offsetHeight: tooltipHeight } = tooltipEl;
  const { offsetLeft, offsetTop, offsetWidth } = context.chart.canvas;
  let tooltipX = offsetLeft + context.tooltip.caretX - tooltipWidth / 2;
  let tooltipY = offsetTop + context.tooltip.caretY - tooltipHeight - 10;

  tooltipX = Math.max(tooltipX, offsetLeft);
  tooltipX = Math.min(tooltipX, offsetLeft + offsetWidth - tooltipWidth);

  if (context.tooltip.caretY < tooltipHeight + 15) {
    tooltipY = offsetTop + context.tooltip.caretY + 15;
  }

  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = tooltipX + 'px';
  tooltipEl.style.top = tooltipY + 'px';
};
