import { CesiumViewer, CesiumViewerType, ZoomMode } from '@aus-platform/cesium';
import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Color,
  HeadingPitchRange,
  Rectangle,
  ScreenSpaceEventType,
} from 'cesium';

import { isUndefined } from 'lodash';
import CesiumNavigation, { NavigationOptions } from 'cesium-navigation-es6'; // eslint-disable-line import/default
import { EnvVariables } from '../env-variables';
import { FixedLengthArray } from '../type-utils';
import { getCartographicPositionFromMousePosition } from './helpers';
import { CesiumLayerManager } from './managers';
import { BoundingBox, FlyToArguments } from './types';

// @TODO: Add cesium proxy type interface.
export class CesiumProxy {
  private readonly _cesiumViewer: CesiumViewer;
  private _layerManager: CesiumLayerManager | null;

  constructor(viewer: CesiumViewer) {
    this._cesiumViewer = viewer;
    this._layerManager = new CesiumLayerManager(viewer);
    if (this._cesiumViewer.viewer) {
      if (
        !isUndefined(EnvVariables.environment) &&
        ['development', 'uat'].includes(EnvVariables.environment)
      ) {
        this._cesiumViewer.viewer.scene.debugShowFramesPerSecond = true;
      }

      // Cesium navigation third party tool. ref: https://www.npmjs.com/package/cesium-navigation-es6
      const options: NavigationOptions = {
        enableCompass: true,
        enableZoomControls: false,
        enableDistanceLegend: true,
        enableCompassOuterRing: true,
      };

      new CesiumNavigation(this._cesiumViewer.viewer, options);
    } else {
      console.error('Viewer is not initialized');
    }
  }

  switchTo3D = () => this.cesiumViewer.switchTo3D();

  switchTo2D = () => this.cesiumViewer.switchTo2D();

  setGlobeBaseColor(color: Color) {
    this.viewer.scene.globe.baseColor = color;
  }

  getGlobeHeight(destination: Cartographic) {
    return this.viewer.scene.globe.getHeight(destination);
  }

  setNavigationResetLocation(longitude: string, latitude: string) {
    const navElement = document.getElementsByClassName('navigation-controls');

    navElement
      ?.item(0)
      ?.children.item(1)
      ?.addEventListener('click', () => {
        this.cesiumViewer.flyTo(longitude, latitude);
      });
  }

  flyTo({ longitude, latitude, height, heading, pitch, roll }: FlyToArguments) {
    this._cesiumViewer.flyTo(longitude, latitude, height, heading, pitch, roll);
  }

  flyToBounds(bounds: BoundingBox) {
    const rectangle = Rectangle.fromDegrees(...bounds);

    const boundingSphere = BoundingSphere.fromRectangle3D(rectangle);

    // Pitch: -90 degrees to look straight down.
    const offset = new HeadingPitchRange(0, -CesiumMath.PI_OVER_TWO, 0);

    this.viewer.camera.flyToBoundingSphere(boundingSphere, { offset });
  }

  flyCameraTo(options: {
    destination: Cartesian3 | Rectangle;
    duration?: number;
  }) {
    this.viewer.camera.flyTo(options);
  }

  /**
   * Flies the camera to the default earth view.
   * @param duration duration in seconds in which the camera will fly to default earth view.
   */
  flyHome(duration?: number) {
    this.viewer.camera.flyHome(duration);
  }

  // Navigation controls.
  zoomOut() {
    this.cesiumViewer.zoom(ZoomMode.ZoomOut);
  }

  zoomIn() {
    this.cesiumViewer.zoom(ZoomMode.ZoomIn);
  }

  reset(bounds?: FixedLengthArray<number, 4>) {
    if (bounds) {
      this.flyToBounds(bounds);
    } else {
      this.flyHome(1.5);
    }
  }

  /**
   * To set mouse location listener using screen space handler.
   */
  setMouseLocationListener(
    onMouseLocationUpdate: (newMouseLocation: string) => void,
  ) {
    this.viewer.screenSpaceEventHandler.setInputAction(
      this._getMouseLocationHandler(onMouseLocationUpdate),
      ScreenSpaceEventType.MOUSE_MOVE,
    );
  }

  /**
   * To get the mouse location handler function with altitude.
   */
  _getMouseLocationHandler = (
    onMouseLocationUpdate: (newMouseLocation: string) => void,
  ) => {
    return (event: { endPosition: any }) => {
      const windowPosition = event.endPosition;
      if (!isUndefined(windowPosition)) {
        const position = getCartographicPositionFromMousePosition(
          windowPosition,
          this._cesiumViewer.viewer,
        );
        if (position) {
          const mouseLocationString =
            position.latitude +
            ', ' +
            position.longitude +
            ', ' +
            position.altitude;
          onMouseLocationUpdate(mouseLocationString);
        }
      }
    };
  };

  // Getters.
  get cesiumViewer(): CesiumViewer {
    return this._cesiumViewer;
  }

  get viewer(): CesiumViewerType {
    if (!this._cesiumViewer.viewer) {
      throw new Error('Viewer is not initialized');
    }

    return this._cesiumViewer.viewer;
  }

  get layerManager(): CesiumLayerManager {
    if (!this._layerManager) {
      throw new Error('Layer Manager is not initialized');
    }

    return this._layerManager;
  }

  get drawingTools() {
    return this.viewer.drawingTools;
  }

  get textTool() {
    return this.viewer.textTool;
  }

  get isDestroyed() {
    return this.viewer.isDestroyed();
  }

  destroy() {
    this._layerManager = null;
    this.viewer.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.MOUSE_MOVE,
    );
    if (!this.isDestroyed) {
      this._cesiumViewer.viewer?.destroy();
    }
  }
}
