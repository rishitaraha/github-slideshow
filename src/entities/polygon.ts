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
  Intersect,
  PointPrimitive,
  PointPrimitiveCollection,
  SceneMode,
} from 'cesium';
import logger from 'loglevel';
import { PolygonPrimitive } from '../primitives/polygon.primitive';
import { PolylinePrimitive } from '../primitives/polyline.primitive';
import {
  DEFAULT_POLYGON_COLOR,
  DEFAULT_POLYGON_OPACITY,
  EPS,
  POLYGON_MINIMUM_PIXEL_SIZE,
  POLYLINE_MINIMUM_PIXEL_SIZE,
  SELECTED_POLYGON_PRIMITIVE_COLOR,
} from '../shared/constants';
import { StyleOptions } from '../tools';
import DrawingSettings from '../tools/drawing/drawing-tool-settings';
import { ExportedWKTType, PointState } from '../tools/drawing/types';
import { PointOptions, PolygonConstructorOptions, Vertex } from '../types';
import {
  clearArray,
  GEOMETRY_TYPE,
  getCentroidOfPolygon,
  getLabelSVG,
  LabelSVGType,
  simplifyPolygon,
  updateHeightOfPointPrimitives,
  updateVertexStyle,
} from '../utils';
import {
  convertToCartographicArray,
  isIncludeProperty,
  radianToString,
} from '../utils/common';
import { updateHeightOfPosition } from '../utils/update-height-of-position';
import { BaseFeature } from './base/base-feature';

/**
 * Polygon represents polygon primitive on the scene.
 * _primitives: Store all primitives to be rendered for polygon, ex., vertex, polyline(edge).
 * _show: Show/Hide polygon.
 * _show_Vertices: Show/Hide vertex.
 * _id: Primitive index.
 * _name: Primitive name.
 * _mainVertexPointCollection: Store vertex which construct polygon.
 */
export class Polygon extends BaseFeature {
  private _cartographicPositions: Cartographic[];
  private _isReduceNumberOfVertex = false;
  private _simplifiedPositions: Cartesian3[] = [];

  private readonly _pointOptions: PointOptions;
  private _mainVertexPointCollection: PointPrimitiveCollection | undefined;
  private _mainVertexPointPrimitives: Vertex[] | undefined;
  private _polygonPrimitive: PolygonPrimitive;
  private _polylinePrimitive: PolylinePrimitive;

  private readonly _showChanged: Event;

  constructor(options: PolygonConstructorOptions) {
    super(options);
    const primitives = defaultValue(options.primitives, this._scene.primitives);

    const pointOptions = options.pointOptions;
    const polylineOptions = options.polylineOptions;
    const polygonOptions = options.polygonOptions;

    this._positions = defaultValue(options.positions, []);
    if (this._positions.length > 0) {
      for (let i = 0; i < this.positions.length; i++) {
        this._positions[i] = updateHeightOfPosition(
          this._scene,
          this._positions[i],
        );
      }
    }

    this._cartographicPositions = convertToCartographicArray(this._positions);
    this._isReduceNumberOfVertex = options.isReduceNumberOfVertex;

    this._primitives = primitives;

    this._pointOptions = pointOptions;

    this._polygonPrimitive = primitives.add(
      new PolygonPrimitive(
        combine(
          {
            show: options.show,
            positions: this._isReduceNumberOfVertex
              ? this._simplifiedPositions
              : this.positions,
            allowPicking: true,
            id: `${this._id}|${GEOMETRY_TYPE.POLYGON}`,
          },
          polygonOptions,
        ),
      ),
    );
    this._polylinePrimitive = primitives.add(
      new PolylinePrimitive(
        combine(
          {
            show: options.show,
            positions: this._isReduceNumberOfVertex
              ? this._simplifiedPositions
              : this.positions,
            scene: this._scene,
            id: `${this._id}|${GEOMETRY_TYPE.POLYGON}|${GEOMETRY_TYPE.LINE}`,
          },
          polylineOptions,
        ),
      ),
    );

    this.updateNumberOfVertices();

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
      type: GEOMETRY_TYPE.POLYGON,
      isEditable: false,
    };

    this._styleOptions = DrawingSettings.getPolygonDefaultStyle();
    this._focusedStyle = DrawingSettings.getPolygonFocusedStyle();

    this._scene.camera.moveEnd.addEventListener(this.updateNumberOfVertices);
  }

  updateNumberOfVertices = () => {
    this.fixLabelSizeInMeter();
    if (!this._isReduceNumberOfVertex) {
      this._polygonPrimitive.positions = this._positions;
      this._polylinePrimitive.positions = this._positions;
      return;
    }
    const cameraHeight = this._scene.camera.positionCartographic.height;
    // Calculate tolerance and let's assume we can see all part in 1000m of camera height.
    // Reference: https://stackoverflow.com/questions/52925419/simplify-js-package-always-return-2-points-of-polygon
    const tolerance = 1e-8 * cameraHeight;
    const simplifiedOptions = {
      tolerance,
      highQuality: false,
    };
    this._cartographicPositions = convertToCartographicArray(this._positions);
    if (
      !Cartographic.equals(
        this._cartographicPositions[0],
        this._cartographicPositions[this._cartographicPositions.length - 1],
      )
    ) {
      this._cartographicPositions.push(this._cartographicPositions[0]);
    }
    const simplifiedCoordinates = simplifyPolygon(
      this._cartographicPositions,
      simplifiedOptions,
    );
    clearArray(this._simplifiedPositions);
    const cartoScratch = new Cartographic();
    for (const coord of simplifiedCoordinates) {
      cartoScratch.longitude = coord.longitude;
      cartoScratch.latitude = coord.latitude;
      cartoScratch.height = 0;
      const height = this._scene.globe.getHeight(cartoScratch);
      const cartePos = Cartesian3.fromDegrees(
        coord.longitude,
        coord.latitude,
        height,
      );
      this._simplifiedPositions.push(cartePos);
    }

    this._polygonPrimitive.positions = this._simplifiedPositions;
    this._polylinePrimitive.positions = this._simplifiedPositions;

    this._updateVertices();
  };

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

    if (positions.length < 2) {
      return;
    }
    const labelPosition = getCentroidOfPolygon(this._scene, positions);
    if (labelPosition && this._label) {
      this._label.position = updateHeightOfPosition(this._scene, labelPosition);
    }
  }
  /**
   * Create a new polygon.
   * @param {PolygonConstructorOptions} options
   */
  _createVertices(options: PolygonConstructorOptions) {
    const primitives = this._primitives;

    this._mainVertexPointCollection = primitives.add(
      new PointPrimitiveCollection({
        show: options.show,
      }),
    );

    this._updateVertices();
  }

  _updateVertices() {
    this._mainVertexPointPrimitives = [];
    if (this._mainVertexPointCollection) {
      this._mainVertexPointCollection.removeAll();
    }

    if (this._isReduceNumberOfVertex) {
      for (let i = 0; i < this._simplifiedPositions.length; i++) {
        this._newMainVertexPointPrimitive(
          i,
          this._simplifiedPositions[i],
          this._polygonPrimitive,
          this._polylinePrimitive,
        );
      }
    } else {
      for (let i = 0; i < this._positions.length; i++) {
        this._newMainVertexPointPrimitive(
          i,
          this._positions[i],
          this._polygonPrimitive,
          this._polylinePrimitive,
        );
      }
    }
  }

  /**
   * This is invoked whenever camera is changed.
   *
   * 1 Update show property of primitives.
   * 2 Update the height of vertices.
   */
  update(cullingVolume: CullingVolume) {
    if (!this._show) {
      return;
    }

    const scene = this._scene;

    if (scene.mode === SceneMode.SCENE2D) {
      if (this.show) {
        this._polygonPrimitive.show = true;
        this._polylinePrimitive.show = true;
        this.showLabel();
      } else {
        this._hideAllPrimitives();
        this.hideLabel();
      }
      return;
    }

    const intersect = cullingVolume.computeVisibility(this._boundingSphere);

    if (intersect === Intersect.OUTSIDE) {
      this._hideAllPrimitives();
      return;
    } else {
      this._polygonPrimitive.show = true;
      this.showLabel();
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
        "zero metersPerPixel! maybe the camera is contained in polygon's bounding sphere.",
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
      if (diameterInPixels >= POLYGON_MINIMUM_PIXEL_SIZE) {
        this._polygonPrimitive.show = true;
        this.showLabel();
      } else {
        this._hideAllPrimitives();
        return;
      }

      if (diameterInPixels >= POLYLINE_MINIMUM_PIXEL_SIZE) {
        this._polylinePrimitive.show = true;
        this.showLabel();
      } else {
        this._polylinePrimitive.show = false;
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
    this._polygonPrimitive.show = false;
    this._polylinePrimitive.show = false;

    if (this._mainVertexPointCollection) {
      this._mainVertexPointCollection.show = false;
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
    this._polygonPrimitive.forceUpdate();
  }

  get positions() {
    return this._positions;
  }

  /**
   * Reconstruct polygon from given positions.
   */
  set positions(positions) {
    this._positions = positions;

    // Note that bounding sphere might not be correct if positions do not contains height values.
    this._boundingSphere = BoundingSphere.fromPoints(
      positions,
      this._boundingSphere,
    );

    this._polylinePrimitive.positions = positions;
    this._polygonPrimitive.positions = positions;

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
        this._polygonPrimitive,
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

  get polygon() {
    return this._polygonPrimitive;
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

  get styleOptions() {
    return this._styleOptions;
  }

  set styleOptions(options: StyleOptions) {
    this._styleOptions = options;
  }

  get focusedStyle() {
    return this._focusedStyle;
  }

  set focusedStyle(options: StyleOptions) {
    this._focusedStyle = options;
  }

  get isFocused() {
    return this.isFocused;
  }

  get mainVertexPointPrimitives() {
    return this._mainVertexPointPrimitives;
  }

  get isReduceNumberOfVertex() {
    return this._isReduceNumberOfVertex;
  }

  set isReduceNumberOfVertex(value) {
    this._isReduceNumberOfVertex = value;
    if (!value) {
      this._updateVertices();
    } else {
      this._scene.camera.moveForward(EPS);
    }
  }

  appendProperties(properties: Record<string, any>) {
    this._properties = { ...this.properties, ...properties };
  }

  /**
   * Add a new vertex and reconstruct polygon.
   * @param {Vertex} position
   * @param {number} segStartIdx
   * @returns {void}
   */
  insertVertex(position: Cartesian3, segStartIdx: number) {
    const polylinePrimitive = this._polylinePrimitive;
    const polygonPrimitive = this._polygonPrimitive;

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
      polygonPrimitive,
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
    // @ts-ignore
    const polygonPrimitive = focusedPointPrimitive.polygonPrimitive;

    polylinePrimitive.updatePosition(vertexIndex, position);
    polygonPrimitive.updatePosition(vertexIndex, position);

    if (mainVertexPointPrimitive) {
      mainVertexPointPrimitive.position = position;
    }

    this.updateLabelPosition();
    eventVertexModified.raiseEvent([focusedPointPrimitive], [this]);
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
   * Add vertex to polygon as last vertex.
   * @param {Catesian3} position
   */
  addPoint(position: Cartesian3) {
    const positions = this._positions;

    positions.push(position);

    this._polylinePrimitive.positions = positions;
    this._polygonPrimitive.positions = positions;

    const pointPrimitive = this._newMainVertexPointPrimitive(
      positions.length - 1,
      position,
      this._polygonPrimitive,
      this._polylinePrimitive,
    );

    this._polygonPrimitive.show = true;
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

    this._polygonPrimitive.positions = this._positions;
    this._polylinePrimitive.positions = this._positions;
  }

  /**
   * To store mouse position while moving.
   * Note that we do not actually insert position this._positions.
   * @param {Cartesian3} position
   */
  updateLastPosition(position: Cartesian3) {
    const linePositions = this._positions.slice();
    this._polylinePrimitive.positions = linePositions;

    const polygonPositions = this._positions.slice();
    polygonPositions.push(position);

    this._polygonPrimitive.positions = polygonPositions;
  }

  /**
   * Polygon drawing finished.
   */
  finishDrawing() {
    const positions = this._positions;

    this._polylinePrimitive.positions = positions;
    this._polylinePrimitive.loop = true;
    this._polygonPrimitive.positions = positions;
  }

  /**
   * @param {number} vertexIndex
   * @param {Cartesian3} position
   * @param {PolygonPrimitive} polygonPrimitive
   * @param {PolylinePrimitive} polylinePrimitive
   * @returns {Vertex}
   */
  // @ts-ignore
  _newMainVertexPointPrimitive(
    vertexIndex: number,
    position: Cartesian3,
    // @ts-ignore
    polygonPrimitive: PolygonPrimitive,
    // @ts-ignore
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
    pointPrimitive.polygonPrimitive = polygonPrimitive;
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
   * When draw multiple polgon, change color for selected polygon.
   */
  changePolygonColorForSelectState() {
    this._polygonPrimitive.color = SELECTED_POLYGON_PRIMITIVE_COLOR;
  }

  get boundingSphere() {
    return this._boundingSphere;
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

  // Export wkt.
  exportWKT(): ExportedWKTType {
    let wktString = GEOMETRY_TYPE.POLYGON.toUpperCase() + ' ';
    let tmpString = '';
    let tmpCartographic;

    for (let j = 0; j < this.positions.length; j++) {
      tmpCartographic = Cartographic.fromCartesian(this.positions[j]);
      tmpString +=
        radianToString(tmpCartographic.longitude) +
        ' ' +
        radianToString(tmpCartographic.latitude);
      tmpString += ',';
    }
    tmpCartographic = Cartographic.fromCartesian(this.positions[0]);
    tmpString +=
      radianToString(tmpCartographic.longitude) +
      ' ' +
      radianToString(tmpCartographic.latitude);
    wktString += `((${tmpString}))`;

    return {
      id: this.id,
      wkt: wktString,
    };
  }

  // Update feature style such as focused style, blur style, style changes from frontend.
  updateStyle(styleOptions: StyleOptions) {
    const { polygonStyleOptions: options } = styleOptions;
    if (!options) {
      return;
    }

    const {
      fillColor,
      fillOpacity,
      label,
      labelColor,
      opacity,
      strokeColor,
      strokeThickness,
    } = options;

    if (fillColor) {
      this.changeFillColor(fillColor, fillOpacity ?? DEFAULT_POLYGON_OPACITY);
    }

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
      const color = this._polygonPrimitive.color;
      this._polygonPrimitive.color = color.withAlpha(opacity * 0.2);
    }

    this._polygonPrimitive.forceUpdate();
    this._polylinePrimitive.forceUpdate();
  }

  changeStyle(styleOptions: StyleOptions) {
    const { polygonStyleOptions: options } = styleOptions;
    if (!options) {
      return;
    }
    this._styleOptions = styleOptions;
    this.updateStyle(this._styleOptions);
  }

  changeFillColor(colorString: string, alpha: number) {
    const color = Color.fromCssColorString(colorString);
    this._polygonPrimitive.color = color.withAlpha(alpha);
  }

  resetFillColor() {
    const { polygonStyleOptions: options } = this._styleOptions;
    if (options && options.fillColor) {
      this.changeFillColor(
        options.fillColor,
        options.fillOpacity ?? DEFAULT_POLYGON_OPACITY,
      );
    } else {
      this.changeFillColor(
        DEFAULT_POLYGON_COLOR.toCssColorString(),
        DEFAULT_POLYGON_OPACITY,
      );
    }
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
    this._polygonPrimitive.color = DEFAULT_POLYGON_COLOR;
    this.setLabel('');
    this._polylinePrimitive.color = DrawingSettings.color;
    this._polylinePrimitive.width = DrawingSettings.lineWidth;
  }

  destroy() {
    super.destroy();
    this._scene.camera.moveEnd.removeEventListener(this.updateNumberOfVertices);
    this.destroyLabel();
    this._primitives.remove(this._polygonPrimitive);
    this._primitives.remove(this._polylinePrimitive);
    return destroyObject(this);
  }
}
