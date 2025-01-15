import { MouseEventHandler } from 'react';
import { ChartDataset, Point } from 'chart.js';
import { ChartPoint } from '..';

export type SlopePoints = {
  pointA: ChartPoint | null;
  pointB: ChartPoint | null;
};

export type ElevationProfileLineChartData = {
  xAxisData: number[];
  coordinatesData: Point[][];
  xAxisLabel: string;
  yAxisLabel: string;
  datasetLabels: string[];
  slopePoints: SlopePoints;
};

export type ElevationProfileLineChartProps = ElevationProfileLineChartData & {
  onClick: MouseEventHandler<HTMLCanvasElement>;
};

export type PrepareElevationChartDatasetArgs = Omit<
  ElevationProfileLineChartData,
  'xAxisLabel' | 'yAxisLabel'
>;

export type LineChartData = {
  labels: number[];
  datasets: ChartDataset<'line', Point[]>[];
  scale: Record<any, any>;
};

export type HighlightPointRef = {
  datasetIndex: number | null;
  dataIndex: number | null;
  point: Point;
};

export type PointWithIndex = {
  point: Point;
  index: number;
};
