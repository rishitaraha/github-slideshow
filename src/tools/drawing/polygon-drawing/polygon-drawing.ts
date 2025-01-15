// q@ts-nocheck
/* qeslint-disable */
import {
  Billboard,
  BillboardCollection,
  Cartesian2,
  Cartesian3,
  Cartographic,
  createGuid,
  defined,
  destroyObject,
  DeveloperError,
  Entity,
  Event,
  PointPrimitive,
  PointPrimitiveCollection,
  PolylineDashMaterialProperty,
  PrimitiveCollection,
  Scene,
  SceneMode,
  SceneTransforms,
} from 'cesium';
import { isMobile } from 'react-device-detect';
import { Polygon } from '../../../entities';
import { ESC_KEY, MOUSE_DELTA, MouseButton } from '../../../shared';
import {
  DEFAULT_POLYGON_COLOR,
  DEFAULT_POLYGON_OPACITY,
  MIN_POLYGON_VERTEX_NUM,
  SNAP_PIXEL_SIZE_TO_EDGE,
  SNAP_PIXEL_SIZE_TO_VERTEX,
} from '../../../shared/constants';
import { FeatureIdentity, Vertex } from '../../../types';
import { checkSnapToVertex, clearArray, getCheckMarkSVG } from '../../../utils';
import { MapTool, MouseEvent } from '../../base';
import { StyleOptions } from '../../style';
import DrawingSettings from '../drawing-tool-settings';
import { DrawingMode } from '../enums';
import {
  EditAction,
  EditActionType,
  PointState,
  SnapPointOptions,
  UndoRedoAction,
} from '../types';
import { SnapMode } from './enums';
import { PolygonDrawingConstructorOptions } from './types';

const cart3Scratch = new Cartesian3();
const cart3Scratch1 = new Cartesian3();
const cart2Scratch = new Cartesian2();
const cart2Scratch1 = new Cartesian2();
const cart2Scratch2 = new Cartesian2();
/**
 * Check if number of vertex is greater than minimum number of polygon vertices.
 * @param {number} n
 * @returns {boolean}
 */
const isPolygon = (n: number) => n >= MIN_POLYGON_VERTEX_NUM;

/**
 * PolygonDrawing is one kind of MapTool to draw and to edit polygon.
 * _mode: to check if it's on drawing state, or finished drawing, or on editing state ...
 * _polygon: Store Polygon.
 * _polygons: Store multiple polygons.
 * _lastClickPosition: Mouse position on UI, when click the MLB, mouse position will be saved.
 * _tempNextPos: Store mouse position on cesium scene.
 */
class PolygonDrawing extends MapTool {
  protected _mode: DrawingMode;
  protected _polygon!: Polygon;
  protected _polygons: Polygon[];
  protected readonly _lastClickPosition: Cartesian2;
  protected readonly _tempNextPos: Cartesian3;

  private readonly _scene: Scene;

  private readonly _options: PolygonDrawingConstructorOptions;
  private _focusedPointPrimitive: Vertex | undefined;

  // Event implementation
  private readonly _eventVertexCreatedWhileDrawing: Event;
  private readonly _eventPolygonCreated: Event;
  private readonly _eventVertexModifiedInPolygon: Event;
  private readonly _eventVertexAddedInPolygon: Event;
  private readonly _eventVertexDeletedInPolygon: Event;
  private readonly _eventPolygonDeleted: Event;
  private readonly _eventDashedLineDeleted: Event;

  private readonly _eventPolygonDrawingStarted: Event;
  private readonly _eventPolygonDrawingEnd: Event;

  // Marker point following mouse position.
  private readonly _markerPointPrimitive: PointPrimitive;
  private readonly _markerPointCollection: PointPrimitiveCollection;

  private _primitives: PrimitiveCollection;
  // Dash last edge
  private _dashedEdge: Entity;

  // Check if is snapped to the first vertex.
  private _isSnappedToFirstVertex: boolean;
  // Check if is dragging.
  private _isDragInEdit: boolean;
  // Check if was panned.
  private _isDragInDraw: boolean;
  private _wasPanned: boolean;
  // -1: no snapped, 0: snapped on vertex, 1: snapped on edge
  private _snapMode: SnapMode;
  // Snapped point on line edge.
  private _focusedSnapPoint: SnapPointOptions | undefined;
  // Vertex added on line edge from the snapped point.
  private _snapVertex: Vertex | undefined;
  // Custom properties.
  private _properties: Record<string, any> = {};
  // Style Options
  private _styleOptions?: StyleOptions;
  private _defaultStyle: StyleOptions;
  private _isUseStyleOptions = false;
  // Multiple feature/single feature drawing.
  private _isMultipleDrawing = false;
  // Delete option
  private _deleteOption?: Record<string, any>;
  // Select option
  private _selectOption?: Record<string, any>;
  // Drawing history for undo/redo.
  private _drawHistory: Cartesian3[] = [];
  // Edit history for undo/redo.
  private _editUndoHistory: EditAction[] = [];
  private _editRedoHistory: EditAction[] = [];
  private _vertexPosition?: Cartesian3;
  private _undoRedoAction: UndoRedoAction = UndoRedoAction.none;
  // Mobile drawing support.
  private _billboardCollection?: BillboardCollection;
  private _billboardCheckmark?: Billboard;
  // Clamp to ground option.
  private _clamped = true;

  private _prevMousePosition: Cartesian2 = new Cartesian2();

  constructor(options: PolygonDrawingConstructorOptions) {
    super(options);

    const scene = this._viewer.scene;

    this._tempNextPos = new Cartesian3();
    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition = new Cartesian2(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    this._scene = scene;
    this._polygons = options.polygons;
    this._options = options;

    this._eventVertexCreatedWhileDrawing = new Event();
    this._eventPolygonCreated = new Event();
    this._eventVertexModifiedInPolygon = new Event();
    this._eventVertexAddedInPolygon = new Event();
    this._eventVertexDeletedInPolygon = new Event();
    this._eventPolygonDeleted = new Event();
    this._eventDashedLineDeleted = new Event();

    this._eventPolygonDrawingStarted = new Event();
    this._eventPolygonDrawingEnd = new Event();

    this._markerPointCollection = this.options.primitives.add(
      new PointPrimitiveCollection({ show: true }),
    );
    this._markerPointPrimitive = this._markerPointCollection.add(
      this.options.markerOptions,
    );

    this._primitives = options.primitives;

    this._dashedEdge = this._viewer.entities.add({
      name: 'dashed edge',
      polyline: {
        positions: [],
        width: DrawingSettings.lineWidth,
        material: new PolylineDashMaterialProperty({
          color: DrawingSettings.color,
        }),
      },
    });

    this._isDragInEdit = false;
    this._isDragInDraw = false;
    this._wasPanned = false;
    this._isSnappedToFirstVertex = false;
    this._snapMode = SnapMode.NONE;

    scene.camera.moveEnd.addEventListener(this._cameraMoveEnd);
    if (options.properties) {
      this._properties = options.properties;
    }

    this._defaultStyle = {
      polygonStyleOptions: {
        fillColor: DEFAULT_POLYGON_COLOR.toCssColorString(),
        fillOpacity: DEFAULT_POLYGON_OPACITY,
        label: '',
        labelColor: DrawingSettings.color.toCssColorString(),
        strokeColor: DrawingSettings.color.toCssColorString(),
        strokeThickness: DrawingSettings.lineWidth,
        opacity: DEFAULT_POLYGON_OPACITY,
      },
    };

    if (isMobile) {
      this._billboardCollection = this._primitives.add(
        new BillboardCollection(),
      );
      if (this._billboardCollection) {
        this._billboardCheckmark = this._billboardCollection.add({
          position: new Cartesian3(),
          image: getCheckMarkSVG({ size: 12 }),
          show: false,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });
      }
    }
  }

  private _cameraMoveEnd = () => {
    if (this.polygons) {
      this.updatePolygons();
      for (let i = 0; i < this.polygons.length; i++) {
        this.polygons[i].updateHeightOfPoint();
        this.polygons[i].updateLabelPosition();
      }
    }
  };
  // Set style options when activation.
  setStyleOptions(styleOptions: StyleOptions) {
    this._styleOptions = styleOptions;
    this.useStyleOptions(true);
  }

  useStyleOptions(flag = true) {
    this._isUseStyleOptions = flag;
  }

  /**
   * Whenever camera changed, update polygon primitives.
   * Use this function to calculate polygons culling volume in multi-polygon drawing mode (not now).
   * When drawing a lot of polygons and zooming camera, very small polygons(i.e. with very small culling volume)
   * should be invisible so that the render efficiency would be high.
   * Reference for Culling Volume : https://cesium.com/learn/cesiumjs/ref-doc/CullingVolume.html
   */
  updatePolygons() {
    const scene = this._scene;

    const camera = scene.camera;
    const frustum = camera.frustum;

    const cullingVolume = frustum.computeCullingVolume(
      camera.position,
      camera.direction,
      camera.up,
    );

    this._polygons.forEach((polygon: Polygon) => {
      polygon.update(cullingVolume);
    });
  }

  get options() {
    return this._options;
  }

  activate() {
    super.activate();

    if (!isMobile) {
      this.showMarker();
    }

    this._reset();
    this._resetAll();
    return true;
  }

  deactivate() {
    super.deactivate();

    if (this._polygon && this._mode === DrawingMode.Drawing) {
      this.deletePolygon();
      this.deleteDash();
    }

    const scene = this._scene;

    if (scene.mode === SceneMode.SCENE3D) {
      scene.screenSpaceCameraController.enableRotate = true;
    } else if (scene.mode === SceneMode.SCENE2D) {
      scene.screenSpaceCameraController.enableTranslate = true;
    }
    this.hideMarker();
  }

  get mode() {
    return this._mode;
  }

  set mode(value: number) {
    this._mode = value;
  }

  get primitives() {
    return this._primitives;
  }

  set primitives(primitives: PrimitiveCollection) {
    this._primitives = primitives;
  }

  get polygons() {
    return this._polygons;
  }

  get eventVertexAddedInPolygon() {
    return this._eventVertexAddedInPolygon;
  }

  get eventVertexCreatedWhileDrawing() {
    return this._eventVertexCreatedWhileDrawing;
  }

  get eventVertexDeletedInPolygon() {
    return this._eventVertexDeletedInPolygon;
  }

  get eventVertexModifiedInPolygon() {
    return this._eventVertexModifiedInPolygon;
  }

  get eventPolygonDeleted() {
    return this._eventPolygonDeleted;
  }

  get eventPolygonCreated() {
    return this._eventPolygonCreated;
  }

  get eventPolygonDrawingStarted() {
    return this._eventPolygonDrawingStarted;
  }

  get eventPolygonDrawingEnd() {
    return this._eventPolygonDrawingEnd;
  }

  get eventDashedLineDeleted() {
    return this._eventDashedLineDeleted;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties: Record<string, any>) {
    this._properties = properties;
  }

  appendProperties(properties: Record<string, any>) {
    this._properties = { ...this.properties, ...properties };
  }

  get styleOptions() {
    return this._styleOptions;
  }

  get isUseStyleOptions() {
    return this._isUseStyleOptions;
  }

  get deleteOption() {
    return this._deleteOption;
  }

  set deleteOption(option: Record<string, any> | undefined) {
    this._deleteOption = option;
  }

  get selectOption() {
    return this._selectOption;
  }

  set selectOption(option: Record<string, any> | undefined) {
    this._selectOption = option;
  }
  /**
   * Get polygon by id.
   * @param {string} id
   * @returns
   */
  getPolygonById(id: string) {
    const filteredPolygon = this._polygons.find(
      (polygon: Polygon) => polygon.id === id,
    );
    if (filteredPolygon) {
      return filteredPolygon;
    }
    return null;
  }

  getCurrentPolygonId() {
    return this._polygon.id;
  }

  /**
   * Show marker point.
   */
  showMarker() {
    if (this.isActivated) {
      this._markerPointPrimitive.show = true;
    }
  }

  /**
   * Hide marker point.
   */
  hideMarker() {
    this._markerPointPrimitive.show = false;
  }

  /**
   * Mouse event on canvas, triggered when MLB or MRB clicked.
   * @param {MouseEvent} event
   * @returns
   */
  canvasPressEvent(event: MouseEvent) {
    this._prevMousePosition = event.pos.clone();
    if (
      event.button === MouseButton.LeftButton &&
      this._mode !== DrawingMode.EditDraw
    ) {
      this._isDragInDraw = true;
    } else if (
      event.button === MouseButton.RightButton &&
      this._mode !== DrawingMode.EditDraw
    ) {
      this._isDragInDraw = true;
    } else if (
      event.button === MouseButton.RightButton &&
      this._mode === DrawingMode.EditDraw
    ) {
      if (this._snapVertex) {
        // Right-clicking on a vertex.
        this._editUndoHistory.push({
          id: this._polygon.id,
          geometryType: 'Polygon',
          vertexId: this._snapVertex.vertexIndex,
          vertexPosition: Cartesian3.clone(
            this._polygon.positions[this._snapVertex.vertexIndex],
            new Cartesian3(),
          ),
          action: EditActionType.remove,
        });

        this.deleteVertex(this._snapVertex);
        // Check if number of vertex < 3, remove and reset polygon.
        if (!isPolygon(this._polygon.positions.length)) {
          this.deletePolygon();
          return;
        }
      } else {
        super.canvasPressEvent(event);
      }
    } else if (
      event.button === MouseButton.LeftButton &&
      this._mode === DrawingMode.EditDraw
    ) {
      const nextPos = this.getWorldPosition(event.pos, cart3Scratch);
      if (nextPos) {
        this._markerPointPrimitive.position = Cartesian3.clone(
          nextPos,
          cart3Scratch,
        );
      }
      super.canvasPressEvent(event);
      this._isDragInEdit = true;
      if (this._snapVertex) {
        // To store snapped vertex position to undo or redo history array.
        // We should use cloned position because if we use the reference of the position,
        // it will be changed according to the actual position in undo or redo history array.
        this._vertexPosition = Cartesian3.clone(
          this._polygon.positions[this._snapVertex.vertexIndex],
          new Cartesian3(),
        );
      }
    }

    if (
      event.button === MouseButton.LeftButton &&
      this._mode === DrawingMode.EditDraw &&
      this._snapMode === SnapMode.EDGE
    ) {
      // Creating a new vertex on edge
      if (this._focusedSnapPoint) {
        this._snapVertex = this._polygon.insertVertex(
          this._focusedSnapPoint.position,
          this._focusedSnapPoint.segStartIdx,
        );
        this._editUndoHistory.push({
          id: this._polygon.id,
          geometryType: 'Polygon',
          vertexId: this._focusedSnapPoint.segStartIdx + 1,
          vertexPosition: this._focusedSnapPoint.position,
          action: EditActionType.add,
        });

        this._eventVertexAddedInPolygon.raiseEvent(
          [this._snapVertex],
          [this._polygon],
          [this],
        );
      }
    }
  }

  /**
   * Key press event, triggered when key pressed.
   * @param {KeyboardEvent} event
   * @returns
   */
  keyPressEvent(event: KeyboardEvent) {
    if (this._mode === DrawingMode.Drawing) {
      if (event.key === ESC_KEY) {
        this.deletePolygon();
        this.deleteDash();
      }

      if (
        event.ctrlKey &&
        !event.shiftKey &&
        (event.key === 'z' || event.key === 'Z')
      ) {
        this.undoDraw();
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        (event.key === 'z' || event.key === 'Z')
      ) {
        this.redoDraw();
      }

      if (event.code === 'Space') {
        this.enableRotateGlobe();
      }
    } else if (this._mode === DrawingMode.EditDraw) {
      if (
        event.ctrlKey &&
        !event.shiftKey &&
        (event.key === 'z' || event.key === 'Z')
      ) {
        this._undoRedoAction = UndoRedoAction.undo;
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        (event.key === 'z' || event.key === 'Z')
      ) {
        this._undoRedoAction = UndoRedoAction.redo;
      }
      if (this._undoRedoAction != UndoRedoAction.none) {
        this.undoRedoEdit();
        this._undoRedoAction = UndoRedoAction.none;
      }
    }
  }

  undoDraw() {
    if (this._polygon && this._polygon.positions.length > 1) {
      const positions = this._polygon.positions;
      const deletedPosition = new Cartesian3();
      Cartesian3.clone(positions[positions.length - 1], deletedPosition);

      this._polygon.deletePoint(positions.length - 1);

      this._viewer.entities.remove(this._dashedEdge);
      this.createDashedDrawingEdge(positions);
      this._polygon.updateLastPosition(this._tempNextPos);
      this._drawHistory.push(deletedPosition);
    } else {
      this.deletePolygon();
      this.deleteDash();
    }
  }

  redoDraw() {
    if (this._polygon && this._drawHistory.length > 0) {
      const deletedPosition = this._drawHistory.pop();
      if (!deletedPosition) {
        return;
      }
      this._polygon.addPoint(deletedPosition);

      const positions = this._polygon.positions;
      this._viewer.entities.remove(this._dashedEdge);
      this.createDashedDrawingEdge(positions);

      this._polygon.updateLastPosition(this._tempNextPos);
    }
  }

  undoRedoEdit() {
    let editAction;
    if (this._undoRedoAction === UndoRedoAction.undo) {
      editAction = this._editUndoHistory.pop();
    } else if (this._undoRedoAction === UndoRedoAction.redo) {
      editAction = this._editRedoHistory.pop();
    }
    if (!editAction) {
      return;
    }

    switch (editAction.action) {
      case EditActionType.add:
        const removeAction: EditAction = {
          id: this._polygon.id,
          geometryType: 'Polygon',
          vertexId: editAction.vertexId,
          vertexPosition: Cartesian3.clone(
            this._polygon.positions[editAction.vertexId],
            new Cartesian3(),
          ),
          action: EditActionType.remove,
        };
        this._polygon.deletePoint(editAction.vertexId);
        if (this._undoRedoAction === UndoRedoAction.undo) {
          this._editRedoHistory.push(removeAction);
        } else if (this._undoRedoAction === UndoRedoAction.redo) {
          this._editUndoHistory.push(removeAction);
        }
        return;
      case EditActionType.modify:
        const modifyAction: EditAction = {
          id: this._polygon.id,
          geometryType: 'Polygon',
          vertexId: editAction.vertexId,
          vertexPosition: Cartesian3.clone(
            editAction.modifiedPosition,
            new Cartesian3(),
          ),
          action: EditActionType.modify,
          modifiedPosition: Cartesian3.clone(
            editAction.vertexPosition,
            new Cartesian3(),
          ),
        };
        if (editAction.modifiedPosition && editAction.vertexPosition) {
          const modifiedVertex = {
            vertexIndex: editAction.vertexId,
            isMainVertex: true,
            polylinePrimitive: this._polygon.polyline,
            polygonPrimitive: this._polygon.polygon,
          } as Vertex;
          this._polygon.updateMainVertex(
            modifiedVertex,
            editAction.vertexPosition,
            this._eventVertexModifiedInPolygon,
            PointState.ACTIVE,
          );
        }
        if (this._undoRedoAction === UndoRedoAction.undo) {
          this._editRedoHistory.push(modifyAction);
        } else if (this._undoRedoAction === UndoRedoAction.redo) {
          this._editUndoHistory.push(modifyAction);
        }
        return;
      case EditActionType.remove:
        const addAction: EditAction = {
          id: this._polygon.id,
          geometryType: 'Polygon',
          vertexId: editAction.vertexId,
          vertexPosition: Cartesian3.clone(
            editAction.vertexPosition,
            new Cartesian3(),
          ),
          action: EditActionType.add,
        };
        if (editAction.vertexPosition) {
          const vertex = this._polygon.insertVertex(
            editAction.vertexPosition,
            editAction.vertexId - 1,
          );
          if (vertex) {
            this._polygon.updateMainVertex(
              vertex,
              editAction.vertexPosition,
              this.eventVertexModifiedInPolygon,
              PointState.ACTIVE,
            );
          }
        }
        if (this._undoRedoAction === UndoRedoAction.undo) {
          this._editRedoHistory.push(addAction);
        } else if (this._undoRedoAction === UndoRedoAction.redo) {
          this._editUndoHistory.push(addAction);
        }
        return;
      default:
        return;
    }
  }

  clearUndoRedoHistory() {
    clearArray(this._editUndoHistory);
    clearArray(this._editRedoHistory);
  }
  /**
   * Remove and reset  Polygon.
   */
  deletePolygon() {
    this._polygon.positions = [];
    this._polygon._hideAllPrimitives();
    this._reset();

    if (this._mode === DrawingMode.EditDraw) {
      this._eventPolygonDeleted.raiseEvent([this._polygon], [this]);
    }
  }
  // Remve dash line.
  deleteDash() {
    this._viewer.entities.remove(this._dashedEdge);
    this._eventDashedLineDeleted.raiseEvent();
  }

  /**
   * Delete Vertex.
   */
  deleteVertex(vertex: Vertex) {
    this._polygon.deletePoint(vertex.vertexIndex);
    this.eventVertexDeletedInPolygon.raiseEvent(
      [vertex],
      [this._polygon],
      [this],
    );
  }

  /**
   * Reset focused point primitive.
   */
  _resetFocusedPointPrimitive() {
    this._focusedPointPrimitive = undefined;
  }

  /**
   * Drawing on canvas by clicking canvas.
   * @param {MouseEvent} event
   */
  _handleCanvasPressEventForDrawing(event: MouseEvent) {
    if (this._mode === DrawingMode.None) {
      return;
    }
    if (this._mode === DrawingMode.AfterDraw) {
      this._reset();
    }

    // Don't handle if clickPos is too close to previous click.
    // This typically indicates a double click handler will be fired next,
    // we don't expect the user to wait and click this point again.
    const clickDistanceScratch = new Cartesian2();
    const lastClickPos = this._lastClickPosition;
    const distance = Cartesian2.magnitude(
      Cartesian2.subtract(lastClickPos, event.pos, clickDistanceScratch),
    );

    if (distance < MOUSE_DELTA) {
      return;
    }

    const position = this.getWorldPosition(event.pos, cart3Scratch);

    if (!defined(position) || !position) {
      return;
    }

    if (!isMobile) {
      if (!this._isSnappedToFirstVertex) {
        const vertex = this._polygon.addPoint(
          Cartesian3.clone(position, new Cartesian3()),
        );
        this._eventVertexCreatedWhileDrawing.raiseEvent(
          [vertex],
          [this._polygon],
          [this],
        );
        if (this._mode !== DrawingMode.Drawing) {
          this._mode = DrawingMode.Drawing;
          this._eventPolygonDrawingStarted.raiseEvent();
        }
      } else {
        // On placing the point on the first point:
        this._finishDrawingOneFeature();
        this._isSnappedToFirstVertex = false;
      }
    } else {
      if (
        isPolygon(this._polygon.positions.length) &&
        checkSnapToVertex(this._scene, position, this._polygon.positions[0])
      ) {
        this._finishDrawingOneFeature();
        if (this._billboardCheckmark) {
          this._billboardCheckmark.show = false;
        }
      } else {
        const vertex = this._polygon.addPoint(
          Cartesian3.clone(position, new Cartesian3()),
        );
        this._eventVertexCreatedWhileDrawing.raiseEvent(
          [vertex],
          [this._polygon],
          [this],
        );
        if (this._mode !== DrawingMode.Drawing) {
          this._mode = DrawingMode.Drawing;
          this._eventPolygonDrawingStarted.raiseEvent();
        }
      }

      if (
        isPolygon(this._polygon.positions.length) &&
        this._billboardCheckmark &&
        !checkSnapToVertex(this._scene, position, this._polygon.positions[0])
      ) {
        if (this._polygon.mainVertexPointPrimitives) {
          this._polygon.mainVertexPointPrimitives[0].show = false;
        }
        this._billboardCheckmark.position = this._polygon.positions[0];
        this._billboardCheckmark.show = true;
      }
    }

    Cartesian2.clone(event.pos, lastClickPos);
  }

  /**
   * Triggered when mouse move on canvas.
   * @param {MouseEvent} event
   * @returns
   */
  canvasMoveEvent(event: MouseEvent) {
    const nextPos = this.getWorldPosition(event.pos, cart3Scratch);
    if (!defined(nextPos) || !nextPos) {
      return;
    }

    if (!this._wasPanned) {
      this._markerPointPrimitive.position = Cartesian3.clone(
        nextPos,
        cart3Scratch,
      );
    }

    // To check mouse moved with some amount.
    const diffX = event.pos.x - this._prevMousePosition.x;
    const diffY = event.pos.y - this._prevMousePosition.y;
    const diff = Math.sqrt(diffX * diffX + diffY * diffY);

    if (this._isDragInDraw && diff > 10) {
      this._wasPanned = true;
    }

    if (this._mode === DrawingMode.Drawing && !this._isDragInDraw) {
      this._handleCanvasMoveEventForDrawing(event);
    } else if (this._mode === DrawingMode.AfterDraw) {
      this._handleCanvasMoveEventForAfterDraw(event);
    } else if (this._mode === DrawingMode.EditDraw) {
      this._handleCanvasMoveEventForEdit(event);
    }
  }

  /**
   * Triggered when mouse button released on canvas.
   */
  canvasReleaseEvent(event) {
    if (
      event.button === MouseButton.LeftButton &&
      this._mode !== DrawingMode.EditDraw &&
      !this._wasPanned
    ) {
      this._handleCanvasPressEventForDrawing(event);
    } else if (
      event.button === MouseButton.RightButton &&
      this._mode !== DrawingMode.EditDraw &&
      !this._wasPanned
    ) {
      this._finishDrawingOneFeature();
    }

    if (this._focusedPointPrimitive) {
      this._focusedPointPrimitive = undefined;
    }

    if (this._snapVertex && this._isDragInEdit && this._vertexPosition) {
      this._editUndoHistory.push({
        id: this._polygon.id,
        geometryType: 'Polygon',
        vertexId: this._snapVertex.vertexIndex,
        vertexPosition: Cartesian3.clone(
          this._vertexPosition,
          new Cartesian3(),
        ),
        action: EditActionType.modify,
        modifiedPosition: Cartesian3.clone(
          this._polygon.positions[this._snapVertex.vertexIndex],
          new Cartesian3(),
        ),
      });
      this._vertexPosition = undefined;
    }
    this._isDragInEdit = false;
    this._snapVertex = undefined;
    this._snapMode = SnapMode.NONE;
    this._isDragInDraw = false;
    this._wasPanned = false;
  }

  /**
   * Update next point with current mouse position.
   * @param {MouseEvent} event
   * @returns
   */
  _handleCanvasMoveEventForDrawing(event: MouseEvent) {
    const nextPos = this.getWorldPosition(event.pos, cart3Scratch);
    const cartoScratch = new Cartographic();

    if (!defined(nextPos) || !nextPos) {
      return;
    }

    // To snap to first vertex while drawing;
    const polyline = this._polygon.polyline;
    if (isPolygon(polyline.positions.length)) {
      const scene = this._scene;
      const ellipsoid = scene.globe.ellipsoid;
      ellipsoid.cartesianToCartographic(polyline.positions[0], cartoScratch);
      const firstVertexPos = new Cartesian3();
      Cartesian3.fromRadians(
        cartoScratch.longitude,
        cartoScratch.latitude,
        scene.globe.getHeight(cartoScratch),
        ellipsoid,
        firstVertexPos,
      );

      const markerPosition3 = nextPos.clone(cart3Scratch1);

      if (checkSnapToVertex(scene, markerPosition3, firstVertexPos)) {
        this._isSnappedToFirstVertex = true;
        this._markerPointPrimitive.position = firstVertexPos;
        Cartesian3.clone(firstVertexPos, nextPos);
      } else {
        this._isSnappedToFirstVertex = false;
      }
    }

    Cartesian3.clone(nextPos, this._tempNextPos);

    const positions = this._polygon.positions;
    this._viewer.entities.remove(this._dashedEdge);
    this.createDashedDrawingEdge(positions);

    this._polygon.updateLastPosition(this._tempNextPos);
  }

  /**
   * Edit polygon.
   * @param {MouseEvent} event
   * @returns
   */
  _handleCanvasMoveEventForAfterDraw(event: MouseEvent) {
    if (this._focusedPointPrimitive) {
      const position = this.getWorldPosition(event.pos, cart3Scratch);

      if (!defined(position) || !position) {
        return;
      }
    }
  }

  /**
   * This function is Edit polygon (snapping).
   * @param {MouseEvent} event
   */
  _handleCanvasMoveEventForEdit(event: MouseEvent) {
    const position = this.getWorldPosition(event.pos, cart3Scratch);
    const polyline = this._polygon.polyline;
    if (!position || !polyline) {
      return;
    }

    const scene = this._scene;
    const markerPosition3 = position.clone(cart3Scratch1);
    const nearestInfo =
      scene.mode === SceneMode.SCENE2D
        ? this.getNearestEdgeInfo2D(polyline.positions, markerPosition3)
        : this.getNearestEdgeInfo(polyline.positions, markerPosition3);

    const markerPosition2 = SceneTransforms.worldToDrawingBufferCoordinates(
      scene,
      position,
      cart2Scratch,
    );

    const basePosition = SceneTransforms.worldToDrawingBufferCoordinates(
      scene,
      nearestInfo.basePos,
      cart2Scratch1,
    );

    const vertexPosition = SceneTransforms.worldToDrawingBufferCoordinates(
      scene,
      nearestInfo.vertexPos,
      cart2Scratch2,
    );

    if (!markerPosition2 || !basePosition || !vertexPosition) {
      return;
    }

    const pixelDistFromSeg = basePosition
      ? Cartesian2.distance(markerPosition2, basePosition)
      : Number.POSITIVE_INFINITY;

    const pixelDistFromVertex = vertexPosition
      ? Cartesian2.distance(markerPosition2, vertexPosition)
      : Number.POSITIVE_INFINITY;

    if (!this._isDragInEdit) {
      this._snapVertex = undefined;
    }

    if (pixelDistFromVertex < SNAP_PIXEL_SIZE_TO_VERTEX) {
      this._markerPointPrimitive.position = nearestInfo.vertexPos;
      if (!this._snapVertex) {
        this._snapVertex = {
          vertexIndex: nearestInfo.vertexIdx,
          isMainVertex: true,
          polylinePrimitive: this._polygon.polyline,
          polygonPrimitive: this._polygon.polygon,
        } as Vertex;

        this._snapMode = SnapMode.VERTEX;

        this._polygon.updateMainVertex(
          this._snapVertex,
          undefined,
          this._eventVertexModifiedInPolygon,
          PointState.HOVER,
        );
      }
    } else if (pixelDistFromSeg < SNAP_PIXEL_SIZE_TO_EDGE) {
      this._markerPointPrimitive.position = nearestInfo.basePos;
      this._resetFocusedPointPrimitive();

      this._snapMode = SnapMode.EDGE;
    } else {
      this._resetFocusedPointPrimitive();
      this._snapMode = SnapMode.NONE;
    }

    // Check if line snapped.
    if (this._snapMode === SnapMode.EDGE) {
      this._focusedSnapPoint = {
        segStartIdx: nearestInfo.segIdx,
        position: nearestInfo.basePos,
      };
    }

    // Stop camera movements while snap.
    const screenSpaceController = this._scene.screenSpaceCameraController;

    if (this._snapVertex) {
      screenSpaceController.enableRotate =
        this._scene.mode !== SceneMode.SCENE3D;
      screenSpaceController.enableTranslate =
        this._scene.mode === SceneMode.SCENE3D;
    } else {
      screenSpaceController.enableRotate =
        this._scene.mode === SceneMode.SCENE3D;
      screenSpaceController.enableTranslate =
        this._scene.mode !== SceneMode.SCENE3D;
    }

    // Check if vertex is dragging.
    if (this._isDragInEdit && this._snapVertex) {
      this._polygon.updateMainVertex(
        this._snapVertex,
        position,
        this._eventVertexModifiedInPolygon,
        PointState.ACTIVE,
      );
      if (this._snapMode === SnapMode.VERTEX) {
      } else if (this._snapMode === SnapMode.EDGE) {
        // this._eventVertexModifiedInPolygon.raiseEvent([this._snapVertex], [this._polygon], [this]);
      }
    }
  }

  _finishDrawingOneFeature() {
    if (!this._polygon) {
      // eslint-disable-next-line no-new
      new DeveloperError('Polygon did not initialized!');
      return;
    }

    this._viewer.entities.remove(this._dashedEdge);
    this._polygon.finishDrawing();

    if (!isPolygon(this._polygon.positions.length)) {
      this.deletePolygon();
      return;
    }

    // Transfer custom properties to the polygon.
    if (this._properties) {
      this._polygon.appendProperties(this._properties);
      this._polygon.isLabelSizeFixed = !!this._properties.isLabelSizeFixed;
    }
    if (this._deleteOption) {
      this._polygon.appendProperties(this._deleteOption);
    }
    if (this._selectOption) {
      this._polygon.appendProperties(this._selectOption);
    }
    // Polygon created.
    this._polygons.push(this._polygon);
    this._polygon.toggleVisibilityMainVertex(false);
    this._eventPolygonCreated.raiseEvent([this._polygon], [this]);

    if (this._isMultipleDrawing) {
      this._mode = DrawingMode.AfterDraw;
    } else {
      this._mode = DrawingMode.EditDraw;
    }

    this._eventPolygonDrawingEnd.raiseEvent();
  }

  _reset() {
    const count = this._polygons.length;
    const id = createGuid();

    this._polygon = new Polygon({
      id: id,
      name: `Polygon${count}`,
      scene: this._scene,
      primitives: this._primitives,
      pointOptions: this._options.pointOptions,
      polylineOptions: this._options.polylineOptions,
      polygonOptions: this._options.polygonOptions,
      labelOptions: this._options.labelOptions,
      createVertices: true,
      locale: this._options.local,
      type: FeatureIdentity.POLYGON,
      isReduceNumberOfVertex: false,
    });

    if (this._isUseStyleOptions && this._styleOptions) {
      this._polygon.changeStyle(this._styleOptions);
    }
    this._polygon.appendProperties({ layer: this._properties['layer'] });
    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition.x = Number.POSITIVE_INFINITY;
    this._lastClickPosition.y = Number.POSITIVE_INFINITY;

    clearArray(this._drawHistory);
  }

  _resetAll() {
    if (!this.polygons) {
      const count = this._polygons.length;
      for (let i = 0; i < count; i++) {
        this._polygons[i].destroy();
      }
      this._polygons = [];
    }
  }

  resetDrawingStyle() {
    this._styleOptions = this._defaultStyle;
  }

  enableEditPolygon(id: string) {
    const selectedPolygon = this.getPolygonById(id);
    if (selectedPolygon) {
      for (const polygon of this.polygons) {
        polygon.toggleVisibilityMainVertex(false);
      }
      this._polygon = selectedPolygon;
      this._polygon.isReduceNumberOfVertex = false;
      this._polygon.toggleVisibilityMainVertex(true);
      this.mode = DrawingMode.EditDraw;
    }
  }

  selectEditPolygon(id: string) {
    const selectedPolygon = this.getPolygonById(id);
    if (selectedPolygon) {
      this._polygon = selectedPolygon;
      this._polygon.toggleVisibilityMainVertex(true);
      this.mode = DrawingMode.EditDraw;
      selectedPolygon.primitives.raiseToTop(selectedPolygon.polygon);
      selectedPolygon.primitives.raiseToTop(selectedPolygon.polyline);
    }
  }

  disableEdit() {
    for (const polygon of this.polygons) {
      polygon.toggleVisibilityMainVertex(false);
    }
    if (this._polygon) {
      this._polygon.isReduceNumberOfVertex = true;
    }
    this.mode = DrawingMode.None;
  }

  enableMultipleDrawing() {
    this._isMultipleDrawing = true;
  }

  enableSingleDrawing() {
    this._isMultipleDrawing = false;
  }

  createDashedDrawingEdge(positions: Cartesian3[]) {
    this._dashedEdge = this._viewer.entities.add({
      name: 'dashed edge',
      polyline: {
        positions: [positions[positions.length - 1], this._tempNextPos],
        width: DrawingSettings.lineWidth,
        material: new PolylineDashMaterialProperty({
          color: DrawingSettings.color,
        }),
        clampToGround: this._clamped ?? true,
      },
    });
  }

  toggleClampToGround(clampToGround: boolean) {
    this._clamped = clampToGround;
    const { polygonOptions, polylineOptions } = this._options;
    polylineOptions.clampToGround = this._clamped;
    polygonOptions.clampToGround = this._clamped;
  }

  enableRotateGlobe() {
    this._scene.screenSpaceCameraController.enableRotate = true;
    this._scene.screenSpaceCameraController.enableTranslate = true;
  }

  disableRotateGlobe() {
    this._scene.screenSpaceCameraController.enableRotate = false;
    this._scene.screenSpaceCameraController.enableTranslate = false;
  }

  destroy() {
    return destroyObject(this);
  }
}

export { PolygonDrawing };
