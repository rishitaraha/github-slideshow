import { CesiumViewer, StyleOptions } from '@aus-platform/cesium';
import { isNil } from 'lodash';
import { Feature } from '../../../../shared/api';
import { IDrawingTools } from './interfaces';
import { ILineTool, LineTool } from './line-tool';
import { IPointTool, PointTool } from './point-tool';
import { IPolygonTool, PolygonTool } from './polygon-tool';
import { ITextboxTool, TextboxTool } from './textbox-tool';

export class DrawingTools implements IDrawingTools {
  // Viewer.
  private readonly _viewer: CesiumViewer;

  // Tools.
  private _polygonTool: IPolygonTool | null;
  private _lineTool: ILineTool | null;
  private _pointTool: IPointTool | null;
  private _textboxTool: ITextboxTool | null;

  // CurrentActiveTool.
  private _currentActiveTool!:
    | IPolygonTool
    | ILineTool
    | IPointTool
    | ITextboxTool
    | null;

  constructor(viewer: CesiumViewer) {
    this._viewer = viewer;
    this._polygonTool = new PolygonTool(viewer);
    this._lineTool = new LineTool(viewer);
    this._pointTool = new PointTool(viewer);
    this._textboxTool = new TextboxTool(viewer);
  }

  activatePolygonTool(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
  ) {
    this.pointTool.deactivate();
    this._lineTool?.deactivate();
    this._textboxTool?.deactivate();
    this._polygonTool?.activate(properties, styleOptions);
    this._currentActiveTool = this.polygonTool;
  }

  activateLineTool(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
  ) {
    this._polygonTool?.deactivate();
    this._pointTool?.deactivate();
    this._textboxTool?.deactivate();
    this._lineTool?.activate(properties, styleOptions);
    this._currentActiveTool = this._lineTool;
  }

  activatePointTool(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
  ) {
    this._polygonTool?.deactivate();
    this._lineTool?.deactivate();
    this._textboxTool?.deactivate();
    this._pointTool?.activate(properties, styleOptions);
    this._currentActiveTool = this._pointTool;
  }

  activateTextboxTool(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
  ) {
    this._polygonTool?.deactivate();
    this._lineTool?.deactivate();
    this.pointTool.deactivate();
    this._textboxTool?.activate(properties, styleOptions);
    this._currentActiveTool = this._textboxTool;
  }

  activateEditingListeners() {
    const editListenerArgument = {
      create: false,
      edit: true,
      delete: true,
    };

    this._polygonTool?.activateDefaultListeners(editListenerArgument);
    this._lineTool?.activateDefaultListeners(editListenerArgument);
    this._pointTool?.activateDefaultListeners(editListenerArgument);
    this._textboxTool?.activateDefaultListeners(editListenerArgument);
  }

  deactivateCurrentTool() {
    this._currentActiveTool?.deactivate();
    this._currentActiveTool = null;
  }

  deactivateAllTools() {
    this._polygonTool?.deactivate();
    this._lineTool?.deactivate();
    this._pointTool?.deactivate();
    this._textboxTool?.deactivate();
  }

  resetStyles() {
    this._polygonTool?.resetStyle();
    this._lineTool?.resetStyle();
    this._pointTool?.resetStyle();
    this._textboxTool?.resetStyle();
  }

  deleteAllFeatures() {
    this._polygonTool?.deleteAllPolygons();
    this._lineTool?.deleteAllLines();
    this._pointTool?.deleteAllPoints();
    this._textboxTool?.deleteAllTextboxes();
  }

  resetAllDrawnFeatureArrays(save = false) {
    this._polygonTool?.resetCurrentDrawnArray(save);
    this._lineTool?.resetCurrentDrawnArray(save);
    this._pointTool?.resetCurrentDrawnArray(save);
    this._textboxTool?.resetCurrentDrawnArray(save);
  }

  resetAllEditedFeatureArrays(save = false) {
    this._polygonTool?.resetCurrentEditArray(save);
    this._lineTool?.resetCurrentEditArray(save);
    this._pointTool?.resetCurrentEditArray(save);
    this._textboxTool?.resetCurrentEditArray(save);
  }

  resetAllDeletedFeatureArrays() {
    this._polygonTool?.resetCurrentDeletedArray();
    this._lineTool?.resetCurrentDeletedArray();
    this._pointTool?.resetCurrentDeletedArray();
    this._textboxTool?.resetCurrentDeletedArray();
  }

  resetAllUnsavedFeatures(save = false) {
    this.resetAllDeletedFeatureArrays();
    this.resetAllEditedFeatureArrays(save);
    this.resetAllDrawnFeatureArrays(save);
  }

  exportNewFeatures = (layerId: string): Feature[] => {
    const polygonFeatures: Feature[] =
      this.polygonTool.exportCurrentPolygonsToFeaturesArray(layerId);
    const lineFeatures: Feature[] =
      this.lineTool.exportCurrentLinesToFeaturesArray(layerId);
    const pointFeatures: Feature[] =
      this.pointTool.exportCurrentPointsToFeaturesArray(layerId);
    const textBoxFeatures: Feature[] =
      this.textboxTool.exportCurrentTextboxesToFeaturesArray(layerId);

    const features: Feature[] = [
      ...pointFeatures,
      ...lineFeatures,
      ...polygonFeatures,
      ...textBoxFeatures,
    ];
    return features;
  };

  exportEditedFeatures = (layerId: string): Feature[] => {
    const polygonFeatures: Feature[] =
      this.polygonTool.exportEditedPolygonsToFeaturesArray(layerId);
    const lineFeatures: Feature[] =
      this.lineTool.exportEditedLinesToFeaturesArray(layerId);
    const pointFeatures: Feature[] =
      this.pointTool.exportEditedPointsToFeaturesArray(layerId);
    const textBoxFeatures: Feature[] =
      this.textboxTool.exportEditedTextBoxesToFeaturesArray(layerId);

    const features: Feature[] = [
      ...polygonFeatures,
      ...lineFeatures,
      ...pointFeatures,
      ...textBoxFeatures,
    ];

    return features;
  };

  exportDeletedFeatureIds = (): string[] => {
    const polygonIds: string[] = this.polygonTool.exportDeletedPolygonIds();
    const lineIds: string[] = this.lineTool.exportDeletedLineIds();
    const pointIds: string[] = this.pointTool.exportDeletedPointIds();
    const textBoxIds: string[] = this.textboxTool.exportDeletedTextboxIds();
    const featuresIds: string[] = [
      ...polygonIds,
      ...lineIds,
      ...pointIds,
      ...textBoxIds,
    ];

    return featuresIds;
  };

  applyStylesToFeatures(layerId: string, styleOptions: StyleOptions) {
    this.polygonTool.applyStyleToPolygons(layerId, styleOptions);
    this.lineTool.applyStyleToLines(layerId, styleOptions);
    this.pointTool.applyStyleToPoints(styleOptions, layerId);
    this.textboxTool.applyStyleToTextboxes(layerId, styleOptions);
  }

  featureHasProperty(featureId: string, property: string) {
    const featureHasProperty =
      (this._polygonTool?.polygonHasProperty(featureId, property) ||
        this._pointTool?.pointHasProperty(featureId, property) ||
        this._lineTool?.lineHasProperty(featureId, property) ||
        this._textboxTool?.textboxHasProperty(featureId, property)) ??
      false;

    return featureHasProperty;
  }

  featureExists(featureId: string) {
    const feature =
      this._polygonTool?.getPolygon(featureId) ||
      this._pointTool?.getPoint(featureId) ||
      this._lineTool?.getLine(featureId) ||
      this._textboxTool?.getTextbox(featureId);

    return !isNil(feature);
  }

  checkUnsavedFeatures() {
    return (
      this._polygonTool?.checkUnsavedPolygons() ||
      this._lineTool?.checkUnsavedLines() ||
      this._pointTool?.checkUnsavedPoints() ||
      this._textboxTool?.checkUnsavedTextboxes()
    );
  }

  // To clear all drawing tools' arrays and remove all features from Cesium.
  resetState() {
    this.deactivateCurrentTool();
    this.resetAllDrawnFeatureArrays();
    this.resetAllEditedFeatureArrays();
    this.resetAllDeletedFeatureArrays();
    this.resetStyles();
    this.deleteAllFeatures();
  }

  destroy() {
    this._polygonTool?.destroy();
    this._pointTool?.destroy();
    this._lineTool?.destroy();
    this._textboxTool?.destroy();
  }

  get polygonTool() {
    if (isNil(this._polygonTool)) {
      throw new Error('Polygon tool is not initialized');
    }

    return this._polygonTool;
  }

  get lineTool() {
    if (isNil(this._lineTool)) {
      throw new Error('Line tool is not initialized');
    }

    return this._lineTool;
  }

  get pointTool() {
    if (isNil(this._pointTool)) {
      throw new Error('Point tool is not initialized');
    }

    return this._pointTool;
  }

  get textboxTool() {
    if (isNil(this._textboxTool)) {
      throw new Error('Textbox tool is not initialized');
    }

    return this._textboxTool;
  }

  get currentActiveTool() {
    return this._currentActiveTool;
  }

  get loadedFeatureIds() {
    return [
      ...this.pointTool.loadedFeatureIds,
      ...this.lineTool.loadedFeatureIds,
      ...this.polygonTool.loadedFeatureIds,
      ...this.textboxTool.loadedFeatureIds,
    ];
  }
}
