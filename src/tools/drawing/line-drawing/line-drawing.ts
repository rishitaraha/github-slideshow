// q@ts-nocheck
/* qeslint-disable */
import {
  Billboard,
  BillboardCollection,
  Cartesian2,
  Cartesian3,
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
import { Line } from '../../../entities';
import { MouseButton } from '../../../shared';
import {
  MIN_LINE_VERTEX_NUM,
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
  EditActionType,
  EditAction,
  PointState,
  SnapPointOptions,
  UndoRedoAction,
} from '../types';
import { SnapMode } from './enums';
import { LineDrawingConstructorOptions } from './types';
import { isMobile } from 'react-device-detect';

const cart3Scratch = new Cartesian3();
const cart3Scratch1 = new Cartesian3();
const cart2Scratch = new Cartesian2();
const cart2Scratch1 = new Cartesian2();
const cart2Scratch2 = new Cartesian2();
const mouseDelta = 10;
const ESC_KEY = 'Escape';

/**
 * Check if number of vertex is greater than minimum number of line vertices.
 * @param {number} n
 * @returns {boolean}
 */
const isLine = (n: number) => n >= MIN_LINE_VERTEX_NUM;

/**
 * LineDrawing is one kind of MapTool to draw and to edit line.
 * _mode: To check if it's on drawing state, or finished drawing, or on editing state ...
 * _line: To store Line.
 * _lines: To store multiple lines.
 * _lastClickPosition: Mouse position on UI, when click the MLB, mouse position will be saved.
 * _tempNextPos: Store mouse position on cesium scene.
 */
class LineDrawing extends MapTool {
  protected _mode: DrawingMode;
  protected _line!: Line;
  protected _lines: Line[];
  protected readonly _lastClickPosition: Cartesian2;
  protected readonly _tempNextPos: Cartesian3;

  private readonly _scene: Scene;

  private readonly _options: LineDrawingConstructorOptions;
  private _focusedPointPrimitive: Vertex | undefined;

  // Event implementation
  private readonly _eventVertexCreatedWhileDrawing: Event;
  private readonly _eventLineCreated: Event;
  private readonly _eventVertexModifiedInLine: Event;
  private readonly _eventVertexAddedInLine: Event;
  private readonly _eventVertexDeletedInLine: Event;
  private readonly _eventLineDeleted: Event;
  private readonly _eventDashedLineDeleted: Event;

  private readonly _eventLineDrawingStarted: Event;
  private readonly _eventLineDrawingEnd: Event;

  // Marker point following mouse position
  private readonly _markerPointPrimitive: PointPrimitive;
  private readonly _markerPointCollection: PointPrimitiveCollection;

  private _primitives: PrimitiveCollection;
  // Dash last edge
  private _dashedEdge: Entity;

  // Check if it's dragging.
  private _isDragInEdit: boolean;
  private _isDragInDraw: boolean;
  // Check if it was panned.
  private _wasPanned: boolean;
  // -1: no snapped, 0: snapped on vertex, 1: snapped on edge
  private _snapMode: SnapMode;
  // Snapped point on line edge.
  private _focusedSnapPoint: SnapPointOptions | undefined;
  // Vertex added on line edge from the snapped point.
  private _snapVertex: Vertex | undefined;

  // Custom properties.
  private _properties: Record<string, any> = {};
  // Style options to save
  private _styleOptions?: StyleOptions;
  private _defaultStyle: StyleOptions;
  private _isUseStyleOptions = false;
  // Multiple feature/single feature drawing
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

  // Mobile drawing support
  private _billboardCollection?: BillboardCollection;
  private _billboardCheckmark?: Billboard;

  private _prevMousePosition: Cartesian2 = new Cartesian2();

  constructor(options: LineDrawingConstructorOptions) {
    super(options);

    const scene = this._viewer.scene;

    this._tempNextPos = new Cartesian3();
    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition = new Cartesian2(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    this._scene = scene;
    this._lines = options.lines;
    this._options = options;

    this._eventVertexCreatedWhileDrawing = new Event();
    this._eventLineCreated = new Event();
    this._eventVertexModifiedInLine = new Event();
    this._eventVertexAddedInLine = new Event();
    this._eventVertexDeletedInLine = new Event();
    this._eventLineDeleted = new Event();
    this._eventDashedLineDeleted = new Event();

    this._eventLineDrawingStarted = new Event();
    this._eventLineDrawingEnd = new Event();

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
    this._snapMode = SnapMode.NONE;

    scene.camera.moveEnd.addEventListener(this._cameraMoveEndEvent);
    if (options.properties) {
      this._properties = options.properties;
    }

    this._defaultStyle = {
      lineStyleOptions: {
        strokeColor: DrawingSettings.color.toCssColorString(),
        strokeThickness: DrawingSettings.lineWidth,
        labelColor: DrawingSettings.color.toCssColorString(),
        opacity: 1.0,
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

  private _cameraMoveEndEvent = () => {
    if (this.lines) {
      this.updateLines();
      for (let i = 0; i < this.lines.length; i++) {
        this.lines[i].updateHeightOfPoint();
        this.lines[i].updateLabelPosition();
      }
    }
  };

  // set style options when activation
  setStyleOptions(styleOptions: StyleOptions) {
    this._styleOptions = styleOptions;
    this.useStyleOptions(true);
  }

  useStyleOptions(flag = true) {
    this._isUseStyleOptions = flag;
  }
  /**
   * Whenever camera changed, update line primitives.
   * Use this function to calculate lines culling volume in multi-line drawing mode (not now).
   * When drawing a lot of lines and zooming camera, very small lines(i.e. with very small culling volume)
   * should be invisible so that the render efficiency would be high.
   * Reference for Culling Volume : https://cesium.com/learn/cesiumjs/ref-doc/CullingVolume.html
   */
  updateLines() {
    const scene = this._scene;

    const camera = scene.camera;
    const frustum = camera.frustum;

    const cullingVolume = frustum.computeCullingVolume(
      camera.position,
      camera.direction,
      camera.up,
    );

    this._lines.forEach((line: Line) => {
      line.update(cullingVolume);
    });
  }

  get options() {
    return this._options;
  }

  activate() {
    super.activate();

    if (!isMobile) {
      this.showMarker();
    } else {
      this.hideMarker();
    }

    this._reset();
    this._resetAll();

    return true;
  }

  deactivate() {
    super.deactivate();
    const scene = this._scene;

    if (this._line && this._mode === DrawingMode.Drawing) {
      this.deleteLine();
      this.deleteDash();
    }

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

  get lines() {
    return this._lines;
  }

  get eventVertexAddedInLine() {
    return this._eventVertexAddedInLine;
  }

  get eventVertexCreatedWhileDrawing() {
    return this._eventVertexCreatedWhileDrawing;
  }

  get eventVertexDeletedInLine() {
    return this._eventVertexDeletedInLine;
  }

  get eventVertexModifiedInLine() {
    return this._eventVertexModifiedInLine;
  }

  get eventLineDeleted() {
    return this._eventLineDeleted;
  }

  get eventLineCreated() {
    return this._eventLineCreated;
  }

  get eventLineDrawingStarted() {
    return this._eventLineDrawingStarted;
  }

  get eventLineDrawingEnd() {
    return this._eventLineDrawingEnd;
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

  get isUseStyleOptions() {
    return this._isUseStyleOptions;
  }

  get styleOptions() {
    return this._styleOptions;
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
   * Get line by id.
   * @param {string} id
   * @returns
   */
  getLineById(id: string) {
    const filteredLine = this._lines.find((line) => line.id === id);
    if (filteredLine) {
      return filteredLine;
    }
    return null;
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
   * Mouse event on canvas, triggered when MLB or MRB clicked
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
        // Right-clicking on a vertex
        this._editUndoHistory.push({
          id: this._line.id,
          geometryType: 'Line',
          vertexId: this._snapVertex.vertexIndex,
          vertexPosition: Cartesian3.clone(
            this._line.positions[this._snapVertex.vertexIndex],
            new Cartesian3(),
          ),
          action: EditActionType.remove,
        });
        this.deleteVertex(this._snapVertex);
        // Check if number of vertex < 3, remove and reset line.
        if (!isLine(this._line.positions.length)) {
          this.deleteLine();
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
          this._line.positions[this._snapVertex.vertexIndex],
          new Cartesian3(),
        );
      }
    }

    if (
      event.button === MouseButton.LeftButton &&
      this._mode === DrawingMode.EditDraw &&
      this._snapMode === SnapMode.EDGE
    ) {
      // Creating a new vertex on edge.
      if (this._focusedSnapPoint) {
        this._snapVertex = this._line.insertVertex(
          this._focusedSnapPoint.position,
          this._focusedSnapPoint.segStartIdx,
        );
        this._editUndoHistory.push({
          id: this._line.id,
          geometryType: 'Line',
          vertexId: this._focusedSnapPoint.segStartIdx + 1,
          vertexPosition: this._focusedSnapPoint.position,
          action: EditActionType.add,
        });
        this._eventVertexAddedInLine.raiseEvent(
          [this._snapVertex],
          [this._line],
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
        this.deleteLine();
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
    if (this._line && this._line.positions.length > 1) {
      const positions = this._line.positions;
      const deletedPosition = new Cartesian3();
      Cartesian3.clone(positions[positions.length - 1], deletedPosition);

      this._line.deletePoint(positions.length - 1);

      this._viewer.entities.remove(this._dashedEdge);
      this.createDashedDrawingEdge(positions);
      this._line.finishDrawing();
      this._drawHistory.push(deletedPosition);
    } else {
      this.deleteLine();
      this.deleteDash();
    }
  }

  redoDraw() {
    if (this._line && this._drawHistory.length > 0) {
      const deletedPosition = this._drawHistory.pop();
      if (!deletedPosition) {
        return;
      }
      this._line.addPoint(deletedPosition);

      const positions = this._line.positions;
      this._viewer.entities.remove(this._dashedEdge);
      this.createDashedDrawingEdge(positions);
      this._line.finishDrawing();
    }
  }

  clearUndoRedoHistory() {
    clearArray(this._editUndoHistory);
    clearArray(this._editRedoHistory);
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
          id: this._line.id,
          geometryType: 'Line',
          vertexId: editAction.vertexId,
          vertexPosition: Cartesian3.clone(
            this._line.positions[editAction.vertexId],
            new Cartesian3(),
          ),
          action: EditActionType.remove,
        };
        this._line.deletePoint(editAction.vertexId);
        if (this._undoRedoAction === UndoRedoAction.undo) {
          this._editRedoHistory.push(removeAction);
        } else if (this._undoRedoAction === UndoRedoAction.redo) {
          this._editUndoHistory.push(removeAction);
        }
        return;
      case EditActionType.modify:
        const modifyAction: EditAction = {
          id: this._line.id,
          geometryType: 'Line',
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
            polylinePrimitive: this._line.polyline,
          } as Vertex;
          this._line.updateMainVertex(
            modifiedVertex,
            editAction.vertexPosition,
            this._eventVertexModifiedInLine,
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
          id: this._line.id,
          geometryType: 'Line',
          vertexId: editAction.vertexId,
          vertexPosition: Cartesian3.clone(
            editAction.vertexPosition,
            new Cartesian3(),
          ),
          action: EditActionType.add,
        };
        if (editAction.vertexPosition) {
          const vertex = this._line.insertVertex(
            editAction.vertexPosition,
            editAction.vertexId - 1,
          );
          if (vertex) {
            this._line.updateMainVertex(
              vertex,
              editAction.vertexPosition,
              this.eventVertexModifiedInLine,
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

  /**
   * Remove and reset Line.
   */
  deleteLine() {
    this._line.positions = [];
    this._line._hideAllPrimitives();
    this._reset();

    if (this._mode === DrawingMode.EditDraw) {
      this._eventLineDeleted.raiseEvent([this._line], [this]);
    }
  }

  // Remove dash line.
  deleteDash() {
    this._viewer.entities.remove(this._dashedEdge);
    this._eventDashedLineDeleted.raiseEvent();
  }

  /**
   * Delete Vertex
   */
  deleteVertex(vertex: Vertex) {
    this._line.deletePoint(vertex.vertexIndex);
    this.eventVertexDeletedInLine.raiseEvent([vertex], [this._line], [this]);
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

    if (distance < mouseDelta && !isMobile) {
      return;
    }

    const position = this.getWorldPosition(event.pos, cart3Scratch);

    if (!defined(position) || !position) {
      return;
    }

    if (!isMobile) {
      const vertex = this._line.addPoint(
        Cartesian3.clone(position, new Cartesian3()),
      );
      this._eventVertexCreatedWhileDrawing.raiseEvent(
        [vertex],
        [this._line],
        [this],
      );
    } else {
      if (
        isLine(this._line.positions.length) &&
        checkSnapToVertex(
          this._scene,
          position,
          this._line.positions[this._line.positions.length - 1],
        )
      ) {
        this._finishDrawingOneFeature();
        this._reset();
        if (this._billboardCheckmark) {
          this._billboardCheckmark.show = false;
        }
      } else {
        const vertex = this._line.addPoint(
          Cartesian3.clone(position, new Cartesian3()),
        );
        this._eventVertexCreatedWhileDrawing.raiseEvent(
          [vertex],
          [this._line],
          [this],
        );
      }

      if (this._line.positions.length > 1 && this._billboardCheckmark) {
        if (this._line.mainVertexPointPrimitives) {
          this._line.mainVertexPointPrimitives[
            this._line.positions.length - 2
          ].show = true;
          this._line.mainVertexPointPrimitives[
            this._line.positions.length - 1
          ].show = false;
        }
        this._billboardCheckmark.position =
          this._line.positions[this._line.positions.length - 1];
        this._billboardCheckmark.show = true;
      }
    }

    if (this._mode !== DrawingMode.Drawing) {
      this._mode = DrawingMode.Drawing;
      this._eventLineDrawingStarted.raiseEvent();
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
    }

    if (this._focusedPointPrimitive) {
      this._focusedPointPrimitive = undefined;
    } else if (
      event.button === MouseButton.RightButton &&
      this._mode !== DrawingMode.EditDraw &&
      !this._wasPanned
    ) {
      this._finishDrawingOneFeature();
    }

    if (this._snapVertex && this._isDragInEdit && this._vertexPosition) {
      this._editUndoHistory.push({
        id: this._line.id,
        geometryType: 'Line',
        vertexId: this._snapVertex.vertexIndex,
        vertexPosition: Cartesian3.clone(
          this._vertexPosition,
          new Cartesian3(),
        ),
        action: EditActionType.modify,
        modifiedPosition: Cartesian3.clone(
          this._line.positions[this._snapVertex.vertexIndex],
          new Cartesian3(),
        ),
      });
      this._vertexPosition = undefined;
    }

    this._isDragInEdit = false;
    this._isDragInDraw = false;
    this._wasPanned = false;
    this._snapVertex = undefined;
    this._snapMode = SnapMode.NONE;
  }

  /**
   * Update next point with current mouse position.
   * @param {MouseEvent} event
   * @returns
   */
  _handleCanvasMoveEventForDrawing(event: MouseEvent) {
    const nextPos = this.getWorldPosition(event.pos, cart3Scratch);

    if (!defined(nextPos) || !nextPos) {
      return;
    }

    Cartesian3.clone(nextPos, this._tempNextPos);

    const positions = this._line.positions;
    this._viewer.entities.remove(this._dashedEdge);
    this.createDashedDrawingEdge(positions);
    this._line.finishDrawing();
  }

  /**
   * Edit Line
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
   * This function is Edit line (snapping).
   * @param {MouseEvent} event
   */
  _handleCanvasMoveEventForEdit(event: MouseEvent) {
    const position = this.getWorldPosition(event.pos, cart3Scratch);
    const polyline = this._line.polyline;
    if (!position || !polyline) {
      return;
    }

    const markerPosition3 = position.clone(cart3Scratch1);
    const nearestInfo = this.getNearestEdgeInfo(
      polyline.positions,
      markerPosition3,
    );

    const scene = this._scene;

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

    if (!markerPosition2 || !vertexPosition || !basePosition) {
      return;
    }

    const pixelDistFromSeg = Cartesian2.distance(markerPosition2, basePosition);
    const pixelDistFromVertex = Cartesian2.distance(
      markerPosition2,
      vertexPosition,
    );

    if (!this._isDragInEdit) {
      this._snapVertex = undefined;
    }

    if (pixelDistFromVertex < SNAP_PIXEL_SIZE_TO_VERTEX) {
      this._markerPointPrimitive.position = nearestInfo.vertexPos;
      if (!this._snapVertex) {
        this._snapVertex = {
          vertexIndex: nearestInfo.vertexIdx,
          isMainVertex: true,
          polylinePrimitive: this._line.polyline,
        } as Vertex;

        this._snapMode = SnapMode.VERTEX;

        this._line.updateMainVertex(
          this._snapVertex,
          undefined,
          this._eventVertexModifiedInLine,
          PointState.HOVER,
        );
      }
    } else if (
      pixelDistFromSeg < SNAP_PIXEL_SIZE_TO_EDGE &&
      nearestInfo.segIdx !== this._line.polyline.positions.length - 1
    ) {
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
    if (this._snapVertex) {
      if (this._scene.mode === SceneMode.SCENE3D) {
        this._scene.screenSpaceCameraController.enableRotate = false;
      } else if (this._scene.mode === SceneMode.SCENE2D) {
        this._scene.screenSpaceCameraController.enableTranslate = false;
      }
    } else {
      this.enableRotateGlobe();
    }

    // Check if dragging Vertex.
    if (this._isDragInEdit && this._snapVertex) {
      this._line.updateMainVertex(
        this._snapVertex,
        position,
        this._eventVertexModifiedInLine,
        PointState.ACTIVE,
      );
      if (this._snapMode === SnapMode.VERTEX) {
      } else if (this._snapMode === SnapMode.EDGE) {
        // this._eventVertexModifiedInLine.raiseEvent([this._snapVertex], [this._line], [this]);
      }
    }
  }

  _finishDrawingOneFeature() {
    if (!this._line) {
      // eslint-disable-next-line no-new
      new DeveloperError('Line did not initialized!');
      return;
    }

    this._viewer.entities.remove(this._dashedEdge);
    this._line.finishDrawing();

    if (!isLine(this._line.positions.length)) {
      this.deleteLine();
      return;
    }

    // Transfer custom properties to the polygon.
    if (this._properties) {
      this._line.appendProperties(this._properties);
      this._line.isLabelSizeFixed = !!this._properties.isLabelSizeFixed;
    }
    if (this._deleteOption) {
      this._line.appendProperties(this._deleteOption);
    }
    if (this._selectOption) {
      this._line.appendProperties(this._selectOption);
    }

    // Line created.
    this._lines.push(this._line);
    this._eventLineCreated.raiseEvent([this._line], [this]);
    this._line.toggleVisibilityMainVertex(false);

    if (this._isMultipleDrawing) {
      this._mode = DrawingMode.AfterDraw;
    } else {
      this._mode = DrawingMode.EditDraw;
    }

    this._eventLineDrawingEnd.raiseEvent();
  }

  _reset() {
    const count = this._lines.length;
    const id = createGuid();
    this._line = new Line({
      id: id,
      name: `Line${count}`,
      scene: this._scene,
      primitives: this._primitives,
      pointOptions: this._options.pointOptions,
      polylineOptions: this._options.polylineOptions,
      labelOptions: this._options.labelOptions,
      createVertices: true,
      locale: this._options.local,
      type: FeatureIdentity.LINE,
    });

    if (this._isUseStyleOptions && this._styleOptions) {
      this._line.changeStyle(this._styleOptions);
    }

    this._line.appendProperties({ layer: this._properties['layer'] });
    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition.x = Number.POSITIVE_INFINITY;
    this._lastClickPosition.y = Number.POSITIVE_INFINITY;

    clearArray(this._drawHistory);
  }

  _resetAll() {
    if (!this.lines) {
      const count = this._lines.length;
      for (let i = 0; i < count; i++) {
        this._lines[i].destroy();
      }
      this._lines = [];
    }
  }

  resetDrawingStyle() {
    this._styleOptions = this._defaultStyle;
  }

  enableEditLine(id: string) {
    const selectedLine = this.getLineById(id);
    if (selectedLine) {
      for (const line of this.lines) {
        line.toggleVisibilityMainVertex(false);
      }
      this._line = selectedLine;
      this._line.toggleVisibilityMainVertex(true);
      this.mode = DrawingMode.EditDraw;
    }
  }

  selectEditLine(id: string) {
    const selectedLine = this.getLineById(id);
    if (selectedLine) {
      this._line = selectedLine;
      this._line.toggleVisibilityMainVertex(true);
      this.mode = DrawingMode.EditDraw;
      selectedLine.primitives.raiseToTop(selectedLine.polyline);
    }
  }

  disableEdit() {
    for (const line of this.lines) {
      line.toggleVisibilityMainVertex(false);
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
    const { polylineOptions } = this._options;
    this._dashedEdge = this._viewer.entities.add({
      name: 'dashed edge',
      polyline: {
        positions: [positions[positions.length - 1], this._tempNextPos],
        width: DrawingSettings.lineWidth,
        material: new PolylineDashMaterialProperty({
          color: DrawingSettings.color,
        }),
        clampToGround: polylineOptions.clampToGround ?? true,
      },
    });
  }

  toggleClampToGround(clampToGround: boolean) {
    const { polylineOptions } = this._options;
    polylineOptions.clampToGround = clampToGround;
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

export { LineDrawing };
