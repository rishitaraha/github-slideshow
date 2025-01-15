import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Event,
  IntersectionTests,
  Ion,
  Ray,
  SceneMode,
  Viewer,
} from 'cesium';

import DrawingToolsMixin from './mixins/drawing-tool.mixin';
import CesiumInfoToolMixin from './mixins/feature-info-tool.mixin';
import CesiumLayerToolMixin from './mixins/layer-tool.mixin';
import SelectToolsMixin from './mixins/select-tool.mixin';
import StyleToolsMixin from './mixins/style-tool.mixin';
import TextDrawToolsMixin from './mixins/text-tool.mixin';
import {
  GLOBE_RADIUS,
  HTMLMouseEventName,
  ShortCutResponseTime,
} from './shared';
import { CesiumViewerType, ZoomMode } from './types';
import { GEOMETRY_TYPE, GeometryIDType, WKT } from './utils';
import { GeoJson } from './utils/geojson';

export class CesiumViewer {
  private _viewer: CesiumViewerType | undefined;
  destroyingCesiumViewer = false;

  // Camera option
  private _lat = 0;
  private _lon = 0;
  private _heading = 0;
  private _pitch = 0;
  private _roll = 0;
  private _height = 0;
  private _disableZoom = false;
  readonly eventCesiumViewerCreated = new Event();

  readonly eventCesiumViewerDestroyed = new Event();

  constructor(
    cesiumContainer: Element,
    token: string,
    options?: Viewer.ConstructorOptions,
    disableZoom?: boolean,
  ) {
    Ion.defaultAccessToken = token;

    cesiumContainer.addEventListener(HTMLMouseEventName.MOUSE_OUT, () => {
      if (!this._viewer) {
        return;
      }
      this._viewer.drawingTools.hideMarker();
    });
    cesiumContainer.addEventListener(HTMLMouseEventName.MOUSE_ENTER, () => {
      if (!this._viewer) {
        return;
      }
      this._viewer.drawingTools.showMarker();
    });

    this._viewer = new Viewer(cesiumContainer, options) as CesiumViewerType;

    this.initMixins();

    this.eventCesiumViewerCreated.raiseEvent();

    if (disableZoom) {
      this._disableZoom = true;
      const scene = this._viewer.scene;
      scene.screenSpaceCameraController.enableZoom = false;
    }

    this._viewer.scene.screenSpaceCameraController.maximumZoomDistance =
      GLOBE_RADIUS * 3;
    // To prevent that camera goes under terrain.
    this._viewer.scene.screenSpaceCameraController.enableCollisionDetection =
      true;

    // Adjust camera's height by globe diamiter.
    const ellipsoid = this._viewer.scene.globe.ellipsoid;
    const camera = this._viewer.scene.camera;
    const cameraHeight = ellipsoid.cartesianToCartographic(
      camera.position,
    ).height;

    if (cameraHeight > GLOBE_RADIUS * 3) {
      camera.moveForward(cameraHeight - GLOBE_RADIUS * 3);
    }
  }

  private initMixins() {
    const viewer = this._viewer;

    viewer?.extend(DrawingToolsMixin);
    viewer?.extend(SelectToolsMixin);
    viewer?.extend(StyleToolsMixin);
    viewer?.extend(TextDrawToolsMixin);
    viewer?.extend(CesiumLayerToolMixin);
    viewer?.extend(CesiumInfoToolMixin);
  }

  get viewer() {
    return this._viewer;
  }

  get disableZoom() {
    return this._disableZoom;
  }

  zoomWithCtrl(forward: boolean) {
    if (!this._viewer) {
      return;
    }
    const scene = this._viewer.scene;
    const camera = this._viewer.camera;
    const ellipsoid = scene.globe.ellipsoid;
    const cameraHeight = ellipsoid.cartesianToCartographic(
      camera.position,
    ).height;
    const moveRate = cameraHeight / 10.0;

    if (forward) {
      camera.moveForward(moveRate);
    } else {
      camera.moveBackward(moveRate);
    }
  }

  flyTo = (
    longitude: string,
    latitude: string,
    height = 9000,
    heading = 0.0,
    pitch = -CesiumMath.PI_OVER_TWO,
    roll = 0.0,
  ) => {
    if (this._viewer) {
      this._lon = parseFloat(longitude);
      this._lat = parseFloat(latitude);
      this._height = height;
      this._heading = heading;
      this._pitch = pitch;
      this._roll = roll;

      this._viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(this._lon, this._lat, this._height),
        orientation: {
          heading: this._heading,
          pitch: this._pitch,
          roll: this._roll,
        },
        duration: 2,
      });
    }
  };

  switchTo2D() {
    if (!this._viewer) {
      return;
    }

    const viewer = this._viewer;
    const scene = viewer.scene;

    if (scene.mode === SceneMode.SCENE2D) {
      return;
    }
    const camera = viewer.camera;
    const canvas = viewer.scene.canvas;
    const screenCenter = new Cartesian2(
      canvas.clientWidth / 2.0,
      canvas.clientHeight / 2.0,
    );
    const ellipsoid = viewer.scene.globe.ellipsoid;
    const origin = camera.pickEllipsoid(screenCenter, ellipsoid);

    if (!origin) {
      return;
    }
    const originCarto = Cartographic.fromCartesian(origin);
    const cameraCarto = Cartographic.fromCartesian(camera.position);

    if (cameraCarto.height <= 0) {
      console.error(
        `Error: The camera height is below ground level. Ensure the camera height is positive to avoid issues with rendering. Current camera height: ${cameraCarto.height}`,
      );
      return;
    }

    camera.flyTo({
      destination: Cartesian3.fromRadians(
        originCarto.longitude,
        originCarto.latitude,
        cameraCarto.height,
      ),
      orientation: {
        heading: 0,
        pitch: -CesiumMath.PI_OVER_TWO,
        roll: 0,
      },
      duration: 0,
      complete: () => {
        scene.mode = SceneMode.SCENE2D;
      },
    });
  }

  switchTo3D() {
    if (!this._viewer) {
      return;
    }
    const scene = this._viewer.scene;
    if (scene.mode === SceneMode.SCENE3D) {
      return;
    }

    scene.mode = SceneMode.SCENE3D;
  }

  /**
   * Calculates and returns the focus point of the camera on the globe.
   *
   * This function casts a ray from the camera's current position and direction,
   * and determines where the camera is focused on the globe's surface.
   *
   * @return The focus point in world coordinates, or undefined if no focus is found or if the camera/scene is not available.
   */
  #getCameraFocus() {
    if (!this.viewer) {
      return;
    }

    const { camera, scene } = this.viewer;
    const rayScratch = new Ray();

    let focus: Cartesian3 | undefined = new Cartesian3();

    if (!camera || !scene) {
      return;
    }

    rayScratch.origin = camera.positionWC;
    rayScratch.direction = camera.directionWC;
    focus = scene.globe.pick(rayScratch, scene, focus);

    return focus;
  }
  /**
   * Finds the point where the camera's view just touches the horizon of the globe.
   *
   * This is useful when the camera is looking out towards the horizon instead of down at the globe.
   *
   * @param viewer The Cesium Viewer instance to get the camera and scene information.
   * @returns The point on the horizon in world coordinates, or undefined if there's no intersection.
   */
  #calculateHorizonFocus(viewer: CesiumViewerType) {
    const { camera, scene } = viewer;
    const { ellipsoid } = scene.globe;
    const cartesianPosition = ellipsoid.cartographicToCartesian(
      camera.positionCartographic,
    );

    const worldCoordinates =
      camera.worldToCameraCoordinatesPoint(cartesianPosition);
    const ray = new Ray(worldCoordinates, camera.directionWC);

    // Find the point where the ray grazes the surface of the ellipsoid (horizon point)
    return IntersectionTests.grazingAltitudeLocation(ray, ellipsoid);
  }

  /**
   * Function to manage zoom levels. If relative amount is > 1, we'll be zooming in
   * else if relative amount < 1 we'll zoom out.
   *
   * @param mode Specify whether we're zooming in or zooming out.
   * @returns
   */
  zoom(mode = ZoomMode.ZoomIn) {
    if (!this.viewer) {
      return;
    }

    const { camera, scene } = this.viewer;
    const relativeAmount = mode === ZoomMode.ZoomIn ? 1 / 2 : 2;

    const MIN_HEIGHT = 100;
    const MAX_HEIGHT = 15000000;
    const currentHeight = camera.positionCartographic.height;

    /*
     * If the camera's height is already at or below the minimum zoom height, stop zooming in.
     * Cesium throws developer error beyond ~ z -> 560025903767740.
     */
    if (
      (mode === ZoomMode.ZoomOut && currentHeight >= MAX_HEIGHT) ||
      (mode === ZoomMode.ZoomIn && currentHeight <= MIN_HEIGHT)
    ) {
      return;
    }

    if (scene.mode === SceneMode.SCENE2D) {
      camera.zoomIn(currentHeight * (1 - relativeAmount));
    } else {
      let focus = this.#getCameraFocus(),
        orientation;

      const cartesian3Scratch = new Cartesian3();

      if (!focus) {
        focus = this.#calculateHorizonFocus(this.viewer);

        orientation = {
          heading: camera.heading,
          pitch: camera.pitch,
          roll: camera.roll,
        };
      } else {
        orientation = {
          direction: camera.direction,
          up: camera.up,
        };
      }

      const direction = Cartesian3.subtract(
        camera.position,
        focus,
        cartesian3Scratch,
      );

      const movementVector = Cartesian3.multiplyByScalar(
        direction,
        relativeAmount,
        direction,
      );

      const endPosition = Cartesian3.add(focus, movementVector, focus);

      camera.flyTo({
        destination: endPosition,
        orientation,
        duration: 0.5,
        convert: false,
      });
    }
  }

  exportToWKT() {
    if (!this._viewer) {
      return;
    }
    return WKT.toWKT(this._viewer);
  }

  importWKT(
    wktString: string,
    geometryId?: string,
    geometryLabel?: string,
  ): GeometryIDType | undefined {
    if (!this._viewer) {
      return;
    }
    const geometryIds = WKT.fromWKT(
      wktString,
      this._viewer,
      geometryId,
      geometryLabel,
    );
    return geometryIds;
  }

  exportToGeoJson() {
    if (!this._viewer) {
      return;
    }
    return GeoJson.toGeoJson(this._viewer);
  }

  importGeoJson(geoJsonText: string): GeometryIDType | undefined {
    if (!this._viewer) {
      return;
    }
    const geometryIds = GeoJson.fromGeoJson(geoJsonText, this._viewer);
    return geometryIds;
  }

  exportGeometryToGeoJson(id: string, geometryType: string) {
    if (!this._viewer) {
      return;
    }

    switch (geometryType) {
      case GEOMETRY_TYPE.POINT:
        return GeoJson.exportPoint(this._viewer, id);
      case GEOMETRY_TYPE.LINE:
        return GeoJson.exportLine(this._viewer, id);
      case GEOMETRY_TYPE.POLYGON:
        return GeoJson.exportPolygon(this._viewer, id);
      default:
        return;
    }
  }

  setShortcutResponseTime(responseTime: ShortCutResponseTime) {
    if (!this._viewer) {
      return;
    }
    this._viewer._canvasEventHandler.responseTime = responseTime;
  }

  // Destroy cesium viewer
  private destroyCesiumViewer() {
    const cesiumViewer = this._viewer;
    cesiumViewer?.destroy();
    this.eventCesiumViewerDestroyed.raiseEvent();
    this._viewer = undefined;
  }
}
