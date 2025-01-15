import {
  CesiumViewer,
  ExportedWKTType,
  Polygon,
  PolygonDrawingTools,
  StyleOptions,
} from '@aus-platform/cesium';
import { isEmpty, isNil, isUndefined, unset } from 'lodash';
import { Feature, FeatureType } from '../../../../../shared/api';
import { GeometryType } from '../../../../../shared/cesium';
import { BaseTool } from '../../base-tool';
import { ListenerTypes } from '../../types';
import { defaultListenerTypes } from '../constants';
import { PolygonEventType } from './enums';
import { IPolygonTool, Polygons } from './polygon-tool-interface';
import { PolygonToolEventListener } from './types';

export class PolygonTool extends BaseTool implements IPolygonTool {
  private _loadedPolygons: Polygons = {};
  private _currentDrawnPolygons: Polygons = {};
  private _currentDirtyPolygons: Polygons = {};
  private _currentDeletedPolygonIds = {};
  private _viewer: CesiumViewer;

  private _polygonTool: PolygonDrawingTools;
  private _isActive = false;

  constructor(viewer: CesiumViewer) {
    super(viewer);

    this._viewer = viewer;
    this._polygonTool = this.viewer.drawingTools.polygonDrawingTools;
  }

  activate(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    enableEditing = false,
    enableDefaultListeners = true,
  ) {
    // Fix label size if label size property is not specified while activating it.
    const polygonToolProperties = {
      isLabelSizeFixed: true,
      ...properties,
    };

    this._isActive = true;
    this._polygonTool.activatePolygonDrawing(
      polygonToolProperties,
      styleOptions,
      { canDelete: true },
      { canSelect: true },
    );

    if (enableDefaultListeners) {
      this.activateDefaultListeners();
    }

    if (enableEditing) {
      this._polygonTool.polygonDrawing.enableSingleDrawing();
    } else {
      this._polygonTool.polygonDrawing.enableMultipleDrawing();
    }
  }

  deactivate() {
    this._isActive = false;
    this.removeDefaultListeners();
    this.viewer.deactivateCurrentMapTool();
  }

  getPolygon(id: string): Polygon | null {
    return this._polygonTool.getPolygon(id);
  }

  getPolygonByProperty(propertyKey: string, propertyValue: any) {
    return this._polygonTool.getPolygonsByProperty(propertyKey, propertyValue);
  }

  getAllPolygons(): Polygon[] {
    return Object.values(this._loadedPolygons);
  }

  deleteById(id: string) {
    this._polygonTool.deletePolygon(id);
    unset(this._currentDeletedPolygonIds, id);
  }

  deleteAllCurrentPolygons() {
    Object.values(this._currentDrawnPolygons).forEach((polygon) => {
      this._polygonTool.deletePolygon(polygon.id);
    });
    this._currentDrawnPolygons = {};
  }

  deleteAllEditedPolygons() {
    Object.values(this._currentDirtyPolygons).forEach((polygon) => {
      this._polygonTool.deletePolygon(polygon.id);
    });
    this._currentDirtyPolygons = {};
  }

  deleteAllLoadedPolygons() {
    Object.values(this._loadedPolygons).forEach((polygon) => {
      this._polygonTool.deletePolygon(polygon.id);
    });
    this._loadedPolygons = {};
  }

  deleteAllPolygons() {
    this.deleteAllCurrentPolygons();
    this.deleteAllEditedPolygons();
    this.deleteAllLoadedPolygons();
  }

  deletePolygonsByProperty(propertyKey: string, propertyValue: any) {
    const polygons = this.getPolygonByProperty(propertyKey, propertyValue);

    polygons.forEach((polygon) => {
      this.deleteById(polygon.id);
    });
  }

  batchDeletePolygons(polygonIds: string[]) {
    this.polygonTool.batchDeletePolygons(polygonIds);
  }

  resetCurrentDrawnArray(saveFeatures?: boolean) {
    if (saveFeatures) {
      Object.values(this._currentDrawnPolygons).forEach((polygon) => {
        this._loadedPolygons[polygon.id] = polygon;
      });
      this._currentDrawnPolygons = {};
    } else {
      this.deleteAllCurrentPolygons();
    }
  }

  resetCurrentEditArray(saveFeatures?: boolean) {
    if (saveFeatures) {
      Object.values(this._currentDirtyPolygons).forEach((polygon) => {
        this._loadedPolygons[polygon.id] = polygon;
      });
    }
    this._currentDirtyPolygons = {};
  }

  resetCurrentDeletedArray() {
    this._currentDeletedPolygonIds = {};
  }

  resetStyle() {
    this._polygonTool.polygonDrawing.resetDrawingStyle();
  }

  _refreshLoadedPolygons() {
    Object.values(this._loadedPolygons).forEach((polygon) => {
      this.importWKT(polygon.exportWKT().wkt, polygon.id, polygon.properties);
    });
  }

  importWKT(
    wktString: string,
    polygonId: string,
    properties: Record<string, any>,
    polygonLabel?: string,
    styleOptions?: StyleOptions,
  ) {
    const polygons = this._polygonTool.importWkt(
      [wktString],
      [polygonId],
      [polygonLabel],
      [properties],
      styleOptions,
    );

    // Add all imported WKT polygons to loaded polygons.
    if (!isUndefined(polygons) && !isEmpty(polygons)) {
      polygons.forEach((polygon) => {
        this._loadedPolygons[polygon.id] = polygon;
      });
    }
    return polygons;
  }

  exportCurrentPolygonsToWkt(): ExportedWKTType[] {
    const exportedArray: ExportedWKTType[] = [];
    Object.values(this._currentDrawnPolygons).forEach((polygon) => {
      exportedArray.push(polygon.exportWKT());
    });

    return exportedArray;
  }

  exportCurrentPolygonsToFeaturesArray(layerId: string): Feature[] {
    const featuresArray: Feature[] = [];

    Object.values(this._currentDrawnPolygons).forEach((polygon) => {
      const wktArray = this._polygonTool.exportWKT([polygon.id]);

      if (wktArray && wktArray[0].wkt) {
        const feature: any = {
          id: polygon.id,
          layer: layerId,
          geometry: wktArray[0].wkt,
          type: FeatureType.Polygon,
        };
        feature.feature = polygon;
        featuresArray.push(feature);
      }
    });

    return featuresArray;
  }

  exportEditedPolygonsToFeaturesArray(layerId: string): Feature[] {
    const featuresArray: Feature[] = [];

    Object.values(this._currentDirtyPolygons).forEach((polygon) => {
      const wktArray = this._polygonTool.exportWKT([polygon.id]);

      if (wktArray && wktArray[0].wkt) {
        const feature: Feature = {
          id: polygon.id,
          layer: layerId,
          type: FeatureType.Polygon,
          geometry: wktArray[0].wkt,
        };

        feature.feature = polygon;
        featuresArray.push(feature);
      }
    });

    return featuresArray;
  }

  exportDeletedPolygonIds(): string[] {
    return Object.keys(this._currentDeletedPolygonIds);
  }

  applyStyleToPolygons(layerId: string, styleOptions: StyleOptions) {
    const polygons = this.getPolygonByProperty('layerId', layerId);
    this._polygonTool.polygonDrawing.setStyleOptions(styleOptions);
    if (polygons.length > 0) {
      polygons.forEach((polygon) => {
        polygon.changeStyle(styleOptions);
      });
    }
  }

  polygonHasProperty(featureId: string, property: string) {
    return !isNil(this.getPolygon(featureId)?.properties[property]);
  }

  /**
   * To export polygon(s) on Cesium as GeoJson String.
   */
  exportPolygonToGeoJSON(polygonId: string) {
    return this._viewer.exportGeometryToGeoJson(
      polygonId,
      GeometryType.Polygon,
    );
  }

  checkUnsavedPolygons(): boolean {
    return (
      Object.keys(this._currentDrawnPolygons).length > 0 ||
      Object.keys(this._currentDirtyPolygons).length > 0
    );
  }

  exportWkt(polygonIds: string[]) {
    return this._polygonTool.exportWKT(polygonIds);
  }

  exportMultiPolygonWkt(polygonIds: string[]) {
    return this._polygonTool.exportMultiPolygonWKT(polygonIds);
  }

  toggleVisibility(polygonId: string) {
    this._polygonTool.toggleVisibility(polygonId);
  }

  // Listeners.
  private _defaultPolygonCreatedListener(polygon: Polygon[]) {
    if (isUndefined(this._currentDrawnPolygons[polygon[0].id])) {
      this._currentDrawnPolygons[polygon[0].id] = polygon[0];
    }

    // Remove newly drawn polygon from dirty polygons array if any.
    if (!isUndefined(this._currentDirtyPolygons[polygon[0].id])) {
      delete this._currentDirtyPolygons[polygon[0].id];
    }
  }

  private _defaultPolygonEditedListener(_, polygon: Polygon[]) {
    if (isUndefined(this._currentDirtyPolygons[polygon[0].id])) {
      this._currentDirtyPolygons[polygon[0].id] = polygon[0];
    }
  }

  private _defaultPolygonDeletedListener(idArray: string[]) {
    // Remove deleted polygon from drawn polygons array if any.
    if (!isUndefined(this._currentDrawnPolygons[idArray[0]])) {
      delete this._currentDrawnPolygons[idArray[0]];
    }

    // Remove deleted polygon from dirty polygons array if any.
    if (!isUndefined(this._currentDirtyPolygons[idArray[0]])) {
      delete this._currentDirtyPolygons[idArray[0]];
    }

    // Remove deleted polygon from loaded polygons array if any.
    if (!isUndefined(this._loadedPolygons[idArray[0]])) {
      delete this._loadedPolygons[idArray[0]];
    }

    if (isUndefined(this._currentDeletedPolygonIds[idArray[0]])) {
      this._currentDeletedPolygonIds[idArray[0]] = idArray[0];
    }
  }

  activateDefaultListeners(listeners: ListenerTypes = defaultListenerTypes) {
    if (listeners.create) {
      this._polygonTool.polygonDrawing.eventPolygonCreated.addEventListener(
        this._defaultPolygonCreatedListener,
        this,
      );
    }

    if (listeners.edit) {
      this._polygonTool.polygonDrawing.eventVertexAddedInPolygon.addEventListener(
        this._defaultPolygonEditedListener,
        this,
      );
      this._polygonTool.polygonDrawing.eventVertexModifiedInPolygon.addEventListener(
        this._defaultPolygonEditedListener,
        this,
      );
      this._polygonTool.polygonDrawing.eventVertexDeletedInPolygon.addEventListener(
        this._defaultPolygonEditedListener,
        this,
      );
    }

    if (listeners.delete) {
      this._polygonTool.polygonDeleted.addEventListener(
        this._defaultPolygonDeletedListener,
        this,
      );
    }
  }

  removeDefaultListeners() {
    this._polygonTool.polygonDrawing.eventPolygonCreated.removeEventListener(
      this._defaultPolygonCreatedListener,
      this,
    );

    this._polygonTool.polygonDrawing.eventVertexAddedInPolygon.removeEventListener(
      this._defaultPolygonEditedListener,
      this,
    );
    this._polygonTool.polygonDrawing.eventVertexModifiedInPolygon.removeEventListener(
      this._defaultPolygonEditedListener,
      this,
    );
    this._polygonTool.polygonDrawing.eventVertexDeletedInPolygon.removeEventListener(
      this._defaultPolygonEditedListener,
      this,
    );
    this._polygonTool.polygonDeleted.removeEventListener(
      this._defaultPolygonDeletedListener,
      this,
    );
  }

  addEventListener(type: PolygonEventType, listener: PolygonToolEventListener) {
    switch (type) {
      case PolygonEventType.DrawingStarted: {
        return this._polygonTool.polygonDrawing.eventPolygonDrawingStarted.addEventListener(
          listener,
        );
      }
      case PolygonEventType.DrawingEnd: {
        return this._polygonTool.polygonDrawing.eventPolygonDrawingEnd.addEventListener(
          listener,
        );
      }
      case PolygonEventType.DashedLineDeleted: {
        return this._polygonTool.polygonDrawing.eventDashedLineDeleted.addEventListener(
          listener,
        );
      }
      case PolygonEventType.PolygonCreated: {
        return this._polygonTool.polygonDrawing.eventPolygonCreated.addEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  removeEventListener(
    type: PolygonEventType,
    listener: PolygonToolEventListener,
  ) {
    switch (type) {
      case PolygonEventType.DrawingStarted: {
        return this._polygonTool.polygonDrawing.eventPolygonDrawingStarted.removeEventListener(
          listener,
        );
      }
      case PolygonEventType.DrawingEnd: {
        return this._polygonTool.polygonDrawing.eventPolygonDrawingEnd.removeEventListener(
          listener,
        );
      }
      case PolygonEventType.DashedLineDeleted: {
        return this._polygonTool.polygonDrawing.eventDashedLineDeleted.removeEventListener(
          listener,
        );
      }
      case PolygonEventType.PolygonCreated: {
        return this._polygonTool.polygonDrawing.eventPolygonCreated.removeEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  // Getters.
  get currentDrawnPolygons() {
    return this._currentDrawnPolygons;
  }

  get currentDrawnPolygonIds() {
    return Object.keys(this._currentDrawnPolygons);
  }

  get polygonTool() {
    return this.viewer.drawingTools.polygonDrawingTools;
  }

  get isActive() {
    return this._isActive;
  }

  get isAnyPolygonDrawn() {
    return Object.values(this._currentDrawnPolygons).length > 0;
  }

  get isAnyPolygonLoaded() {
    return Object.values(this._loadedPolygons).length > 0;
  }

  get loadedFeatureIds() {
    return Object.keys(this._loadedPolygons);
  }

  // Deletes only polygons drawn/edited by this polygon tool.
  destroy() {
    this.deactivate();
    this.resetCurrentDeletedArray();
    this.deleteAllPolygons();
    this._polygonTool.destroy();
  }
}
