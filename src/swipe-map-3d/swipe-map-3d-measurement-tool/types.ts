import { IMeasureTool } from 'src/map-3d/shared';

export type SwipeMap3DMeasureTool = {
  leftInstance: IMeasureTool;
  rightInstance: IMeasureTool;
};

export type SwipeMap3DSpotInfo = {
  latitude: string;
  longitude: string;
  leftIterationAltitude?: string;
  rightIterationAltitude?: string;
};
