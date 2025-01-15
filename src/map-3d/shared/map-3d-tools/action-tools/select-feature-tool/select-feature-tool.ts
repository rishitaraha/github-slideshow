import {
  SelectFeatureTool as CesiumSelectFeatureTool,
  CesiumViewer,
  DrawingTools,
  FeatureInfoType,
  GEOMETRY_TYPE,
  Line,
  Point,
  Polygon,
  SelectFeature,
  Textbox,
} from '@aus-platform/cesium';
import { findIndex, isEmpty, isUndefined } from 'lodash';
import { GeometryType } from '../../../../../shared/cesium';
import { BaseTool } from '../../base-tool/base-tool';
import { ISelectFeatureTool } from './select-feature-tool-interface';
import { SelectToolEventType } from './enums';
import { SelectToolEventListener } from './types';

export class SelectFeatureTool extends BaseTool implements ISelectFeatureTool {
  private _currentSelectedFeatures: (Line | Polygon | Point | Textbox)[] = [];
  private _selectFeature: SelectFeature;
  private _selectFeatureTool: CesiumSelectFeatureTool;
  private _viewer: CesiumViewer;

  constructor(viewer: CesiumViewer) {
    super(viewer);
    this._viewer = viewer;
    this._selectFeatureTool = this.viewer.selectTools.selectFeatureTool;
    this._selectFeature =
      this.viewer.selectTools.selectFeatureTool.selectFeature;
  }

  activate(selectOptions: Record<string, any>, enableDefaultListeners = true) {
    this.viewer.deactivateCurrentMapTool();
    if (enableDefaultListeners) {
      this.activateDefaultListeners();
    }
    this._selectFeatureTool.activateSelectFeature(selectOptions);
  }

  deactivate() {
    this.deselectSelectedFeatures();
    this.viewer.deactivateCurrentMapTool();
    this._selectFeatureTool.destroy();
  }

  resetSelectedFeatures() {
    this._currentSelectedFeatures = [];
  }

  deleteSelectedFeatures() {
    this._selectFeature.deleteAllSelectedFeatures();
  }

  deselectSelectedFeatures() {
    for (const feature of this._currentSelectedFeatures) {
      const featureInfo: FeatureInfoType = {
        id: feature.id,
        type: GEOMETRY_TYPE.POLYGON,
      };

      if (feature instanceof Line) {
        featureInfo.type = GEOMETRY_TYPE.LINE;
      } else if (feature instanceof Point) {
        featureInfo.type = GEOMETRY_TYPE.POINT;
      } else if (feature instanceof Textbox) {
        featureInfo.type = GEOMETRY_TYPE.TEXT;
      }

      this._selectFeature.deselectFeature(featureInfo);
    }
    this.resetSelectedFeatures();
  }

  // Listeners.
  private _defaultSelectFeatureListener(featureInfoArray: FeatureInfoType[]) {
    if (!isUndefined(featureInfoArray) && !isEmpty(featureInfoArray)) {
      const featureInfo = featureInfoArray[0];
      switch (featureInfo.type.toString()) {
        case GeometryType.Polygon: {
          const polygon =
            this.viewer.drawingTools.polygonDrawingTools.getPolygon(
              featureInfo.id,
            );
          if (
            polygon &&
            findIndex(this._currentSelectedFeatures, { id: polygon.id }) === -1
          ) {
            this._currentSelectedFeatures.push(polygon);
          }
          break;
        }
        case GeometryType.Line: {
          const line = this.viewer.drawingTools.lineDrawingTools.getLine(
            featureInfo.id,
          );
          if (
            line &&
            findIndex(this._currentSelectedFeatures, { id: line.id }) === -1
          ) {
            this._currentSelectedFeatures.push(line);
          }
          break;
        }
        case GeometryType.Point: {
          const point = this.viewer.drawingTools.pointDrawingTools.getPoint(
            featureInfo.id,
          );
          if (
            point &&
            findIndex(this._currentSelectedFeatures, { id: point.id }) === -1
          ) {
            this._currentSelectedFeatures.push(point);
          }
          break;
        }
        case GeometryType.Textbox: {
          const textbox = this.viewer.textTool.textDraw.getTextboxById(
            featureInfo.id,
          );
          if (
            textbox &&
            findIndex(this._currentSelectedFeatures, { id: textbox.id }) === -1
          ) {
            this._currentSelectedFeatures.push(textbox);
          }
          break;
        }
      }
    }
  }

  activateDefaultListeners() {
    this._selectFeatureTool.selectFeature.eventFeatureSelected.addEventListener(
      this._defaultSelectFeatureListener,
      this,
    );
  }

  removeDefaultListeners() {
    this._selectFeatureTool.selectFeature.eventFeatureSelected.removeEventListener(
      this._defaultSelectFeatureListener,
      this,
    );
  }

  addEventListener(
    type: SelectToolEventType,
    listener: SelectToolEventListener,
  ) {
    switch (type) {
      case SelectToolEventType.FeatureSelected: {
        return this._selectFeature.eventFeatureSelected.addEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  removeEventListener(
    type: SelectToolEventType,
    listener: SelectToolEventListener,
  ) {
    switch (type) {
      case SelectToolEventType.FeatureSelected: {
        return this._selectFeature.eventFeatureSelected.removeEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  get selectedFeatures(): (Line | Polygon | Point | Textbox)[] {
    return this._currentSelectedFeatures;
  }

  get selectedFeatureCount(): number {
    return this._currentSelectedFeatures.length;
  }

  get selectFeatureTool() {
    return this._selectFeatureTool;
  }

  get drawingTools(): DrawingTools {
    if (this.viewer.drawingTools) {
      throw Error('Drawing Tools are not initialized');
    }
    return this.viewer.drawingTools;
  }

  destroy() {
    this._selectFeatureTool.destroy();
  }
}
