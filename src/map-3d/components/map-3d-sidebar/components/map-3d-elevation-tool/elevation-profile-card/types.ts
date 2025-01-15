import { Point } from 'chart.js';
import { LineRepresentation, Map3dElevationProfileState } from '../types';

export type ElevationProfileCardProps = {
  elevationProfile: Map3dElevationProfileState;
  iterationIds: string[];
  onClose: () => void;
  lineCoordinates?: LineRepresentation;
};

export type ElevationProfileData = {
  iteration: string;
  elevations: number[];
};

export type ElevationProfileChartData = {
  distancePoints: number[];
  elevationsList: Point[][];
  iterations: string[];
};

export type SlopeDetails = {
  deltaX: number;
  deltaY: number;
  slopeInDegree: number;
  slopeInPercentage: number;
};

export type ActiveElement = {
  datasetIndex: number;
  index: number;
};

export type CartesianPoint = {
  distance: number;
  elevation: number;
};

export type SlopeInfo = {
  pointA: ChartPoint;
  pointB: ChartPoint;
  slopeDetails: SlopeDetails | null;
};

export type ChartPoint = {
  point: CartesianPoint | null;
  lineIndex: number | null;
};
