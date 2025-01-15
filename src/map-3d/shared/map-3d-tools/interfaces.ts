import {
  FeatureInfoTool as CesiumFeatureInfoTool,
  Line,
  Polygon,
} from '@aus-platform/cesium';
import { Cartesian3 } from 'cesium';
import { ILineTool, IPolygonTool } from './drawing-tools';
import { ToolEvent } from './enums';
import { IInfoTool } from './action-tools';

export interface IMeasureTool {
  // Activation.
  activatePolygonDrawing: () => void;
  activateLineDrawing: () => void;
  activateInfoTool: () => void;

  // Deactivate.
  deactivateMeasureTool: () => void;
  deactivatePolygonDrawing: () => void;
  deactivateLineDrawing: () => void;
  deactivateInfoTool: () => void;

  // Modification.
  updateCurrentPolygon: ([]: [], polygon: Polygon[]) => void;
  updateCurrentLine: ([]: [], line: Line[]) => void;

  // Calculations.
  calculateArea: (polygonId: string) => number;
  calculatePerimeter: (positions: Cartesian3[]) => number;
  calculateDistance: (positions: Cartesian3[]) => number;
  getDistanceBetweenTwoCoordinates: (
    position1: Cartesian3,
    position2: Cartesian3,
  ) => number;
  initiatePolygonMeasurement: (polygon: Polygon) => void;
  initiateLineMeasurement: (line: Line) => void;

  // Deletion.
  deleteCurrentDrawnPolygon: () => void;
  deleteCurrentDrawnLine: () => void;
  deleteAllCurrentDrawnGeometries: () => void;
  deleteCurrentlyDrawingPolygon: () => void;
  deleteCurrentlyDrawingLine: () => void;

  // Reset.
  resetCurrentDrawing: () => void;

  //Event.
  eventLineEditing: () => void;
  eventPolygonEditing: () => void;
  eventRemoveModifyGeometry: () => void;

  // Listeners.
  polygonDrawingStarted: () => void;
  polygonDrawingEnded: () => void;
  lineDrawingStarted: () => void;
  lineDrawingEnded: () => void;

  // Getters.
  currentPolygon: Polygon;
  currentLine: Line;
  isAnyLineDrawn: boolean;
  isAnyPolygonDrawn: boolean;
  drawingIsActive: boolean;
  lineTool: ILineTool;
  polygonTool: IPolygonTool;
  infoTool: IInfoTool;

  // Setters.
  setPolygon: (polygon: Polygon) => void;
  setLine: (line: Line) => void;
}

export type FeatureInfoToolEventListener = {
  (featureId: [string], type): void;
};

export interface IFeatureInfoTool {
  activate: VoidFunction;
  deactivate: VoidFunction;

  // Event.
  addEventListener(
    type: ToolEvent,
    listener: FeatureInfoToolEventListener,
  ): void;
  removeEventListener(
    type: ToolEvent,
    listener: FeatureInfoToolEventListener,
  ): boolean;

  // Getters.
  featureInfoTool: CesiumFeatureInfoTool;
}
