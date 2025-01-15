import {
  CesiumViewer,
  Point,
  PointDrawingTools,
  StyleOptions,
} from '@aus-platform/cesium';
import { Cartesian3 } from 'cesium';
import { isEmpty, isNil, isUndefined } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Feature, FeatureType } from '../../../../../shared/api';
import { BaseTool } from '../../base-tool';
import { ListenerTypes } from '../../types';
import { defaultListenerTypes } from '../constants';
import { PointEventType } from './enums';
import { IPointTool, Points } from './point-tool-interface';
import { PointToolEventListener } from './types';

export class PointTool extends BaseTool implements IPointTool {
  private _loadedPoints: Points = {};
  private _currentDrawnPoints: Points = {};
  private _currentDirtyPoints: Points = {};
  private _currentDeletedPointIds = {};
  private _pointTool: PointDrawingTools;
  private _isActive = false;

  constructor(viewer: CesiumViewer) {
    super(viewer);
    this._pointTool = this.viewer.drawingTools.pointDrawingTools;
  }

  activate(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    enableDefaultListeners = true,
  ) {
    this._isActive = true;
    this._pointTool.activatePointDrawing(
      properties,
      styleOptions,
      { canDelete: true },
      { canSelect: true },
    );
    if (enableDefaultListeners) {
      this.activateDefaultListeners();
    }
  }

  addPoint(longitude: number, latitude: number): Point {
    const pointId = uuidv4();
    const position = Cartesian3.fromDegrees(longitude, latitude, 5000);
    const point = this._pointTool.pointDrawing.addPoint(position, pointId);
    this._loadedPoints[pointId] = point;
    return point;
  }

  getPointsByProperty(propertyKey: string, propertyValue: any) {
    return this._pointTool.getPointsByProperty(propertyKey, propertyValue);
  }

  getPoint(id: string): Point | null {
    return this._pointTool.getPoint(id);
  }

  deletePoint(id: string) {
    this._pointTool.deletePoint(id);
  }

  deleteAllCurrentPoints() {
    Object.values(this._currentDrawnPoints).forEach((point) => {
      this._pointTool.deletePoint(point.id);
    });
    this._currentDrawnPoints = {};
  }

  deleteAllEditedPoints() {
    Object.values(this._currentDirtyPoints).forEach((point) => {
      this._pointTool.deletePoint(point.id);
    });
    this._currentDirtyPoints = {};
  }

  deleteAllLoadedPoints() {
    Object.values(this._loadedPoints).forEach((point) => {
      this._pointTool.deletePoint(point.id);
    });
    this._loadedPoints = {};
  }

  deleteAllPoints() {
    this.deleteAllCurrentPoints();
    this.deleteAllEditedPoints();
    this.deleteAllLoadedPoints();
  }

  resetCurrentDrawnArray(saveFeatures?: boolean) {
    if (saveFeatures) {
      Object.values(this._currentDrawnPoints).forEach((point) => {
        this._loadedPoints[point.id] = point;
      });
      this._currentDrawnPoints = {};
    } else {
      this.deleteAllCurrentPoints();
    }
  }

  resetCurrentEditArray(saveFeatures?: boolean) {
    if (saveFeatures) {
      Object.values(this._currentDirtyPoints).forEach((point) => {
        this._loadedPoints[point.id] = point;
      });
    }
    this._currentDirtyPoints = {};
  }

  resetCurrentDeletedArray() {
    this._currentDeletedPointIds = {};
  }

  resetStyle() {
    this._pointTool.pointDrawing.resetDrawingStyle();
  }

  applyStyleToPoints(styleOptions: StyleOptions, layerId?: string) {
    let points: Point[] = [];

    if (!isUndefined(layerId)) {
      points = this.getPointsByProperty('layerId', layerId);
    } else {
      points = Object.values(this._loadedPoints);
    }

    this._pointTool.pointDrawing.setStyleOptions(styleOptions);

    if (points.length > 0) {
      points.forEach((point) => {
        point.changeStyle(styleOptions);
      });
    }
  }

  importWKT(
    wktString: string,
    pointId: string,
    properties: Record<string, any>,
    pointLabel?: string | undefined,
    styleOptions?: StyleOptions | undefined,
  ): Point[] | undefined {
    const points = this._pointTool.importWkt(
      [wktString],
      [pointId],
      [pointLabel],
      [properties],
      styleOptions,
    );
    if (!isUndefined(points) && !isEmpty(points)) {
      points.forEach((point) => {
        this._loadedPoints[point.id] = point;
      });
    }
    return points;
  }

  exportCurrentPointsToFeaturesArray(layerId: string): Feature[] {
    const featuresArray: Feature[] = [];
    Object.values(this._currentDrawnPoints).forEach((point) => {
      const wktArray = this._pointTool.exportWKT([point.id]);
      if (wktArray && wktArray[0].wkt) {
        const feature: Feature = {
          id: point.id,
          layer: layerId,
          geometry: wktArray[0].wkt,
          type: FeatureType.Point,
        };
        feature.feature = point;
        featuresArray.push(feature);
      }
    });

    return featuresArray;
  }

  exportEditedPointsToFeaturesArray(layerId: string): Feature[] {
    const featuresArray: Feature[] = [];
    Object.values(this._currentDirtyPoints).forEach((point) => {
      const wktArray = this._pointTool.exportWKT([point.id]);
      if (wktArray && wktArray[0].wkt) {
        const feature: Feature = {
          id: point.id,
          layer: layerId,
          geometry: wktArray[0].wkt,
          type: FeatureType.Point,
        };
        feature.feature = point;
        featuresArray.push(feature);
      }
    });

    return featuresArray;
  }

  exportDeletedPointIds(): string[] {
    return Object.keys(this._currentDeletedPointIds);
  }

  checkUnsavedPoints(): boolean {
    return (
      Object.keys(this._currentDrawnPoints).length > 0 ||
      Object.keys(this._currentDirtyPoints).length > 0
    );
  }

  toggleVisibility(pointId: string) {
    this._pointTool.toggleVisibility(pointId);
  }

  pointHasProperty(featureId: string, property: string) {
    return !isNil(this.getPoint(featureId)?.properties[property]);
  }

  // Listeners.
  private _defaultPointCreatedListener(points: Point[]) {
    if (isEmpty(points)) {
      return;
    }

    if (isUndefined(this._currentDrawnPoints[points[0].id])) {
      this._currentDrawnPoints[points[0].id] = points[0];
    }

    if (!isUndefined(this._currentDirtyPoints[points[0].id])) {
      delete this._currentDirtyPoints[points[0].id];
    }
  }

  private _defaultPointEditedListener(point: Point[]) {
    // TODO: Figure out why select tool calls this listener with undefined point (i.e [undefined]).
    if (
      !isEmpty(point) &&
      !isNil(point[0]) &&
      isUndefined(this._currentDirtyPoints?.[point[0]?.id])
    ) {
      this._currentDirtyPoints[point[0].id] = point[0];
    }
  }

  private _defaultPointDeletedListener(idArray: string[]) {
    // Remove deleted point from drawn points array if any.
    if (!isUndefined(this._currentDrawnPoints[idArray[0]])) {
      delete this._currentDrawnPoints[idArray[0]];
    }

    // Remove deleted point from dirty points array if any.
    if (!isUndefined(this._currentDirtyPoints[idArray[0]])) {
      delete this._currentDirtyPoints[idArray[0]];
    }

    // Remove deleted point from loaded points array if any.
    if (!isUndefined(this._loadedPoints[idArray[0]])) {
      delete this._loadedPoints[idArray[0]];
    }

    if (isUndefined(this._currentDeletedPointIds[idArray[0]])) {
      this._currentDeletedPointIds[idArray[0]] = idArray[0];
    }
  }

  activateDefaultListeners(listeners: ListenerTypes = defaultListenerTypes) {
    if (listeners.create) {
      this._pointTool.pointDrawing.eventPointCreated.addEventListener(
        this._defaultPointCreatedListener,
        this,
      );
    }

    if (listeners.edit) {
      this._pointTool.pointDrawing.eventPointReleased.addEventListener(
        this._defaultPointEditedListener,
        this,
      );
    }

    if (listeners.delete) {
      this._pointTool.pointDrawing.eventPointDeleted.addEventListener(
        this._defaultPointDeletedListener,
        this,
      );
    }
  }

  removeDefaultListeners() {
    this._pointTool.pointDrawing.eventPointCreated.removeEventListener(
      this._defaultPointCreatedListener,
      this,
    );

    this._pointTool.pointDrawing.eventPointDeleted.removeEventListener(
      this._defaultPointDeletedListener,
      this,
    );
  }

  addEventListener(type: PointEventType, listener: PointToolEventListener) {
    switch (type) {
      case PointEventType.PointCreated: {
        return this._pointTool.pointDrawing.eventPointCreated.addEventListener(
          listener,
        );
      }
      case PointEventType.PointDeleted: {
        return this._pointTool.pointDrawing.eventPointCreated.addEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  removeEventListener(type: PointEventType, listener: PointToolEventListener) {
    switch (type) {
      case PointEventType.PointCreated: {
        return this._pointTool.pointDrawing.eventPointCreated.removeEventListener(
          listener,
        );
      }
      case PointEventType.PointDeleted: {
        return this._pointTool.pointDrawing.eventPointCreated.removeEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  // Getters.
  get pointTool() {
    return this.viewer.drawingTools.pointDrawingTools;
  }
  get isActive() {
    return this._isActive;
  }

  get loadedFeatureIds() {
    return Object.keys(this._loadedPoints);
  }

  deactivate() {
    this._isActive = false;
    this.removeDefaultListeners();
    this.viewer.deactivateCurrentMapTool();
  }

  destroy() {
    this.deactivate();
    this.resetCurrentDeletedArray();
    this.deleteAllPoints();
    this._pointTool.destroy();
  }
}
