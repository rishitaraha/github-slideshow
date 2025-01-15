import { Point, PointDrawingTools, StyleOptions } from '@aus-platform/cesium';
import { Feature } from '../../../../../shared/api';
import { ListenerTypes } from '../../types';
import { IBaseTool } from '../../base-tool';
import { PointEventType } from './enums';
import { PointToolEventListener } from './types';

export interface IPointTool extends IBaseTool {
  resetStyle();
  activate: (
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    enableDefaultListeners?: boolean,
  ) => void;
  deactivate: VoidFunction;
  getPoint: (id: string) => Point | null;
  /**
   * Adds a point to the point drawing tool at the specified longitude and latitude.
   * @param {number} longitude - The longitude of the point.
   * @param {number} latitude - The latitude of the point.
   * @returns {Point} Point object.
   *
   */
  addPoint: (longitude: number, latitude: number) => Point;
  deletePoint: (id: string) => void;
  deleteAllCurrentPoints: VoidFunction;
  deleteAllEditedPoints: VoidFunction;
  deleteAllLoadedPoints: VoidFunction;
  deleteAllPoints: VoidFunction;
  applyStyleToPoints: (styleOptions: StyleOptions, layerId?: string) => void;
  // TODO: Refactor params in aereo-cesium package.
  importWKT: (
    wktString: string,
    pointId: string,
    properties: Record<string, any>,
    pointLabel?: string,
    styleOptions?: StyleOptions,
  ) => Point[] | undefined;
  exportCurrentPointsToFeaturesArray: (layerId: string) => Feature[];
  exportEditedPointsToFeaturesArray: (layerId: string) => Feature[];
  exportDeletedPointIds: () => string[];
  checkUnsavedPoints: () => boolean;
  getPointsByProperty: (propertyKey: string, propertyValue: any) => Point[];
  toggleVisibility: (pointId: string) => void;
  pointHasProperty: (featureId: string, property: string) => boolean;
  destroy: VoidFunction;

  // Listeners.
  activateDefaultListeners: (listeners?: ListenerTypes) => void;
  removeDefaultListeners: VoidFunction;
  addEventListener(
    type: PointEventType,
    listener: PointToolEventListener,
  ): void;
  removeEventListener(
    type: PointEventType,
    listener: PointToolEventListener,
  ): void;

  // Getters.
  pointTool: PointDrawingTools;
  isActive: boolean;
}

export interface Points {
  [id: string]: Point;
}
