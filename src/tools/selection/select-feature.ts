import { destroyObject, Event, Scene } from 'cesium';
import { CesiumViewerType, FeatureStatus, FeatureType } from '../../types';
import { clearArray, GEOMETRY_TYPE, getFeature } from '../../utils';
import { MapTool, MouseEvent } from '../base';
import { ExportedWKTType } from '../drawing/types';
import { SelectMode } from '../base/enums';
import { FeatureInfoType, SelectFeatureConstructorOptions } from './types';
import { isIncludeProperty } from '../../utils/common';

export class SelectFeature extends MapTool {
  private _mode: SelectMode;
  private _selectedFeatures: FeatureInfoType[];
  private _editableFeatureInfo?: FeatureInfoType;

  private readonly _scene: Scene;
  private readonly _options: SelectFeatureConstructorOptions;
  private readonly _eventFeatureSelected: Event;
  private readonly _eventFeatureDeselected: Event;
  private readonly _eventFeatureDeleted: Event;
  private readonly _eventFeatureAllDeleted: Event;
  private readonly _eventReset: Event;

  // Select option
  private _selectOption?: Record<string, any>;

  constructor(options: SelectFeatureConstructorOptions) {
    super(options);

    this._viewer = options.viewer;
    this._mode = SelectMode.None;
    this._scene = this._viewer.scene;
    this._options = options;
    this._selectedFeatures = options.selectedFeatures;
    this._eventFeatureSelected = new Event();
    this._eventFeatureDeselected = new Event();
    this._eventFeatureDeleted = new Event();
    this._eventFeatureAllDeleted = new Event();
    this._eventReset = new Event();
  }

  get options() {
    return this._options;
  }

  get mode() {
    return this._mode;
  }

  set mode(value: SelectMode) {
    this._mode = value;
  }

  get selectedFeatures() {
    return this._selectedFeatures;
  }

  set selectedFeatures(features: FeatureInfoType[]) {
    this._selectedFeatures = features;
  }

  get editableFeatureInfo() {
    return this._editableFeatureInfo;
  }

  get eventFeatureSelected() {
    return this._eventFeatureSelected;
  }

  get eventFeatureDeselected() {
    return this._eventFeatureDeselected;
  }

  get eventFeatureDelected() {
    return this._eventFeatureDeleted;
  }

  get eventFeatureAllDeleted() {
    return this._eventFeatureAllDeleted;
  }

  get eventReset() {
    return this._eventReset;
  }

  get selectOption() {
    return this._selectOption;
  }

  set selectOption(option: Record<string, any> | undefined) {
    this._selectOption = option;
  }

  activate() {
    super.activate();
    this._mode = SelectMode.Select;
    return true;
  }

  deactivate() {
    super.deactivate();
    // this._mode = SelectMode.None;
  }

  isExistInSelected(selectedFeature: FeatureInfoType) {
    const filteredFeature = this._selectedFeatures.filter(
      (feature) => feature.id === selectedFeature.id,
    );
    return filteredFeature.length > 0;
  }

  getFeatureInfoById(selectedId: string) {
    const filteredFeature = this._selectedFeatures.find(
      (feature) => feature.id === selectedId,
    );
    return filteredFeature;
  }

  selectFeature(featureInfo: FeatureInfoType) {
    const feature = getFeature(featureInfo, this._viewer as CesiumViewerType);
    if (feature) {
      if (
        !this._selectOption ||
        !isIncludeProperty(feature.properties, this._selectOption)
      ) {
        return;
      }

      feature.status = FeatureStatus.ACTIVE;

      if (!this.isExistInSelected(featureInfo)) {
        this._selectedFeatures.push(featureInfo);
      }
      this._eventFeatureSelected.raiseEvent([featureInfo]);
    }
  }

  deselectFeature(featureInfo: FeatureInfoType) {
    const filteredFeature = this._selectedFeatures.filter(
      (feature) => feature.id !== featureInfo.id,
    );

    const feature = this.getFeature(featureInfo);
    if (feature) {
      feature.status = FeatureStatus.VIEW;
    }
    this._selectedFeatures = filteredFeature;
    this._eventFeatureDeselected.raiseEvent([featureInfo]);
  }

  deleteSelectedFeature(featureInfo: FeatureInfoType) {
    const viewer = this._viewer as CesiumViewerType;
    if (!viewer) {
      return;
    }

    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;
    const { textDraw } = viewer.textTool;

    if (!this.isExistInSelected(featureInfo)) {
      return;
    }

    switch (featureInfo.type) {
      case GEOMETRY_TYPE.POLYGON:
        polygonDrawingTools.deletePolygon(featureInfo.id);
        break;
      case GEOMETRY_TYPE.LINE:
        lineDrawingTools.deleteLine(featureInfo.id);
        break;
      case GEOMETRY_TYPE.POINT:
        pointDrawingTools.deletePoint(featureInfo.id);
        break;
      case GEOMETRY_TYPE.TEXT:
        textDraw.deleteTextBox(featureInfo.id);
      default:
        break;
    }

    this.deselectFeature(featureInfo);
    this.eventFeatureDelected.raiseEvent([featureInfo]);
  }

  getFeature(featureInfo: FeatureInfoType): FeatureType | undefined {
    const viewer = this._viewer as CesiumViewerType;
    if (!viewer) {
      return;
    }

    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;
    const { textDraw } = viewer.textTool;

    let feature;
    if (!this.isExistInSelected(featureInfo)) {
      return;
    }

    switch (featureInfo.type) {
      case GEOMETRY_TYPE.POLYGON:
        feature = polygonDrawingTools.getPolygon(featureInfo.id);
        break;
      case GEOMETRY_TYPE.LINE:
        feature = lineDrawingTools.getLine(featureInfo.id);
        break;
      case GEOMETRY_TYPE.POINT:
        feature = pointDrawingTools.getPoint(featureInfo.id);
        break;
      case GEOMETRY_TYPE.TEXT:
        feature = textDraw.getTextboxById(featureInfo.id);
      default:
        break;
    }

    return feature;
  }

  exportWKTById(selectedId: string) {
    const featureInfo = this.getFeatureInfoById(selectedId);
    if (!featureInfo) {
      return;
    }

    const feature = this.getFeature(featureInfo);

    if (!feature) {
      return;
    }
    return feature.exportWKT();
  }

  exportWKTAll() {
    const exportedWkt: ExportedWKTType[] = [];
    for (const featureInfo of this._selectedFeatures) {
      const feature = this.getFeature(featureInfo);
      if (feature) {
        exportedWkt.push(feature.exportWKT());
      }
    }
    return exportedWkt;
  }

  deleteAllSelectedFeatures() {
    const viewer = this._viewer as CesiumViewerType;

    if (!viewer) {
      return;
    }

    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;
    const { textDraw } = viewer.textTool;

    for (const featureInfo of this._selectedFeatures) {
      switch (featureInfo.type) {
        case GEOMETRY_TYPE.POLYGON:
          polygonDrawingTools.deletePolygon(featureInfo.id);
          break;
        case GEOMETRY_TYPE.LINE:
          lineDrawingTools.deleteLine(featureInfo.id);
          break;
        case GEOMETRY_TYPE.POINT:
          pointDrawingTools.deletePoint(featureInfo.id);
          break;
        case GEOMETRY_TYPE.TEXT:
          textDraw.deleteTextBox(featureInfo.id);
        default:
          break;
      }
    }

    clearArray(this._selectedFeatures);
    this.eventFeatureAllDeleted.raiseEvent();
  }

  canvasPressEvent(event: MouseEvent) {
    if (this._mode === SelectMode.Select) {
      MapTool.multiEditMode = SelectMode.Edit;
    }
    super.canvasPressEvent(event);
  }

  reset() {
    this._mode = SelectMode.None;
    while (this._selectedFeatures.length > 0) {
      this.deselectFeature(this._selectedFeatures[0]);
    }
    clearArray(this._selectedFeatures);
    this._eventReset.raiseEvent();
  }

  destroy() {
    return destroyObject(this);
  }
}
