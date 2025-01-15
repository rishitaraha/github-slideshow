import { ElevationProfileChartData } from './elevation-profile-card';

export type ElevationProfileError = {
  label: string;
  message: string;
};

export type Map3dElevationProfileState = {
  showElevationProfileModal: boolean;
  isElevationProfileModalEmpty: boolean;
  isElevationProfileModalLoading: boolean;
  expandElevationProfileModal: boolean;
  elevationProfileChartData: ElevationProfileChartData | null;
  elevationProfileError: ElevationProfileError | null;
};

export type LineRepresentation = Partial<{
  wkt: string;
  coordinateArray: string[][];
  featureId: string;
}>;
