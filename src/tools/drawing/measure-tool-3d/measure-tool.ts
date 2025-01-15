import {
  BillboardCollection,
  Cartesian2,
  Cartesian3,
  Entity,
  EntityCollection,
  Event,
  HorizontalOrigin,
  PointPrimitiveCollection,
  Scene,
  VerticalOrigin,
  combine,
  createGuid,
  defined,
} from 'cesium';
import { MapTool, MouseEvent } from '../../base';
import { Line, Point, Textbox } from '../../../entities';
import { FeatureIdentity } from '../../../types';
import { EPS, MouseButton } from '../../../shared';
import DrawingSettings from '../drawing-tool-settings';
import { MeasureToolState } from './enums';
import { MeasureTool3DOptions } from './types';
import { formatDistance } from '../../../utils';

const cart3Scratch = new Cartesian3();
const cart3Scratch1 = new Cartesian3();

/**
 * MeasureTool3D is one kind of MapTool to draw possible distances(
 * direct, vertical, horizontal) by line from start point to target point.
 * _startPoint: First placed point on the terrain.
 * _directLine, _horizontalLine, _verticalLine will be constructing a right triangle.
 * _directLine: Line primitive between 2 points(_startPoint, mouse position on terrain).
 * _horizontalLine: Line primitive between 2 points(_startPoint, the point which has same height with _startPoint at mouse position on terrain).
 * _verticalLine: Line primitive between 2 points(mouse position on terrain, the point which has same height with _startPoint at mouse position on terrain).
 * _directLineLabel: Textbox settled on center of _directLine.
 * _horizontalLineLabel: Textbox settled on center of _horizontalLine.
 * _verticalLineLabel: Textbox settled on center of _verticalLine.
 * _cornerSquare: Cesium Wall entity to demonstrate right angle between _verticalLine and _horizontalLine.
 *
 *                             +---------------------------+
 *                             |          Example          |
 *                             +---------------------------+
 *
 *            Terrain         _startPoint
 *            /                 /   _horizontalLine
 *           /                 #_____/___#
 *     ___/````\/``````\/`````\ \        |
 *                               \       |
 *                                \      |
 *                                 \     |---> _verticalLine
 *                 _directLine <--- \    |
 *                                   \   |
 *        Terrain                     \  |
 *        /                            \ |
 *       /                              # ---> target mouse position on terrain
 *___/````\/``````\/`````\___/````\/``````\/`````\___/````\/``````\/`````\___/````\/``````\/`````\
 * _mode: Tools current status(None, Start, Update, End).
 * _entities: To store and update _cornerSquare entity.
 * _scene: Current scene.
 * _pointPrimitiveCollection: To store and update _startPoint and target point.
 * _labelCollection: To store and update labels(_directLineLabel, _horizontalLineLabel, _verticalLineLabel).
 * _options: To store constructor option.
 * _eventDistanceMeasurementStarted: Event to be triggered on placing the first point.
 * _eventDistanceMeasurementUpdated: Event to be triggered as the second point is placed.
 * _eventDistanceMeasurementEnded: Event to be triggered as the second point is placed.
 */
export class MeasureTool3D extends MapTool {
  private _startPoint: Point | undefined = undefined;
  private _directLine: Line | undefined = undefined;
  private _horizontalLine: Line | undefined = undefined;
  private _verticalLine: Line | undefined = undefined;
  private _directLineLabel: Textbox | undefined = undefined;
  private _horizontalLineLabel: Textbox | undefined = undefined;
  private _verticalLineLabel: Textbox | undefined = undefined;
  private _cornerSquare: Entity | undefined = undefined;
  private _mode: MeasureToolState = MeasureToolState.NONE;

  private _entities: EntityCollection;
  private _scene: Scene;
  private _pointPrimitiveCollection: PointPrimitiveCollection;
  private _labelCollection: BillboardCollection;
  private readonly _options: MeasureTool3DOptions;

  private readonly _eventDistanceMeasurementStarted: Event;
  private readonly _eventDistanceMeasurementUpdated: Event;
  private readonly _eventDistanceMeasurementEnded: Event;

  constructor(options: MeasureTool3DOptions) {
    super(options);

    this._options = options;
    this._scene = this._viewer.scene;
    this._entities = this._viewer.entities;

    this._pointPrimitiveCollection = this._options.primitives.add(
      new PointPrimitiveCollection({ show: true }),
    );
    this._labelCollection = this._options.primitives.add(
      new BillboardCollection(),
    );

    this._eventDistanceMeasurementStarted = new Event();
    this._eventDistanceMeasurementUpdated = new Event();
    this._eventDistanceMeasurementEnded = new Event();

    this._mode = MeasureToolState.NONE;
  }

  get eventDistanceMeasurementStarted() {
    return this._eventDistanceMeasurementStarted;
  }

  get eventDistanceMeasurementUpdated() {
    return this._eventDistanceMeasurementUpdated;
  }

  get eventDistanceMeasurementEnded() {
    return this._eventDistanceMeasurementEnded;
  }

  get mode() {
    return this._mode;
  }

  set mode(value) {
    this._mode = value;
  }

  /**
   * Create a new measurement elements(lines, labels, points)
   * @param {Cartesian3} position Measurement start position
   */
  reset(position: Cartesian3) {
    this._startPoint = this.addStartPoint(position);
    const id = createGuid();
    this._directLineLabel = new Textbox({
      id: `DirectLineLabel${id}`,
      name: `DirectLineLabel`,
      show: true,
      scene: this._scene,
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 1.0,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.TOP,
        pixelOffset: new Cartesian2(0, 20),
      }),
      labelCollection: this._labelCollection,
      position: new Cartesian3(),
      type: FeatureIdentity.TEXTBOX,
    });
    this._horizontalLineLabel = new Textbox({
      id: `HorizontalLineLabel${id}`,
      name: `HorizontalLineLabel`,
      show: true,
      scene: this._scene,
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 1.0,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, 20),
      }),
      labelCollection: this._labelCollection,
      position: new Cartesian3(),
      type: FeatureIdentity.TEXTBOX,
    });

    this._verticalLineLabel = new Textbox({
      id: `VerticalLinelabel${id}`,
      name: `VerticalLinelabel`,
      show: true,
      scene: this._scene,
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 1.0,
        horizontalOrigin: HorizontalOrigin.RIGHT,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(20, 0),
      }),
      labelCollection: this._labelCollection,
      position: new Cartesian3(),
      type: FeatureIdentity.TEXTBOX,
    });

    this._directLine = new Line({
      id: `DirectLine${id}`,
      name: `DirectLine`,
      scene: this._scene,
      primitives: this._options.primitives,
      pointOptions: this._options.pointOptions,
      polylineOptions: this._options.polylineOptions,
      createVertices: true,
      type: FeatureIdentity.LINE,
    });
    this._directLine.addPoint(position);
    this._directLine.addPoint(position);
    this._directLine.toggleVisibilityMainVertex(false);

    this._horizontalLine = new Line({
      id: `HorizontalLine${id}`,
      name: `HorizontalLine`,
      scene: this._scene,
      primitives: this._options.primitives,
      pointOptions: this._options.pointOptions,
      polylineOptions: this._options.polylineOptions,
      createVertices: true,
      type: FeatureIdentity.LINE,
    });
    this._horizontalLine.addPoint(position);
    this._horizontalLine.addPoint(position);
    this._horizontalLine.toggleVisibilityMainVertex(false);

    this._verticalLine = new Line({
      id: `VerticalLine${id}`,
      name: `VerticalLine`,
      scene: this._scene,
      primitives: this._options.primitives,
      pointOptions: this._options.pointOptions,
      polylineOptions: this._options.polylineOptions,
      createVertices: true,
      type: FeatureIdentity.LINE,
    });
    this._verticalLine.addPoint(position);
    this._verticalLine.addPoint(position);
    this._verticalLine.toggleVisibilityMainVertex(false);

    this._cornerSquare = this._entities.add({
      name: 'CornerSquare',
      wall: {
        positions: [],
        minimumHeights: [],
        material: DrawingSettings.color,
      },
    });
  }

  /**
   * Place a point to start measure distance.
   * @param {Cartesian3} position
   * @param {string} pointId
   * @param {Record} properties
   * @param {boolean} disableCameraMove
   * @returns {Point}
   */
  addStartPoint(
    position: Cartesian3,
    pointId?: string,
    properties?: Record<string, any>,
    disableCameraMove?: boolean,
  ) {
    const pointPosition = new Cartesian3();
    Cartesian3.clone(position, pointPosition);

    const id = pointId ?? createGuid();
    const pointName = `start-measure-point`;

    const pointPrimitive = this._pointPrimitiveCollection.add(
      combine(
        {
          id: pointId,
        },
        this._options.pointOptions,
      ),
    );

    pointPrimitive.position = position;
    pointPrimitive.show = false;

    const point = new Point({
      id,
      name: pointName,
      show: true,
      scene: this._scene,
      primitives: this._options.primitives,
      primitive: pointPrimitive,
      pointOptions: this._options.pointOptions,
      position: position,
      isShowShape: true,
      type: FeatureIdentity.POINT,
    });

    point.position = point.primitive.position;

    if (!disableCameraMove) {
      this._scene.camera.moveBackward(EPS);
    }
    return point;
  }

  /**
   * Canvas release event to check if measuring is started or ended.
   * If it's started, it will please a start point.
   * @param {MouseEvent} event Mouse event
   * @returns
   */
  canvasReleaseEvent(event: MouseEvent): void {
    const position = this.getWorldPosition(event.pos, new Cartesian3());
    if (!defined(position) || !position) {
      return;
    }
    if (
      event.button === MouseButton.LeftButton &&
      this._mode === MeasureToolState.NONE
    ) {
      this.reset(position);
      this._mode = MeasureToolState.START;
      this._eventDistanceMeasurementStarted.raiseEvent([position]);
    }
    if (
      event.button === MouseButton.RightButton &&
      this._mode === MeasureToolState.START
    ) {
      this._mode = MeasureToolState.END;
      this.deactivate();
      this._eventDistanceMeasurementEnded.raiseEvent();
    }
  }

  /**
   * Update measurement elements(lines, labels, points) while mouse moving, not draging.
   * @param {Cartesian3} position Mouse position
   */
  _handleCanvasMoveEvent(position: Cartesian3): void {
    const ellipsoid = this._scene.globe.ellipsoid;
    if (this._mode === MeasureToolState.START) {
      if (this._directLine) {
        const positionsForDirectLine: Cartesian3[] = this._directLine.positions;
        positionsForDirectLine[1] = position;
        this._directLine.positions = positionsForDirectLine;
        // Height update for corner points
        const pointAcartographic = ellipsoid.cartesianToCartographic(
          positionsForDirectLine[0],
        );
        const pointBcartographic = ellipsoid.cartesianToCartographic(
          positionsForDirectLine[1],
        );
        const pointCcartographic = pointBcartographic.clone();
        const heightA = this._scene.globe.getHeight(pointAcartographic);
        const heightB = this._scene.globe.getHeight(pointBcartographic);
        if (heightA && heightB) {
          pointCcartographic.height += heightA - heightB;
        }
        // Make measure component
        const pointAcartesian = positionsForDirectLine[0];
        const pointBcartesian = positionsForDirectLine[1];
        const pointCcartesian = Cartesian3.fromRadians(
          pointCcartographic.longitude,
          pointCcartographic.latitude,
          pointCcartographic.height,
          ellipsoid,
        );

        if (this._horizontalLine) {
          const positionsForHorizontalLine: Cartesian3[] =
            this._horizontalLine.positions;
          positionsForHorizontalLine[1] = pointCcartesian;
          this._horizontalLine.positions = positionsForHorizontalLine;
        }

        if (this._verticalLine) {
          const positionsForVerticalLine: Cartesian3[] =
            this._verticalLine.positions;
          positionsForVerticalLine[0] = pointBcartesian;
          positionsForVerticalLine[1] = pointCcartesian;
          this._verticalLine.positions = positionsForVerticalLine;
        }

        const directLineLabelPosition = new Cartesian3(
          (pointAcartesian.x + pointBcartesian.x) / 2,
          (pointAcartesian.y + pointBcartesian.y) / 2,
          (pointAcartesian.z + pointBcartesian.z) / 2,
        );
        const horizontalLineLabelPosition = new Cartesian3(
          (pointAcartesian.x + pointCcartesian.x) / 2,
          (pointAcartesian.y + pointCcartesian.y) / 2,
          (pointAcartesian.z + pointCcartesian.z) / 2,
        );
        const verticalLineLabelPosition = new Cartesian3(
          (pointCcartesian.x + pointBcartesian.x) / 2,
          (pointCcartesian.y + pointBcartesian.y) / 2,
          (pointCcartesian.z + pointBcartesian.z) / 2,
        );

        const directDistance = Cartesian3.distance(
          pointAcartesian,
          pointBcartesian,
        );
        const horizontalDistance = Cartesian3.distance(
          pointAcartesian,
          pointCcartesian,
        );
        const verticalDistance = Cartesian3.distance(
          pointBcartesian,
          pointCcartesian,
        );

        if (this._directLineLabel && heightA && heightB) {
          this._directLineLabel.height = (heightA + heightB) / 2;
          this._directLineLabel.position = directLineLabelPosition;
          this._directLineLabel.setText(formatDistance(directDistance));
        }

        if (this._horizontalLineLabel && this._horizontalLine && heightA) {
          this._horizontalLineLabel.height = heightA;
          this._horizontalLineLabel.position = horizontalLineLabelPosition;
          this._horizontalLineLabel.setText(formatDistance(horizontalDistance));
        }

        if (
          this._verticalLineLabel &&
          this._verticalLine &&
          heightA &&
          heightB
        ) {
          this._verticalLineLabel.height = (heightA + heightB) / 2;
          this._verticalLineLabel.position = verticalLineLabelPosition;
          this._verticalLineLabel.setText(formatDistance(verticalDistance));
        }

        if (this._cornerSquare && heightA) {
          const minDistance = Math.min(
            Cartesian3.distance(pointCcartesian, pointAcartesian),
            Cartesian3.distance(pointCcartesian, pointBcartesian),
          );
          const sideLength = Math.min(minDistance / 10, 10);
          const wallPosition = Cartesian3.lerp(
            pointCcartesian,
            pointAcartesian,
            sideLength / horizontalDistance,
            cart3Scratch1,
          ).clone();

          if (this._cornerSquare.wall && heightA && heightB) {
            // @ts-ignore
            this._cornerSquare.wall.positions = [wallPosition, pointCcartesian];
            if (heightA > heightB) {
              // @ts-ignore
              this._cornerSquare.wall.minimumHeights = [
                heightA - sideLength,
                heightA - sideLength,
              ];
              // @ts-ignore
              this._cornerSquare.wall.maximumHeights = [heightA, heightA];
            } else {
              // @ts-ignore
              this._cornerSquare.wall.minimumHeights = [heightA, heightA];
              // @ts-ignore
              this._cornerSquare.wall.maximumHeights = [
                heightA + sideLength,
                heightA + sideLength,
              ];
            }
          }
        }

        this._eventDistanceMeasurementUpdated.raiseEvent([
          pointAcartesian,
          pointBcartesian,
          Cartesian3.distance(pointAcartesian, pointCcartesian),
          Cartesian3.distance(pointBcartesian, pointCcartesian),
          Cartesian3.distance(pointAcartesian, pointBcartesian),
        ]);
      }
    }
  }

  /**
   * Mouse move event, it will send mouse position to function _handleCanvasMoveEvent
   * @param {MouseEvent} event
   * @returns
   */
  canvasMoveEvent(event: MouseEvent): void {
    const position = this.getWorldPosition(event.pos, cart3Scratch);
    if (!defined(position) || !position) {
      return;
    }

    if (this._mode === MeasureToolState.START) {
      this._handleCanvasMoveEvent(position);
    }
  }

  /**
   * Deactivate measurement tool.
   */
  deactivate() {
    super.deactivate();
  }
}
