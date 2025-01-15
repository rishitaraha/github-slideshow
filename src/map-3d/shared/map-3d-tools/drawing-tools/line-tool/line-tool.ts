import {
  CesiumViewer,
  ExportedWKTType,
  Line,
  LineDrawingTools,
  StyleOptions,
} from '@aus-platform/cesium';
import { isEmpty, isNil, isUndefined, unset } from 'lodash';
import { Feature, FeatureType } from '../../../../../shared/api';
import { BaseTool } from '../../base-tool';
import { ListenerTypes } from '../../types';
import { defaultListenerTypes } from '../constants';
import { getCartographicDegreeFromCartesian } from '../helpers';
import { LineEventType } from './enums';
import { ILineTool, Lines } from './line-tool-interface';
import { LineToolEventListener } from './types';

export class LineTool extends BaseTool implements ILineTool {
  private _loadedLines: Lines = {};
  private _currentDrawnLines: Lines = {};
  private _currentDirtyLines: Lines = {};
  private _currentDeletedLineIds = {};

  private _lineTool: LineDrawingTools;
  private _isActive = false;

  constructor(viewer: CesiumViewer) {
    super(viewer);
    this._lineTool = this.viewer.drawingTools.lineDrawingTools;
  }

  activate(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    enableEditing = false,
    enableDefaultListeners = true,
  ) {
    // Fix label size if label size property is not specified while activating it.
    const lineToolProperties = {
      isLabelSizeFixed: true,
      ...properties,
    };

    this._isActive = true;

    this._lineTool.activateLineDrawing(
      lineToolProperties,
      styleOptions,
      { canDelete: true },
      { canSelect: true },
    );

    if (enableDefaultListeners) {
      this.activateDefaultListeners();
    }

    if (enableEditing) {
      this._lineTool.lineDrawing.enableSingleDrawing();
    } else {
      this._lineTool.lineDrawing.enableMultipleDrawing();
    }
  }

  getLinesByProperty(propertyKey: string, propertyValue: any) {
    return this._lineTool.getLinesByProperty(propertyKey, propertyValue);
  }

  getLine(id: string): Line | null {
    return this._lineTool.getLine(id);
  }

  getLines(): Line[] {
    return [
      ...Object.values(this.currentDrawnLines),
      ...Object.values(this._loadedLines),
    ];
  }

  enableSingleLineDrawing() {
    this._lineTool.lineDrawing.enableSingleDrawing();
  }

  deleteLine(id: string) {
    this._lineTool.deleteLine(id);
  }

  deleteAllCurrentLines() {
    Object.values(this._currentDrawnLines).forEach((line) => {
      this._lineTool.deleteLine(line.id);
    });
    this._currentDrawnLines = {};
  }

  deleteAllEditedLines() {
    Object.values(this._currentDirtyLines).forEach((line) => {
      this._lineTool.deleteLine(line.id);
    });
    this._currentDirtyLines = {};
  }

  deleteAllLoadedLines() {
    Object.values(this._loadedLines).forEach((line) => {
      this._lineTool.deleteLine(line.id);
    });
    this._loadedLines = {};
  }

  deleteAllLines() {
    this.deleteAllCurrentLines();
    this.deleteAllEditedLines();
    this.deleteAllLoadedLines();
  }

  deleteById(id: string) {
    this._lineTool.deleteLine(id);
    /**
     * @TODO - Fix captureEvents working.
     * Events are captured even when captureEvents is set to false while activating.
     * This is b/c this._captureEvents is initialised as true.
     */
    unset(this._currentDeletedLineIds, id);
  }

  resetCurrentDrawnArray(saveFeatures?: boolean) {
    if (saveFeatures) {
      Object.values(this._currentDrawnLines).forEach((line) => {
        this._loadedLines[line.id] = line;
      });
      this._currentDrawnLines = {};
    } else {
      this.deleteAllCurrentLines();
    }
  }

  resetCurrentEditArray(saveFeatures?: boolean) {
    if (saveFeatures) {
      Object.values(this._currentDirtyLines).forEach((line) => {
        this._loadedLines[line.id] = line;
      });
    }
    this._currentDirtyLines = {};
  }

  resetCurrentDeletedArray() {
    this._currentDeletedLineIds = {};
  }

  resetStyle() {
    this._lineTool.lineDrawing.resetDrawingStyle();
  }

  importWKT(
    wktString: string,
    lineId: string,
    properties: Record<string, any>,
    lineLabel?: string,
    styleOptions?: StyleOptions,
  ): Line[] | undefined {
    const lines = this._lineTool.importWkt(
      [wktString],
      [lineId],
      [lineLabel],
      [properties],
      styleOptions,
    );

    if (!isUndefined(lines) && !isEmpty(lines)) {
      lines.forEach((line) => {
        this._loadedLines[line.id] = line;
      });
    }
    return lines;
  }

  exportCurrentLinesToWKT(): ExportedWKTType[] {
    const exportedArray: ExportedWKTType[] = [];
    Object.values(this._currentDrawnLines).forEach((line) => {
      exportedArray.push(line.exportWKT());
    });

    return exportedArray;
  }

  exportCurrentLinesToFeaturesArray(layerId: string): Feature[] {
    const featuresArray: Feature[] = [];
    Object.values(this._currentDrawnLines).forEach((line) => {
      const wktArray = this._lineTool.exportWKT([line.id]);
      if (wktArray && wktArray[0].wkt) {
        const feature: Feature = {
          id: line.id,
          layer: layerId,
          geometry: wktArray[0].wkt,
          type: FeatureType.LineString,
        };
        feature.feature = line;
        featuresArray.push(feature);
      }
    });

    return featuresArray;
  }

  exportEditedLinesToFeaturesArray(layerId: string): Feature[] {
    const featuresArray: Feature[] = [];

    Object.values(this._currentDirtyLines).forEach((line) => {
      const wktArray = this._lineTool.exportWKT([line.id]);

      if (wktArray && wktArray[0].wkt) {
        const feature: any = {
          id: line.id,
          layer: layerId,
          geometry: wktArray[0].wkt,
        };

        feature.feature = line;
        featuresArray.push(feature);
      }
    });

    return featuresArray;
  }

  exportDeletedLineIds(): string[] {
    return Object.keys(this._currentDeletedLineIds);
  }

  applyStyleToLines(layerId: string, styleOptions: StyleOptions) {
    const lines = this.getLinesByProperty('layerId', layerId);
    this._lineTool.lineDrawing.setStyleOptions(styleOptions);
    if (lines.length > 0) {
      lines.forEach((line) => {
        line.changeStyle(styleOptions);
      });
    }
  }

  checkUnsavedLines(): boolean {
    return (
      Object.keys(this._currentDrawnLines).length > 0 ||
      Object.keys(this._currentDirtyLines).length > 0
    );
  }

  toggleVisibility(lineId: string) {
    this._lineTool.toggleVisibility(lineId);
  }

  lineHasProperty(featureId: string, property: string) {
    return !isNil(this.getLine(featureId)?.properties[property]);
  }

  // Listeners.
  private _defaultLineCreatedListener(line: Line[]) {
    if (isUndefined(this._currentDrawnLines[line[0].id])) {
      this._currentDrawnLines[line[0].id] = line[0];
    }

    // Remove newly drawn line from dirty lines array if any.
    if (!isUndefined(this._currentDirtyLines[line[0].id])) {
      delete this._currentDirtyLines[line[0].id];
    }
  }

  private _defaultLineEditedListener(_, line: Line[]) {
    if (isUndefined(this._currentDirtyLines[line[0].id])) {
      this._currentDirtyLines[line[0].id] = line[0];
    }
  }

  private _defaultLineDeletedListener(idArray: string[]) {
    // Remove deleted line from drawn lines array if any.
    if (!isUndefined(this._currentDrawnLines[idArray[0]])) {
      delete this._currentDrawnLines[idArray[0]];
    }

    // Remove deleted line from dirty lines array if any.
    if (!isUndefined(this._currentDirtyLines[idArray[0]])) {
      delete this._currentDirtyLines[idArray[0]];
    }

    // Remove deleted line from loaded lines array if any.
    if (!isUndefined(this._loadedLines[idArray[0]])) {
      delete this._loadedLines[idArray[0]];
    }

    if (isUndefined(this._currentDeletedLineIds[idArray[0]])) {
      this._currentDeletedLineIds[idArray[0]] = idArray[0];
    }
  }

  activateDefaultListeners(listeners: ListenerTypes = defaultListenerTypes) {
    if (listeners.create) {
      // Store newly drawn line.
      this._lineTool.lineDrawing.eventLineCreated.addEventListener(
        this._defaultLineCreatedListener,
        this,
      );
    }

    if (listeners.edit) {
      // Capture edited lines.
      this._lineTool.lineDrawing.eventVertexAddedInLine.addEventListener(
        this._defaultLineEditedListener,
        this,
      );
      this._lineTool.lineDrawing.eventVertexModifiedInLine.addEventListener(
        this._defaultLineEditedListener,
        this,
      );
      this._lineTool.lineDrawing.eventVertexDeletedInLine.addEventListener(
        this._defaultLineEditedListener,
        this,
      );
    }
    if (listeners.delete) {
      // Capture deleted lines.
      this._lineTool.lineDeleted.addEventListener(
        this._defaultLineDeletedListener,
        this,
      );
    }
  }

  removeDefaultListeners() {
    this._lineTool.lineDrawing.eventLineCreated.removeEventListener(
      this._defaultLineCreatedListener,
      this,
    );

    this._lineTool.lineDrawing.eventVertexAddedInLine.removeEventListener(
      this._defaultLineEditedListener,
      this,
    );
    this._lineTool.lineDrawing.eventVertexModifiedInLine.removeEventListener(
      this._defaultLineEditedListener,
      this,
    );
    this._lineTool.lineDrawing.eventVertexDeletedInLine.removeEventListener(
      this._defaultLineEditedListener,
      this,
    );
    this._lineTool.lineDeleted.removeEventListener(
      this._defaultLineDeletedListener,
      this,
    );
  }

  addEventListener(type: LineEventType, listener: LineToolEventListener) {
    switch (type) {
      case LineEventType.LineCreated: {
        return this._lineTool.lineDrawing.eventLineCreated.addEventListener(
          listener,
        );
      }
      case LineEventType.DrawingStarted: {
        return this._lineTool.lineDrawing.eventLineDrawingStarted.addEventListener(
          listener,
        );
      }
      case LineEventType.DrawingEnd: {
        return this._lineTool.lineDrawing.eventLineDrawingEnd.addEventListener(
          listener,
        );
      }
      case LineEventType.DashedLineDeleted: {
        return this._lineTool.lineDrawing.eventDashedLineDeleted.addEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  removeEventListener(type: LineEventType, listener: LineToolEventListener) {
    switch (type) {
      case LineEventType.LineCreated: {
        return this._lineTool.lineDrawing.eventLineCreated.removeEventListener(
          listener,
        );
      }
      case LineEventType.DrawingStarted: {
        return this._lineTool.lineDrawing.eventLineDrawingStarted.removeEventListener(
          listener,
        );
      }
      case LineEventType.DrawingEnd: {
        return this._lineTool.lineDrawing.eventLineDrawingEnd.removeEventListener(
          listener,
        );
      }
      case LineEventType.DashedLineDeleted: {
        return this._lineTool.lineDrawing.eventDashedLineDeleted.removeEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  // Getters.
  get currentDrawnLines() {
    return this._currentDrawnLines;
  }

  get currentDrawnLineIds() {
    return Object.keys(this._currentDrawnLines);
  }

  get lineTool() {
    return this.viewer.drawingTools.lineDrawingTools;
  }

  get isActive() {
    return this._isActive;
  }

  get isAnyLineDrawn() {
    return Object.values(this._currentDrawnLines).length > 0;
  }

  get loadedFeatureIds() {
    return Object.keys(this._loadedLines);
  }

  getCartographicPositions(line: Line) {
    return line.positions.map(getCartographicDegreeFromCartesian);
  }

  deactivate() {
    this._isActive = false;
    this.removeDefaultListeners();
    this.viewer.deactivateCurrentMapTool();
  }

  destroy() {
    this.deactivate();
    this.resetCurrentDeletedArray();
    this.deleteAllLines();
    this._lineTool.destroy();
  }
}
