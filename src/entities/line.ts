import {
  BillboardCollection,
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Color,
  combine,
  CullingVolume,
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  Event,
  PointPrimitive,
  PointPrimitiveCollection,
  SceneMode,
} from 'cesium';

import logger from 'loglevel';
import { PolylinePrimitive } from '../primitives';
import {
  EPS,
  POLYLINE_MINIMUM_PIXEL_SIZE,
  SELECTED_LINE_PRIMITIVE_COLOR,
} from '../shared/constants';
import { StyleOptions } from '../tools';
import DrawingSettings from '../tools/drawing/drawing-tool-settings';
import { ExportedWKTType, PointState } from '../tools/drawing/types';
import { LineConstructorOptions, PointOptions, Vertex } from '../types';
import {
  GEOMETRY_TYPE,
  getCentroidOfPolyline,
  getLabelSVG,
  LabelSVGType,
  updateHeightOfPointPrimitives,
  updateVertexStyle,
} from '../utils';
import { isIncludeProperty, radianToString } from '../utils/common';
import { BaseFeature } from './base/base-feature';
import { updateHeightOfPosition } from '../utils/update-height-of-position';

/**
 * Line represents polyline primitive on the scene.
 * _primitives: Store all primitives to be rendered for line, ex., vertex, polyline(edge).
 * _show: Show/Hide line.
 * _show_Vertices: Show/Hide vertex.
 * _id: Primitive index.
 * _name: Primitive name.
 * _mainVertexPointCollection: Store vertex which construct line.
 */
export class Line extends BaseFeature {
  private readonly _pointOptions: PointOptions;
  private _mainVertexPointCollection: PointPrimitiveCollection | undefined;
  private _mainVertexPointPrimitives: Vertex[] | undefined;
  private _highlightPoint: PointPrimitiveCollection | undefined;
  private readonly _polylinePrimitive: PolylinePrimitive;
  private readonly _showChanged: Event;

  constructor(options: LineConstructorOptions) {
    super(options);

    const primitives = defaultValue(options.primitives, this._scene.primitives);

    const pointOptions = options.pointOptions;
    const polylineOptions = options.polylineOptions;

    this._positions = defaultValue(options.positions, []);
    this._primitives = primitives;

    this._pointOptions = pointOptions;

    this._polylinePrimitive = primitives.add(
      new PolylinePrimitive(
        combine(
          {
            show: options.show,
            positions: options.positions,
            scene: this._scene,
            id: `${this._id}|${GEOMETRY_TYPE.LINE}`,
          },
          polylineOptions,
        ),
      ),
    );

    if (options.createVertices) {
      this._createVertices(options);
    }

    this._selectedLocale = options.locale;
    this._showVertices = true;

    BoundingSphere.fromPoints(this._positions, this._boundingSphere);

    this._showChanged = new Event();
    if (options.properties) {
      this._properties = options.properties;
    }
    this._properties = {
      ...this._properties,
      type: GEOMETRY_TYPE.LINE,
      isEditable: false,
    };

    this._styleOptions = DrawingSettings.getPolylineDefaultStyle();
    this._focusedStyle = DrawingSettings.getPolylineFocusStyle();

    this._scene.camera.moveEnd.addEventListener(this._eventLabelSizeFix);
  }

  setLabel(labelText: string, labelOptions?: LabelSVGType) {
    if (labelText === '') {
      this.destroyLabel();
      return;
    }

    if (!this._labelCollection && !this._label) {
      this.createLabel();
    }

    this._labelText = labelText;
    let labelSVG: string;
    if (labelOptions) {
      this._labelOptions = labelOptions;
      this._labelOptions.text = this._labelText;
      labelSVG = getLabelSVG(this._labelOptions);
    } else {
      labelSVG = getLabelSVG({ text: this._labelText });
    }

    if (this._label) {
      this._label.image = labelSVG;

      this.updateLabelPosition();
      this._label.show = true;
    }
  }

  setLabelStyle(styleOptions: LabelSVGType) {
    if (!this._labelText) {
      return;
    }
    this._labelOptions = { ...this._labelOptions, ...styleOptions };
    this._labelOptions.text = this._labelText;
    const labelSVG = getLabelSVG(this._labelOptions);

    if (this._label) {
      this._label.image = labelSVG;
    }
  }

  hideLabel() {
    if (this._label) {
      this._label.show = false;
    }
  }

  showLabel() {
    if (this._labelText && this._labelText !== '' && this._label) {
      this._label.show = true;
    }
  }

  destroyLabel() {
    this._labelText = '';
    if (this._labelCollection && this._label) {
      this._label.show = false;
      this._primitives.remove(this._labelCollection);
      destroyObject(this._labelCollection);
      destroyObject(this._label);
      this._labelCollection = undefined;
      this._label = undefined;
    }
  }

  createLabel() {
    const labelOptions = {
      position: new Cartesian3(),
      image: undefined,
      show: true,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    };

    this._labelCollection = this._primitives.add(new BillboardCollection());
    if (this._labelCollection) {
      this._label = this._labelCollection.add(labelOptions);
      this._labelText = '';
      this._label.show = false;
      this._label.id = `${this._id}|${GEOMETRY_TYPE.TEXT}`;
    }
  }

  hasProperty(property: Record<string, any>) {
    return isIncludeProperty(this._properties, property);
  }

  updateLabelPosition() {
    const positions = this._positions;

    if (positions.length < 1) {
      return;
    }
    const labelPosition = getCentroidOfPolyline(positions);
    if (labelPosition && this._label) {
      this._label.position = updateHeightOfPosition(this._scene, labelPosition);
    }
  }
  /**
   * Create a new Line.
   * @param {LineConstructorOptions} options
   */
  _createVertices(options: LineConstructorOptions) {
    const primitives = this._primitives;

    this._mainVertexPointCollection = primitives.add(
      new PointPrimitiveCollection({
        show: options.show,
      }),
    );

    this._mainVertexPointPrimitives = [];

    for (let i = 0; i < this._positions.length; i++) {
      this._newMainVertexPointPrimitive(
        i,
        this._positions[i],
        this._polylinePrimitive,
      );
    }
  }

  /**
   * This is invoked whenever camera is changed.
   *
   * 1 Update show property of primitives.
   * 2 Update the height of vertices.
   */

  // TODO: Fix the lint error and remove `eslint-disable`.
  // eslint-disable-next-line
  update(cullingVolume: CullingVolume) {
    if (!this._show) {
      return;
    }

    const scene = this._scene;

    if (scene.mode === SceneMode.SCENE2D) {
      if (this.show) {
        this._polylinePrimitive.show = true;
        this.showLabel();
      } else {
        this._hideAllPrimitives();
        this.hideLabel();
      }
      return;
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
        "zero metersPerPixel! maybe the camera is contained in polyline's bounding sphere.",
      );
      return;
    }

    const pixelsPerMeter = 1.0 / metersPerPixel;
    const maxPixelSize = Math.max(drawingBufferWidth, drawingBufferHeight);
    const diameterInPixels = Math.min(
      pixelsPerMeter * (2.0 * this._boundingSphere.radius),
      maxPixelSize,
    );

    if (this.show) {
      if (diameterInPixels >= POLYLINE_MINIMUM_PIXEL_SIZE) {
        this._polylinePrimitive.show = true;
        this.showLabel();
      } else {
        this._polylinePrimitive.show = false;
        this.hideLabel();
      }

      if (this.showVertices && this._mainVertexPointCollection) {
        this._mainVertexPointCollection.show = true;
      }
    }
  }

  /**
   * Hide all primitives(vertex, polyline, ...).
   */
  _hideAllPrimitives() {
    this._polylinePrimitive.show = false;

    if (defined(this._mainVertexPointPrimitives)) {
      if (this._mainVertexPointCollection) {
        this._mainVertexPointCollection.show = false;
      }
    }
  }

  /**
   * Just update _boundingSphere from this._positions.
   */
  updateBoundingSphere() {
    BoundingSphere.fromPoints(this._positions, this._boundingSphere);
  }

  /**
   * Just update _boundingSphere based on terrain of globe or subsurface.
   */
  recalculateBoundingSphere() {
    const scene = this._scene;
    const ellipsoid = scene.globe.ellipsoid;
    const positions = this._positions;
    const scratchCarto = new Cartographic();

    for (let i = 0; i < positions.length; i++) {
      ellipsoid.cartesianToCartographic(positions[i], scratchCarto);

      scratchCarto.height = 0;

      const height = scene.globe.getHeight(scratchCarto);

      if (!defined(height)) {
        logger.warn('invalid height');
      }

      Cartesian3.fromRadians(
        scratchCarto.longitude,
        scratchCarto.latitude,
        height,
        ellipsoid,
        this._positions[i],
      );
    }

    BoundingSphere.fromPoints(this._positions, this._boundingSphere);
  }

  forceUpdate() {
    this.updateLabelPosition();
    this._polylinePrimitive.forceUpdate();
  }

  get positions() {
    return this._positions;
  }

  /**
   * Reconstruct line from given positions.
   */
  set positions(positions) {
    this._positions = positions;

    // Note that bounding sphere might not be correct if positions do not contains height values.
    this._boundingSphere = BoundingSphere.fromPoints(
      positions,
      this._boundingSphere,
    );
    this._polylinePrimitive.positions = positions;

    if (this._mainVertexPointCollection) {
      this._mainVertexPointCollection.removeAll();
    }

    if (this._mainVertexPointPrimitives) {
      this._mainVertexPointPrimitives = [];
    }

    for (let i = 0; i < positions.length; i++) {
      this._newMainVertexPointPrimitive(
        i,
        positions[i],
        this._polylinePrimitive,
      );
    }

    this.updateLabelPosition();
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get show() {
    return this._show;
  }

  set show(show) {
    if (this._show === show) {
      return;
    }

    this._show = show;

    if (show) {
      const camera = this._scene.camera;
      const frustum = camera.frustum;

      const cullingVolume = frustum.computeCullingVolume(
        camera.position,
        camera.direction,
        camera.up,
      );

      this.update(cullingVolume);
    } else {
      this._hideAllPrimitives();
      this.hideLabel();
    }

    this._showChanged.raiseEvent([show]);
    this._scene.requestRender();
  }

  set showVertices(show: boolean) {
    this._showVertices = show;
    if (!this._mainVertexPointCollection) {
      return;
    }
    if (show) {
      this._mainVertexPointCollection.show = true;
    } else {
      this._mainVertexPointCollection.show = false;
    }
  }

  get showVertices() {
    return this._showVertices;
  }

  get showChanged() {
    return this._showChanged;
  }

  get polyline() {
    return this._polylinePrimitive;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties: Record<string, any>) {
    this._properties = properties;
  }

  get labelText() {
    return this._labelText;
  }

  set labelText(value: string) {
    this._labelText = value;
  }

  get mainVertexPointPrimitives() {
    return this._mainVertexPointPrimitives;
  }

  appendProperties(properties: Record<string, any>) {
    this._properties = { ...this.properties, ...properties };
  }

  /**
   * Add a new vertex and reconstruct line.
   * @param {Vertex} position
   * @param {number} segStartIdx
   * @returns {void}
   */
  insertVertex(position: Cartesian3, segStartIdx: number) {
    const polylinePrimitive = this._polylinePrimitive;

    if (!this._mainVertexPointPrimitives) {
      return;
    }
    for (let i = 0; i < this._mainVertexPointPrimitives.length; i++) {
      if (this._mainVertexPointPrimitives[i].vertexIndex > segStartIdx) {
        this._mainVertexPointPrimitives[i].vertexIndex += 1;
      }
    }

    const newPos = new Cartesian3();

    position.clone(newPos);
    this._positions.splice(segStartIdx + 1, 0, newPos);

    const pointPrimitive = this._newMainVertexPointPrimitive(
      segStartIdx + 1,
      position,
      polylinePrimitive,
    );

    return pointPrimitive;
  }

  updateMainVertex(
    focusedPointPrimitive: PointPrimitive,
    position: Cartesian3 | undefined,
    eventVertexModified: Event,
    pointState?: PointState,
  ) {
    // @ts-ignore
    const vertexIndex = focusedPointPrimitive.vertexIndex;

    const mainVertexPointPrimitive = this.findMainVertex(
      vertexIndex,
      pointState,
    );

    if (!position) {
      return;
    }
    position.clone(this._positions[vertexIndex]);

    focusedPointPrimitive.position = position;

    // @ts-ignore
    const polylinePrimitive = focusedPointPrimitive.polylinePrimitive;

    polylinePrimitive.updatePosition(vertexIndex, position);

    if (mainVertexPointPrimitive) {
      mainVertexPointPrimitive.position = position;
    }

    eventVertexModified.raiseEvent([focusedPointPrimitive], [this]);
    this.updateLabelPosition();
  }

  findMainVertex(vertexIndex: number, pointState?: PointState) {
    let mainVertexPointPrimitive: PointPrimitive | undefined;

    if (this._mainVertexPointCollection) {
      for (let i = 0; i < this._mainVertexPointCollection.length; i++) {
        const mainVertex = this._mainVertexPointCollection.get(i);
        if (
          // @ts-ignore
          mainVertex.vertexIndex === vertexIndex
        ) {
          updateVertexStyle(mainVertex, pointState);
          mainVertexPointPrimitive = mainVertex;
        } else {
          updateVertexStyle(mainVertex);
        }
      }
    }
    return mainVertexPointPrimitive;
  }

  /**
   * Add vertex to line as last vertex.
   * @param {Catesian3} position
   */
  addPoint(position: Cartesian3) {
    const positions = this._positions;

    positions.push(position);

    this._polylinePrimitive.positions = positions;

    const pointPrimitive = this._newMainVertexPointPrimitive(
      positions.length - 1,
      position,
      this._polylinePrimitive,
    );

    this._polylinePrimitive.show = true;

    BoundingSphere.fromPoints(positions, this._boundingSphere);

    this.updateHeightOfPoint();
    return pointPrimitive;
  }

  /**
   * Delete Main Vertex.
   */
  deletePoint(idx: number) {
    if (!this._mainVertexPointCollection) {
      return;
    }

    if (idx > this._positions.length - 1 || idx < 0) {
      return;
    }

    this._positions.splice(idx, 1);

    const selectedMainVertexPrimitive = this.findMainVertex(idx);
    if (selectedMainVertexPrimitive) {
      this._mainVertexPointCollection.remove(selectedMainVertexPrimitive);
    }

    if (!this._mainVertexPointPrimitives) {
      return;
    }
    for (let i = 0; i < this._mainVertexPointPrimitives.length; i++) {
      if (this._mainVertexPointPrimitives[i].vertexIndex > idx) {
        this._mainVertexPointPrimitives[i].vertexIndex -= 1;
      }
    }

    this._polylinePrimitive.positions = this._positions;
  }

  /**
   * Line drawing finished.
   */
  finishDrawing() {
    const positions = this._positions;

    this._polylinePrimitive.positions = positions;
  }

  /**
   * @param {number} vertexIndex
   * @param {Cartesian3} position
   * @param {PolylinePrimitive} polylinePrimitive
   * @returns {Vertex}
   */
  _newMainVertexPointPrimitive(
    vertexIndex: number,
    position: Cartesian3,
    polylinePrimitive: PolylinePrimitive,
  ) {
    const scratchCartesian1 = new Cartesian3();

    if (!this._mainVertexPointCollection) {
      return;
    }
    const pointPrimitive = this._mainVertexPointCollection.add(
      this._pointOptions,
    ) as Vertex;

    pointPrimitive.position = Cartesian3.clone(position, scratchCartesian1);
    pointPrimitive.show = true;
    pointPrimitive.object = this;
    pointPrimitive.polylinePrimitive = polylinePrimitive;
    pointPrimitive.vertexIndex = vertexIndex;
    pointPrimitive.isMainVertex = true;
    pointPrimitive.id = `${this._id}|${GEOMETRY_TYPE.POINT}`;

    if (!this._mainVertexPointPrimitives) {
      return;
    }
    this._mainVertexPointPrimitives.splice(vertexIndex, 0, pointPrimitive);

    return pointPrimitive;
  }

  /**
   * When draw multiple polgon, change color for selected line.
   */
  changeLineColorForSelectState() {
    this._polylinePrimitive.color = SELECTED_LINE_PRIMITIVE_COLOR;
  }

  get boundingSphere() {
    return this._boundingSphere;
  }

  toggleVisibilityMainVertex(flag: boolean) {
    if (!this._mainVertexPointCollection) {
      return;
    }

    this.showVertices = flag;
    this._scene.camera.moveForward(EPS);
  }

  toggleVisibility() {
    this.show = !this.show;
  }
  /**
   * Update height of point primitives.
   */
  updateHeightOfPoint() {
    // PreCondition start.
    if (!defined(this._mainVertexPointPrimitives)) {
      throw new DeveloperError('_mainVertexPointPrimitives required');
    }
    // PreCondition end.

    updateHeightOfPointPrimitives(
      this._scene,
      this._mainVertexPointPrimitives as PointPrimitive[],
    );
  }

  // Export wkt.
  exportWKT(): ExportedWKTType {
    let wktString = GEOMETRY_TYPE.LINE.toUpperCase() + ' ';
    let tmpString = '';
    for (let j = 0; j < this.positions.length; j++) {
      const tmpCartographic = Cartographic.fromCartesian(this.positions[j]);
      tmpString +=
        radianToString(tmpCartographic.longitude) +
        ' ' +
        radianToString(tmpCartographic.latitude);
      if (j !== this.positions.length - 1) {
        tmpString += ',';
      }
    }
    wktString += `(${tmpString})`;

    return {
      id: this.id,
      wkt: wktString,
    };
  }

  // Update feature style such as focused style, blur style, style changes from frontend.
  updateStyle(styleOptions: StyleOptions) {
    const { lineStyleOptions: options } = styleOptions;
    if (!options) {
      return;
    }

    const { label, labelColor, opacity, strokeColor, strokeThickness } =
      options;

    if (label !== undefined) {
      this.setLabel(label);
      if (labelColor) {
        this.setLabelStyle({ backgroundColor: labelColor });
      }
    }

    if (strokeColor) {
      this._polylinePrimitive.color = Color.fromCssColorString(strokeColor);
    }

    if (strokeThickness) {
      this._polylinePrimitive.width = strokeThickness;
    }

    if (opacity) {
      const color = this._polylinePrimitive.color;
      this._polylinePrimitive.color = color.withAlpha(opacity);
    }

    this._polylinePrimitive.forceUpdate();
  }

  changeStyle(styleOptions: StyleOptions) {
    const { lineStyleOptions: options } = styleOptions;
    if (!options) {
      return;
    }

    this._styleOptions = styleOptions;
    this.updateStyle(this._styleOptions);
  }

  featureFocused(focusedStyle?: StyleOptions) {
    if (focusedStyle) {
      this._focusedStyle = focusedStyle;
    }

    this.updateStyle(this._focusedStyle);
    this._isFocused = true;
  }

  featureBlur() {
    this.updateStyle(this._styleOptions);
    this._isFocused = false;
  }

  resetStyle() {
    this._polylinePrimitive.color = DrawingSettings.color;
    this._polylinePrimitive.width = DrawingSettings.lineWidth;
    this._polylinePrimitive.forceUpdate();
  }

  /**
   * Calculates the position at a specified distance along a series of Cartesian3 from the starting point.
   * @param {Cartesian3[]} positions - An array of Cartesian3 objects
   * representing a series of positions in 3D space. Each Cartesian3 object contains x, y, and z
   * coordinates.
   * @param {number} targetDistance - The distance in meters along a path that you want to find
   * the corresponding position for. The function calculates the position on the path that is closest
   * to the specified target distance.
   * @returns A `Cartesian3` object or `null` if target distance is not on the line.
   */
  _calculatePositionAtDistance(
    positions: Cartesian3[],
    targetDistance: number,
  ): Cartesian3 | null {
    let accumulatedDistance = 0;
    let previousPosition = this._positions[0];

    for (let i = 1; i < positions.length; i++) {
      const currentPosition = positions[i];
      const segmentDistance = Cartesian3.distance(
        previousPosition,
        currentPosition,
      );

      if (accumulatedDistance + segmentDistance >= targetDistance) {
        const ratio = (targetDistance - accumulatedDistance) / segmentDistance;
        const interpolatedPosition = new Cartesian3();
        Cartesian3.lerp(
          previousPosition,
          currentPosition,
          ratio,
          interpolatedPosition,
        );

        const interpolatedCartographicPosition =
          Cartographic.fromCartesian(interpolatedPosition);
        const loadedHeight = this._scene.globe.getHeight(
          interpolatedCartographicPosition,
        );

        return Cartesian3.fromRadians(
          interpolatedCartographicPosition.longitude,
          interpolatedCartographicPosition.latitude,
          loadedHeight,
        );
      }

      accumulatedDistance += segmentDistance;
      previousPosition = currentPosition;
    }
    return null;
  }

  /**
   * Adds or updates a highlighted point on a map at a specified distance along a path.
   * @param {number} distance - Distance at which a point should be highlighted.
   */
  saveHighlightPoint(distance: number): void {
    const pointPosition = this._calculatePositionAtDistance(
      this._positions,
      distance,
    );
    if (pointPosition) {
      if (!defined(this._highlightPoint)) {
        this._highlightPoint = this.primitives.add(
          new PointPrimitiveCollection(),
        );
        const color = Color.fromCssColorString('#764ae2');

        this._highlightPoint?.add({
          position: pointPosition,
          pixelSize: 10,
          color,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        });
      } else {
        const hightlightedPoint = this._highlightPoint?.get(0);

        if (hightlightedPoint && pointPosition) {
          hightlightedPoint.position = pointPosition;
        }
      }
    } else {
      console.warn('No point lies on the line at this distance.');
    }
  }

  /**
   * Removes the highlighted point form the line.
   */
  removeHighlightPoint(): void {
    if (defined(this._highlightPoint)) {
      this._primitives.remove(this._highlightPoint);
      this._highlightPoint = undefined;
    }
  }

  destroy() {
    super.destroy();
    this._scene.camera.moveEnd.removeEventListener(this._eventLabelSizeFix);
    this.destroyLabel();
    this._primitives.remove(this._polylinePrimitive);
    this.removeHighlightPoint();
    return destroyObject(this);
  }
}
