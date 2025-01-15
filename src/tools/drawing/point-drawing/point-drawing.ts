import {
  Billboard,
  BillboardCollection,
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  combine,
  createGuid,
  defined,
  destroyObject,
  Event,
  Intersect,
  PointPrimitive,
  PointPrimitiveCollection,
  PrimitiveCollection,
  Scene,
  SceneMode,
  SceneTransforms,
} from 'cesium';
import logger from 'loglevel';
import { Point } from '../../../entities/point';
import { MouseButton } from '../../../shared';
import {
  EPS,
  MAIN_VERTICES_MINIMUM_PIXEL_SIZE,
  MOUSE_DELTA,
  SNAP_PIXEL_SIZE_TO_VERTEX,
} from '../../../shared/constants';

import { clearArray, updateHeightOfPointPrimitives } from '../../../utils';
import { MapTool, MouseEvent, SelectMode } from '../../base';
import { StyleOptions } from '../../style';
import DrawingSettings from '../drawing-tool-settings';
import { DrawingMode } from '../enums';
import { SnapPointOptions } from '../types';
import { SnapMode } from './enums';
import { PointDrawingConstructorOption } from './types';
import { FeatureIdentity } from '../../../types';

const cart3Scratch = new Cartesian3();

class PointDrawing extends MapTool {
  protected _mode: DrawingMode;
  protected _points: Point[];
  protected _pointPrimitiveCollection: PointPrimitiveCollection;
  protected _positions: Cartesian3[];
  protected _boundingSphere: BoundingSphere;
  protected readonly _lastClickPosition: Cartesian2;
  protected readonly _tempNextPos: Cartesian3;

  private readonly _scene: Scene;

  private readonly _options: PointDrawingConstructorOption;
  private _focusedPointPrimitive: Point | undefined;

  private readonly _eventPointCreated: Event;
  private readonly _eventPointDeleted: Event;
  private readonly _eventPointDragging: Event;
  private readonly _eventPointReleased: Event;

  // Marker point is following mouse position.
  private readonly _markerPointPrimitive: PointPrimitive;
  private readonly _markerPointCollection: PointPrimitiveCollection;

  // To check if is dragging.
  private _isDragInEdit: boolean;
  private _isDragInDraw: boolean;
  // -1: no snapped, 0: snapped on vertex, 1: snapped on edge
  private _snapMode: SnapMode;
  // Snapped point on line edge.
  private _focusedSnapPoint: SnapPointOptions | undefined;
  // Vertex added on line edge from the snapped point.
  private _snapPointIdx = -1;
  // Custom properties.
  private _properties: Record<string, any> = {};
  // Style options to store.
  private _styleOptions?: StyleOptions;
  private _defaultStyle: StyleOptions;
  private _isUseStyleOptions = false;
  // Delete option
  private _deleteOption?: Record<string, any>;
  // Select option
  private _selectOption?: Record<string, any>;
  // Show point as primitive or shape.
  private _isShowShape = true;
  // Check if panned or not.
  private _wasPanned = false;
  // Imported points.
  _importedPoints: Point[];
  _importedClusters: Billboard[];
  _clusterBillboards: BillboardCollection;

  constructor(options: PointDrawingConstructorOption) {
    super(options);

    const scene = this._viewer.scene;

    this._tempNextPos = new Cartesian3();
    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition = new Cartesian2(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    this._scene = scene;
    this._points = options.points;
    this._options = options;

    this._pointPrimitiveCollection = this.options.primitives.add(
      new PointPrimitiveCollection({ show: true }),
    );

    this._positions = [];

    this._eventPointCreated = new Event();
    this._eventPointDeleted = new Event();
    this._eventPointDragging = new Event();
    this._eventPointReleased = new Event();
    this._boundingSphere = new BoundingSphere();

    this.updateBoundingSphere();

    this._markerPointCollection = this.options.primitives.add(
      new PointPrimitiveCollection({ show: true }),
    );
    this._markerPointPrimitive = this._markerPointCollection.add(
      this.options.markerOptions,
    );

    this._isDragInEdit = false;
    this._isDragInDraw = false;
    this._snapMode = SnapMode.NONE;

    scene.camera.moveEnd.addEventListener(this._cameraMoveEndEvent);

    if (options.properties) {
      this._properties = options.properties;
    }

    this._defaultStyle = {
      pointStyleOptions: {
        color: DrawingSettings.color.toCssColorString(),
        label: '',
        opacity: 1.0,
      },
    };

    this._importedPoints = [];
    this._importedClusters = [];
    this._clusterBillboards = this.options.primitives.add(
      new BillboardCollection(),
    );
  }

  private _cameraMoveEndEvent = () => {
    if (this.points) {
      this.updateBoundingSphere();
      this.updatePoints();
      const points = this.getPointPrimitives();
      updateHeightOfPointPrimitives(this._scene, points);
      for (let i = 0; i < this.points.length; i++) {
        this.points[i].position = this.points[i].primitive.position;
      }
    }
  };

  getPointPrimitives() {
    const points: PointPrimitive[] = [];
    for (const point of this._points) {
      points.push(point.primitive);
    }

    return points;
  }

  // Set style options when activation.
  setStyleOptions(styleOptions: StyleOptions) {
    this._styleOptions = styleOptions;
    this.useStyleOptions(true);
  }

  useStyleOptions(flag = true) {
    this._isUseStyleOptions = flag;
  }

  updatePoints() {
    const scene = this._scene;

    if (scene.mode === SceneMode.SCENE2D) {
      return;
    }

    const camera = scene.camera;
    const frustum = camera.frustum;

    const cullingVolume = frustum.computeCullingVolume(
      camera.position,
      camera.direction,
      camera.up,
    );

    const intersect = cullingVolume.computeVisibility(this._boundingSphere);

    if (intersect === Intersect.OUTSIDE) {
      this._pointPrimitiveCollection.show = false;
      return;
    } else {
      this._pointPrimitiveCollection.show = true;
    }

    const drawingBufferWidth = scene.drawingBufferWidth;
    const drawingBufferHeight = scene.drawingBufferHeight;

    const metersPerPixel = scene.camera.getPixelSize(
      this._boundingSphere,
      drawingBufferWidth,
      drawingBufferHeight,
    );

    if (metersPerPixel === 0) {
      logger.warn(
        "zero metersPerPixel! maybe the camera is contained in points's bounding sphere.",
      );
      return;
    }

    const pixelsPerMeter = 1.0 / metersPerPixel;
    const maxPixelSize = Math.max(drawingBufferWidth, drawingBufferHeight);
    const diameterInPixels = Math.min(
      pixelsPerMeter * (2.0 * this._boundingSphere.radius),
      maxPixelSize,
    );

    if (
      diameterInPixels >= MAIN_VERTICES_MINIMUM_PIXEL_SIZE ||
      this._points.length === 1
    ) {
      this._pointPrimitiveCollection.show = true;
    } else {
      this._pointPrimitiveCollection.show = false;
    }
  }

  get options() {
    return this._options;
  }

  activate() {
    super.activate();

    this._reset();
    this._resetAll();

    return true;
  }

  deactivate() {
    super.deactivate();
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

  get pointPrimitiveCollection() {
    return this._pointPrimitiveCollection;
  }

  set pointPrimitiveCollection(primitives: PointPrimitiveCollection) {
    this._pointPrimitiveCollection = primitives;
  }

  get points() {
    return this._points;
  }

  get eventPointCreated() {
    return this._eventPointCreated;
  }

  get eventPointDeleted() {
    return this._eventPointDeleted;
  }

  get eventPointDragging() {
    return this._eventPointDragging;
  }

  get eventPointReleased() {
    return this._eventPointReleased;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties: Record<string, any>) {
    this._properties = properties;
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

  get primitives() {
    return this.primitives;
  }

  set primitives(primitives: PrimitiveCollection) {
    this.options.primitives = primitives;
  }

  get isShowShape() {
    return this._isShowShape;
  }

  set isShowShape(value: boolean) {
    this._isShowShape = value;
  }
  /**
   * Get point by id.
   * @param {string} id
   * @returns
   */
  getPointById(id: string) {
    const filteredPoint = this._points.find((point) => point.id === id);
    if (filteredPoint) {
      return filteredPoint;
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
    if (
      event.button === MouseButton.LeftButton &&
      this._mode !== DrawingMode.EditDraw
    ) {
      this._isDragInDraw = true;
    } else if (
      event.button === MouseButton.RightButton &&
      this._mode !== DrawingMode.EditDraw
    ) {
      this._mode = DrawingMode.EditDraw;
    } else if (
      event.button === MouseButton.RightButton &&
      this._mode === DrawingMode.EditDraw
    ) {
      super.canvasPressEvent(event);
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
    }
  }

  /**
   * Remove and reset  Point.
   */
  deletePoint() {
    const lastPoint = this._points.pop();
    if (lastPoint) {
      lastPoint.show = false;
      lastPoint.destroy();
      this._eventPointDeleted.raiseEvent();
    }
    this._reset();
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

    const point = this.addPoint(position);
    this._eventPointCreated.raiseEvent([point], [this]);

    if (this._mode !== DrawingMode.Drawing) {
      this._mode = DrawingMode.Drawing;
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

    this._markerPointPrimitive.position = Cartesian3.clone(
      nextPos,
      cart3Scratch,
    );
    this.showMarker();

    if (this._mode === DrawingMode.EditDraw) {
      this._handleCanvasMoveEventForEdit(event);
    }

    if (this._isDragInDraw) {
      this._wasPanned = true;
    }
  }

  /**
   * Triggered when mouse button released on canvas.
   */
  canvasReleaseEvent(event) {
    if (MapTool.multiEditMode === SelectMode.Edit) {
      this._eventPointReleased.raiseEvent([
        this._focusedPointPrimitive ? this._focusedPointPrimitive : undefined,
      ]);
    }

    if (this._focusedPointPrimitive) {
      this._focusedPointPrimitive = undefined;
    }

    if (
      event.button === MouseButton.LeftButton &&
      this._mode !== DrawingMode.EditDraw &&
      !this._wasPanned
    ) {
      this._handleCanvasPressEventForDrawing(event);
    }

    this._isDragInEdit = false;
    this._snapPointIdx = -1;
    this._snapMode = SnapMode.NONE;
    this._isDragInDraw = false;
    this._wasPanned = false;

    if (this._scene.mode === SceneMode.SCENE3D) {
      this._scene.screenSpaceCameraController.enableRotate = true;
    } else if (this._scene.mode === SceneMode.SCENE2D) {
      this._scene.screenSpaceCameraController.enableTranslate = true;
    }
  }

  /**
   * This function is Edit point (snapping).
   * @param {MouseEvent} event
   */
  _handleCanvasMoveEventForEdit(event: MouseEvent) {
    const position = this.getWorldPosition(event.pos, cart3Scratch);
    const cart2Scratch = new Cartesian2();
    const cart2Scratch2 = new Cartesian2();

    if (!position) {
      return;
    }

    const nearestInfo = this.getNearestEdgeInfo(this._positions, position);

    const scene = this._scene;

    const markerPosition2 = SceneTransforms.worldToDrawingBufferCoordinates(
      scene,
      position,
      cart2Scratch,
    );

    const vertexPosition = SceneTransforms.worldToDrawingBufferCoordinates(
      scene,
      nearestInfo.vertexPos,
      cart2Scratch2,
    );

    if (!markerPosition2 || !vertexPosition) {
      return;
    }

    const pixelDistFromVertex = Cartesian2.distance(
      markerPosition2,
      vertexPosition,
    );

    if (!this._isDragInEdit) {
      this._snapPointIdx = -1;
    }

    if (pixelDistFromVertex < SNAP_PIXEL_SIZE_TO_VERTEX) {
      this._markerPointPrimitive.position = nearestInfo.vertexPos;
      if (this._snapPointIdx === -1) {
        this._snapPointIdx = nearestInfo.vertexIdx;
        this._snapMode = SnapMode.VERTEX;
      }
    } else {
      this._resetFocusedPointPrimitive();
      this._snapMode = SnapMode.NONE;
    }

    // Stop camera movements while snap.
    if (this._snapPointIdx >= 0) {
      if (this._scene.mode === SceneMode.SCENE3D) {
        this._scene.screenSpaceCameraController.enableRotate = false;
      } else if (this._scene.mode === SceneMode.SCENE2D) {
        this._scene.screenSpaceCameraController.enableTranslate = false;
      }
    }

    // Check if vertex is dragging.
    if (this._isDragInEdit && this._snapPointIdx >= 0) {
      const pointPosition = new Cartesian3();
      Cartesian3.clone(position, pointPosition);
      this._focusedPointPrimitive = this._points[this._snapPointIdx];
      this._points[this._snapPointIdx].position = pointPosition;
      this._points[this._snapPointIdx].updateLabelPosition();
      this._positions[this._snapPointIdx] = pointPosition;
      updateHeightOfPointPrimitives(this._scene, this.getPointPrimitives());
      if (MapTool.multiEditMode === SelectMode.Edit) {
        this._eventPointDragging.raiseEvent([
          this._focusedPointPrimitive ? this._focusedPointPrimitive : undefined,
        ]);
      }
    }
  }

  _reset() {
    this._mode = DrawingMode.BeforeDraw;
    this._lastClickPosition.x = Number.POSITIVE_INFINITY;
    this._lastClickPosition.y = Number.POSITIVE_INFINITY;
  }

  _resetAll() {
    if (!this.points) {
      const count = this._points.length;
      for (let i = 0; i < count; i++) {
        destroyObject(this._points[i]);
      }
      this._points = [];
    }
  }

  resetDrawingStyle() {
    this._styleOptions = this._defaultStyle;
  }

  set positions(positions: Cartesian3[]) {
    this._positions = positions;

    // Note that bounding sphere might not be correct if positions do not contains height values.
    this._boundingSphere = BoundingSphere.fromPoints(
      positions,
      this._boundingSphere,
    );

    if (this._pointPrimitiveCollection) {
      this._pointPrimitiveCollection.removeAll();
    }

    if (this._points) {
      clearArray(this._points);
      this._points = [];
    }

    for (let i = 0; i < positions.length; i++) {
      this.addPoint(positions[i]);
    }
  }

  /**
   * Add point primitive.
   * @param {Catesian3} position
   */
  addPoint(
    position: Cartesian3,
    pointId?: string,
    properties?: Record<string, any>,
    disableCameraMove?: boolean,
  ) {
    const pointPosition = new Cartesian3();
    Cartesian3.clone(position, pointPosition);

    this._positions.push(pointPosition);

    const id = pointId ?? createGuid();
    const pointName = `point ${this.points.length + 1}`;

    const pointPrimitive = this._pointPrimitiveCollection.add(
      combine(
        {
          id: pointId,
        },
        this.options.pointOptions,
      ),
    );

    pointPrimitive.position = position;
    pointPrimitive.show = false;

    const point = new Point({
      id,
      name: pointName,
      show: true,
      scene: this._scene,
      primitives: this.options.primitives,
      primitive: pointPrimitive,
      pointOptions: this.options.pointOptions,
      labelOptions: this.options.labelOptions,
      locale: this.options.local,
      position: position,
      isShowShape: this._isShowShape,
      properties: { ...this.properties, ...properties },
      type: FeatureIdentity.POINT,
    });

    if (this._isUseStyleOptions && this._styleOptions) {
      point.changeStyle(this._styleOptions);
    }
    if (this._deleteOption) {
      point.appendProperties(this._deleteOption);
    }
    if (this._selectOption) {
      point.appendProperties(this._selectOption);
    }

    point.appendProperties({ layer: this._properties['layer'] });
    this._points.push(point);
    this.updateBoundingSphere();

    const points = this.getPointPrimitives();
    updateHeightOfPointPrimitives(this._scene, points);

    point.position = point.primitive.position;

    if (!disableCameraMove) {
      this._scene.camera.moveBackward(EPS);
    }
    return point;
  }

  deleteAllImportedClusters() {
    this._importedClusters.forEach((cluster) => {
      cluster.show = false;
      this.options.primitives.remove(cluster);
    });

    this._importedPoints.forEach((point) => {
      point.show = false;
      point.destroy();
    });

    clearArray(this._importedClusters);
    clearArray(this._importedPoints);
  }
  drawPointAsMarker() {
    this._isShowShape = false;
  }

  drawPointAsShape() {
    this._isShowShape = true;
  }

  showAllPointsAsShape() {
    for (const point of this._points) {
      point.showShape();
    }
  }

  showAllPointsAsMarker() {
    for (const point of this._points) {
      point.showMarker();
    }
  }

  enableEdit() {
    this._mode = DrawingMode.EditDraw;
  }

  disableEdit() {
    this._mode = DrawingMode.None;
  }

  updateBoundingSphere() {
    BoundingSphere.fromPoints(this._positions, this._boundingSphere);
  }

  destroy() {
    return destroyObject(this);
  }
}

export { PointDrawing };
