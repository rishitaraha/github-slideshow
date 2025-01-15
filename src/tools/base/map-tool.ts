// q@ts-nocheck
/* qeslint-disable */
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import {
  Cartesian2,
  Cartesian3,
  defined,
  DeveloperError,
  Event,
  KeyboardEventModifier,
  SceneMode,
  Viewer,
} from 'cesium';
import { MouseButton } from '../../shared';
import { CesiumViewerType, FeatureStatus } from '../../types';
import {
  drillPickEntity,
  GEOMETRY_TYPE,
  getFeature,
  getFeatureFromId,
  getFeatureFromIdWithType,
  getNearestEdgeInfo,
  getNearestEdgeInfo2D,
  getWorldPosition,
} from '../../utils';
// import { isIncludeProperty } from '../../utils/common';
import DrawingSettings from '../drawing/drawing-tool-settings';
import { DrawingMode } from '../drawing/enums';
import { SelectMode } from './enums';
import { isIncludeProperty } from '../../utils/common';

/**
 * Abstract base class for all map tools
 * Map tools are user interactive tools for manipulating the canvas.
 */

let oldCursorStyle: string | undefined;

function getMapToolCursorStyle(imageUrl: string, centerX = 12, centerY = 12) {
  return `url('${imageUrl}') ${centerX} ${centerY}, auto`;
}

export interface MouseEvent {
  pos: Cartesian2;
  button: MouseButton;
  keyboardEventModifier: KeyboardEventModifier;
}

export interface MapToolConstructorOptions {
  viewer: Viewer;
  name: string;
  cursorStyle: string | undefined;
}

class MapTool {
  protected _viewer: Viewer;
  protected _name: string;
  protected _cursorStyle: string | undefined;
  private readonly _activated: Event;
  private readonly _deactivated: Event;
  private _isActivated = false;

  static multiEditMode: SelectMode = SelectMode.None;
  static toolSelected = false;
  static selectedFeatureId = '';

  constructor(options: MapToolConstructorOptions) {
    if (this.constructor === MapTool) {
      throw new TypeError(
        'Abstract class "MapTool" cannot be instantiated directly.',
      );
    }

    if (!defined(options.viewer)) {
      throw new DeveloperError('viewer is required');
    }

    if (!defined(options.name)) {
      throw new DeveloperError('name should be given');
    }

    this._viewer = options.viewer;
    this._name = options.name;
    this._cursorStyle = options.cursorStyle;
    this._activated = new Event();
    this._deactivated = new Event();
  }

  isActive() {
    // @ts-ignore
    return this._viewer.mapTool === this;
  }

  activate() {
    this._activated.raiseEvent();

    if (this._cursorStyle !== undefined) {
      oldCursorStyle = this._viewer.canvas.style.cursor;
      this._viewer.canvas.style.cursor = this._cursorStyle;
    }

    this._isActivated = true;
    return true;
  }

  setOverrideCursorWait() {
    this._viewer.canvas.style.cursor = 'wait';
  }

  restoreOverrideCursor() {
    if (this.isActive() && this._cursorStyle !== undefined) {
      this._viewer.canvas.style.cursor = this._cursorStyle;
    } else {
      this._viewer.canvas.style.cursor = 'default';
    }
  }

  deactivate() {
    this._deactivated.raiseEvent();

    if (defined(this._cursorStyle) && oldCursorStyle) {
      this._viewer.canvas.style.cursor = oldCursorStyle;
    }

    this._isActivated = false;
  }

  disableOrigCesiumWidgetScreenSpaceHandler() {
    const { scene } = this._viewer;

    scene.screenSpaceCameraController.enableRotate = false;
  }

  enableOrigCesiumWidgetScreenSpaceHandler() {
    const { scene } = this._viewer;

    scene.screenSpaceCameraController.enableRotate = true;
  }

  /**
   * @param {Object} event
   * @param {Cartesian2} event.pos
   * @param {MouseButton|undefined} event.button
   * @param {KeyboardEventModifier|undefined} event.keyboardModifier
   */

  // eslint-disable-next-line class-methods-use-this, no-unused-vars,  @typescript-eslint/no-unused-vars
  canvasMoveEvent(event: MouseEvent) {}

  /**
   * @param {Object} event
   * @param {Cartesian2} event.pos
   * @param {MouseButton|undefined} event.button
   * @param {KeyboardEventModifier|undefined} event.keyboardModifier
   */

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  canvasDoubleClickEvent(event: MouseEvent) {}

  /**
   * @param {Object} event
   * @param {Cartesian2} event.pos
   * @param {MouseButton|undefined} event.button
   * @param {KeyboardEventModifier|undefined} event.keyboardModifier
   */

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  canvasPressEvent(event: MouseEvent) {
    if (MapTool.multiEditMode === SelectMode.Edit) {
      this.selectFeatureProc(event);
    } else if (MapTool.multiEditMode === SelectMode.Info) {
      this.focusFeature(event);
    }
  }

  getPickedFeatureInfo(event: MouseEvent) {
    const viewer = this._viewer as CesiumViewerType;
    if (!viewer) {
      return;
    }

    const pickedObjs = drillPickEntity(viewer, event);
    if (!pickedObjs) {
      return;
    }

    const ids: string[] = [];
    for (const picked of pickedObjs) {
      if (picked.id !== DrawingSettings.markerPointId) {
        ids.push(picked.id);
      }
    }
    if (ids.length < 1) {
      return;
    }

    const pickedFeatureInfo = getFeatureFromIdWithType(
      ids[0],
      this._viewer as CesiumViewerType,
    );

    return pickedFeatureInfo;
  }

  selectFeatureProc(event: MouseEvent) {
    if (event.button !== MouseButton.LeftButton) {
      return;
    }

    const viewer = this._viewer as CesiumViewerType;
    const pickedFeatureInfo = this.getPickedFeatureInfo(event);
    if (!pickedFeatureInfo) {
      return;
    }

    const { feature: pickedFeature } = pickedFeatureInfo;

    const properties = pickedFeature?.properties;
    if (!properties || !properties.type) {
      return;
    }

    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;
    const { textTool, selectTools } = viewer;
    const { selectFeatureTool } = selectTools;

    const selectOption = selectFeatureTool.selectFeature.selectOption;
    if (!selectOption || !isIncludeProperty(properties, selectOption)) {
      return;
    }

    const pickedFeatureInfoType = {
      id: pickedFeature.id,
      type: properties.type,
    };
    const feature = getFeature(
      pickedFeatureInfoType,
      this._viewer as CesiumViewerType,
    );
    if (feature && feature.status === FeatureStatus.ACTIVE) {
      selectFeatureTool.selectFeature.deselectFeature(pickedFeatureInfoType);
      return;
    }

    viewer.deactivateCurrentMapTool();
    selectFeatureTool.activateSelectFeature();
    selectFeatureTool.selectFeature.selectFeature(pickedFeatureInfoType);
    // To choose kind of drawing tool for selected feature.
    // Each kind of feature has listed in its drawing tool.
    // So we need to find related drawing tool first and select the feature.
    switch (properties.type) {
      case GEOMETRY_TYPE.POLYGON:
        if (lineDrawingTools.lineDrawing.isActive()) {
          lineDrawingTools.lineDrawing.deactivate();
        }
        if (pointDrawingTools.pointDrawing.isActive()) {
          pointDrawingTools.pointDrawing.deactivate();
        }
        if (textTool.textDraw.isActive()) {
          textTool.textDraw.deactivate();
        }
        if (!polygonDrawingTools.polygonDrawing.isActive()) {
          viewer.deactivateCurrentMapTool();
          polygonDrawingTools.activatePolygonDrawing();
        }
        // Undo redo was not working because the undo-redo stack was initaited when activate/deactivate drawing tool.
        // So we need to initiate the stack if selected feature is the same as picked polygon.
        if (MapTool.selectedFeatureId !== pickedFeature.id) {
          polygonDrawingTools.polygonDrawing.clearUndoRedoHistory();
        }
        polygonDrawingTools.polygonDrawing.selectEditPolygon(pickedFeature.id);
        MapTool.selectedFeatureId = pickedFeature.id;
        break;
      case GEOMETRY_TYPE.LINE:
        if (polygonDrawingTools.polygonDrawing.isActive()) {
          polygonDrawingTools.polygonDrawing.deactivate();
        }
        if (pointDrawingTools.pointDrawing.isActive()) {
          pointDrawingTools.pointDrawing.deactivate();
        }
        if (textTool.textDraw.isActive()) {
          textTool.textDraw.deactivate();
        }
        if (!lineDrawingTools.lineDrawing.isActive()) {
          viewer.deactivateCurrentMapTool();
          lineDrawingTools.activateLineDrawing();
        }
        if (MapTool.selectedFeatureId !== pickedFeature.id) {
          lineDrawingTools.lineDrawing.clearUndoRedoHistory();
        }
        lineDrawingTools.lineDrawing.selectEditLine(pickedFeature.id);
        MapTool.selectedFeatureId = pickedFeature.id;
        break;
      case GEOMETRY_TYPE.POINT:
        if (polygonDrawingTools.polygonDrawing.isActive()) {
          polygonDrawingTools.polygonDrawing.deactivate();
        }
        if (lineDrawingTools.lineDrawing.isActive()) {
          lineDrawingTools.lineDrawing.deactivate();
        }
        if (textTool.textDraw.isActive()) {
          textTool.textDraw.deactivate();
        }
        if (!pointDrawingTools.pointDrawing.isActive()) {
          viewer.deactivateCurrentMapTool();
          pointDrawingTools.activatePointDrawing();
        }
        pointDrawingTools.pointDrawing.enableEdit();
        break;
      case GEOMETRY_TYPE.TEXT:
        if (polygonDrawingTools.polygonDrawing.isActive()) {
          polygonDrawingTools.polygonDrawing.deactivate();
        }
        if (lineDrawingTools.lineDrawing.isActive()) {
          lineDrawingTools.lineDrawing.deactivate();
        }
        if (pointDrawingTools.pointDrawing.isActive()) {
          pointDrawingTools.pointDrawing.deactivate();
        }
        if (!textTool.textDraw.isActive()) {
          viewer.deactivateCurrentMapTool();
          textTool.activateTextDraw();
        }
        textTool.textDraw.enableEdit();
        break;
      default:
        break;
    }
  }

  focusFeature(event: MouseEvent) {
    const viewer = this._viewer as CesiumViewerType;
    const { infoTool } = viewer;
    const { featureInfoTool } = infoTool;

    const pickedFeatureInfo = this.getPickedFeatureInfo(event);
    if (!pickedFeatureInfo) {
      featureInfoTool.onFeatureBlur();
      return;
    }

    const { feature } = pickedFeatureInfo;
    if (!feature) {
      featureInfoTool.onFeatureBlur();
      return;
    }

    featureInfoTool.onFeatureFocus(feature);
  }
  /**
   * @param {Object} event
   * @param {Cartesian2} event.pos
   * @param {MouseButton|undefined} event.button
   * @param {KeyboardEventModifier|undefined} event.keyboardModifier
   */

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  canvasReleaseEvent(event: MouseEvent) {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  wheelEvent(event: MouseEvent) {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  keyPressEvent(event: KeyboardEvent) {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  keyReleaseEvent(event: KeyboardEvent) {}

  // eslint-disable-next-line class-methods-use-this, no-unused-vars, @typescript-eslint/no-unused-vars
  canvasClickEvent(event: KeyboardEvent) {}

  get name() {
    return this._name;
  }

  get activated() {
    return this._activated;
  }

  get deactivated() {
    return this._deactivated;
  }

  get isActivated() {
    return this._isActivated;
  }

  /**
   * @param {Cartesian2} mousePosition
   * @param {Cartesian3} result
   * @return {Cartesian3|undefined}
   */
  getWorldPosition(mousePosition: any, result: any) {
    const viewer = this._viewer;
    const { scene } = viewer;

    return getWorldPosition(scene, mousePosition, result);
  }

  getNearestEdgeInfo(positions: Cartesian3[], pos: Cartesian3) {
    const viewer = this._viewer;
    const { scene } = viewer;

    return getNearestEdgeInfo(scene, positions, pos);
  }

  getNearestEdgeInfo2D(positions: Cartesian3[], pos: Cartesian3) {
    const viewer = this._viewer;
    const { scene } = viewer;

    return getNearestEdgeInfo2D(scene, positions, pos);
  }

  static enableEdit(viewer: CesiumViewerType, ids: string[]) {
    MapTool.multiEditMode = SelectMode.Edit;

    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;
    const { textTool } = viewer;

    if (polygonDrawingTools) {
      polygonDrawingTools.activatePolygonDrawing();
      polygonDrawingTools.polygonDrawing.mode = DrawingMode.EditDraw;
    } else if (lineDrawingTools) {
      lineDrawingTools.activateLineDrawing();
      lineDrawingTools.lineDrawing.mode = DrawingMode.EditDraw;
    } else if (pointDrawingTools) {
      pointDrawingTools.activatePointDrawing();
      pointDrawingTools.pointDrawing.mode = DrawingMode.EditDraw;
    } else if (textTool) {
      textTool.activateTextDraw();
      textTool.textDraw.enableEdit();
    } else {
      return;
    }

    for (const id of ids) {
      const feature = getFeatureFromId(id, viewer);
      feature?.appendProperties({ isEditable: true });
    }
  }

  static disableEdit(viewer: CesiumViewerType) {
    MapTool.multiEditMode = SelectMode.None;
    viewer.deactivateCurrentMapTool();
    const { selectFeatureTool } = viewer.selectTools;
    selectFeatureTool.activateSelectFeature();
    // make panning allowed
    const scene = viewer.scene;
    if (scene.mode === SceneMode.SCENE3D) {
      scene.screenSpaceCameraController.enableRotate = true;
    } else if (scene.mode === SceneMode.SCENE2D) {
      scene.screenSpaceCameraController.enableTranslate = true;
    }
  }
}

export { getMapToolCursorStyle, MapTool };
