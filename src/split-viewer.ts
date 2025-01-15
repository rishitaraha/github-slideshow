import { Event } from 'cesium';
import { CesiumViewer } from './cesium-viewer';
import { HTMLMouseEventName } from './shared';
import {
  SplitViewerConstructorOptions,
  SplitViewerFlyToOptions,
  ZoomMode,
} from './types';

/* SplitViewer
 * 2 Cesium viewers syncronizing, while splitting slider moving horizontal direction
 * _viewerLeft : left cesium viewer
 * _viewerRight : right cesium viewer
 * _slider : split html element thin and vertical
 */

export class SplitViewer {
  private _viewerLeft: CesiumViewer;
  private _viewerRight: CesiumViewer;
  private _slider: HTMLDivElement;

  private readonly _eventSliderChanged = new Event();

  private _handleSliderDragging!: (e: MouseEvent) => void;
  private _handleSliderMouseUp!: () => void;
  private _handleSliderMouseDown!: () => void;
  private _handleLeftViewerEnter!: () => void;
  private _handleLeftViewerOut!: () => void;
  private _handleRightViewerEnter!: () => void;
  private _handleRightViewerOut!: () => void;
  private _handleSyncCamera!: () => void;

  private _sliderIsDragging = false;
  private _isMouseInLeftView = false;
  private _isMouseInRightView = false;

  constructor(options: SplitViewerConstructorOptions) {
    const {
      cesiumContainerLeft,
      cesiumContainerRight,
      slider,
      token,
      optionsLeft,
      optionsRight,
    } = options;
    this._slider = slider;
    this._viewerLeft = new CesiumViewer(
      cesiumContainerLeft,
      token,
      optionsLeft,
    );
    this._viewerRight = new CesiumViewer(
      cesiumContainerRight,
      token,
      optionsRight,
    );

    if (!this._viewerLeft.viewer || !this._viewerRight.viewer) {
      return;
    }

    // Make screen inertia 0 to syncronizing movements of cameras
    this._viewerLeft.viewer.scene.screenSpaceCameraController.inertiaSpin = 0;
    this._viewerLeft.viewer.scene.screenSpaceCameraController.inertiaTranslate = 0;
    this._viewerLeft.viewer.scene.screenSpaceCameraController.inertiaZoom = 0;
    this._viewerRight.viewer.scene.screenSpaceCameraController.inertiaSpin = 0;
    this._viewerRight.viewer.scene.screenSpaceCameraController.inertiaTranslate = 0;
    this._viewerRight.viewer.scene.screenSpaceCameraController.inertiaZoom = 0;

    // Syncronizing cameras of 2 views
    // - Check momements both of cameras and store camera properties
    // - If one of them moving detected, the other camera will get the same properties.
    this._handleLeftViewerEnter = () => {
      this._isMouseInLeftView = true;
    };
    // Triggered when mouse enter to left viewer
    this._viewerLeft.viewer.canvas.addEventListener(
      HTMLMouseEventName.MOUSE_ENTER,
      this._handleLeftViewerEnter,
    );
    this._handleLeftViewerOut = () => {
      this._isMouseInLeftView = false;
    };

    // Triggered when mouse out from left viewer
    this._viewerLeft.viewer.canvas.addEventListener(
      HTMLMouseEventName.MOUSE_OUT,
      this._handleLeftViewerOut,
    );

    this._handleRightViewerEnter = () => {
      this._isMouseInRightView = true;
    };
    // Triggered when mouse enter to right viewer
    this._viewerRight.viewer.canvas.addEventListener(
      HTMLMouseEventName.MOUSE_ENTER,
      this._handleRightViewerEnter,
    );
    this._handleRightViewerOut = () => {
      this._isMouseInRightView = false;
    };
    // Triggered when mouse out from right viewer
    this._viewerRight.viewer.canvas.addEventListener(
      HTMLMouseEventName.MOUSE_OUT,
      this._handleRightViewerOut,
    );

    // This is called everytime when the clock time changed.
    // Here we can syncronize left and right cameras.
    this._handleSyncCamera = () => {
      if (this._isMouseInRightView) {
        this.syncCameraRight();
      } else {
        this.syncCameraLeft();
      }
    };
    this._viewerLeft.viewer.cesiumWidget.clock.onTick.addEventListener(
      this._handleSyncCamera,
    );

    // Raise event when slider dragged
    this._handleSliderDragging = (e: MouseEvent) => {
      if (this._sliderIsDragging) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        this._eventSliderChanged.raiseEvent([newWidth]);
        slider.style.left = `${newWidth}%`;

        cesiumContainerRight.style.clipPath = `inset(0 0 0 ${newWidth}%)`;
        cesiumContainerLeft.style.clipPath = `inset(0 ${100 - newWidth}% 0 0)`;
      }
    };

    // Mouse is out of the thin slider easily, and lost event.
    this._handleSliderMouseUp = () => {
      this._sliderIsDragging = false;
      document.removeEventListener(
        HTMLMouseEventName.MOUSE_MOVE,
        this._handleSliderDragging,
      );
    };

    // Mouse down started from slider and mouse moving is from document
    this._handleSliderMouseDown = () => {
      this._sliderIsDragging = true;
      document.addEventListener(
        HTMLMouseEventName.MOUSE_MOVE,
        this._handleSliderDragging,
      );
    };

    document.addEventListener(
      HTMLMouseEventName.MOUSE_UP,
      this._handleSliderMouseUp,
    );
    this._slider.addEventListener(
      HTMLMouseEventName.MOUSE_DOWN,
      this._handleSliderMouseDown,
    );

    // Show/Hide FPS on the right corner of ceisum viewer
    this._viewerLeft.viewer.scene.debugShowFramesPerSecond = false;
    this._viewerRight.viewer.scene.debugShowFramesPerSecond = false;
  }

  get viewerLeft() {
    return this._viewerLeft;
  }

  get viewerRight() {
    return this._viewerRight;
  }

  get eventSliderChanged() {
    return this._eventSliderChanged;
  }

  // Triggered when left camera changed
  syncCameraLeft() {
    if (!this._viewerLeft.viewer || !this._viewerRight.viewer) {
      return;
    }
    const { camera: cameraLeft } = this._viewerLeft.viewer.scene;
    const { camera: cameraRight } = this._viewerRight.viewer.scene;

    // Store the properties of left camera
    const store = {
      position: cameraLeft.position.clone(),
      direction: cameraLeft.direction.clone(),
      up: cameraLeft.up.clone(),
      right: cameraLeft.right.clone(),
      transform: cameraLeft.transform.clone(),
      frustum: cameraLeft.frustum.clone(),
    };

    // And reset right camera with the stored properties
    cameraRight.position = store.position;
    cameraRight.direction = store.direction;
    cameraRight.up = store.up;
    cameraRight.right = store.right;
    cameraRight.frustum = store.frustum;
  }

  // Triggered when right camera changed,
  syncCameraRight() {
    if (!this._viewerLeft.viewer || !this._viewerRight.viewer) {
      return;
    }
    const { camera: cameraLeft } = this._viewerLeft.viewer.scene;
    const { camera: cameraRight } = this._viewerRight.viewer.scene;

    // Store the properties of right camera
    const store = {
      position: cameraRight.position.clone(),
      direction: cameraRight.direction.clone(),
      up: cameraRight.up.clone(),
      right: cameraRight.right.clone(),
      transform: cameraRight.transform.clone(),
      frustum: cameraRight.frustum.clone(),
    };

    // And reset left camera with the stored properties
    cameraLeft.position = store.position;
    cameraLeft.direction = store.direction;
    cameraLeft.up = store.up;
    cameraLeft.right = store.right;
    cameraLeft.frustum = store.frustum;
  }

  flyTo(options: SplitViewerFlyToOptions) {
    if (!this._viewerLeft.viewer || !this._viewerRight.viewer) {
      return;
    }

    const { longitude, latitude, height, heading, pitch, roll } = options;
    this._viewerLeft.flyTo(longitude, latitude, height, heading, pitch, roll);
    this._viewerRight.flyTo(longitude, latitude, height, heading, pitch, roll);
  }

  /**
   * Function to manage zoom levels. If relative amount is > 1, we'll be zooming in
   * else if relative amount < 1 we'll zoom out.
   *
   * @param mode Specify whether we're zooming in or zooming out.
   * @returns
   */
  zoom(mode = ZoomMode.ZoomIn) {
    if (!this._viewerLeft.viewer || !this._viewerRight.viewer) {
      return;
    }

    this._viewerLeft.zoom(mode);
  }

  destroy() {
    // Remove event listner for HTML document
    document.removeEventListener(
      HTMLMouseEventName.MOUSE_UP,
      this._handleSliderMouseUp,
    );
    document.removeEventListener(
      HTMLMouseEventName.MOUSE_MOVE,
      this._handleSliderDragging,
    );
    this._slider.removeEventListener(
      HTMLMouseEventName.MOUSE_DOWN,
      this._handleSliderMouseDown,
    );

    if (!this._viewerLeft.viewer || !this._viewerRight.viewer) {
      return;
    }

    // Remove event listener for viewer canvas
    this._viewerLeft.viewer.canvas.removeEventListener(
      HTMLMouseEventName.MOUSE_ENTER,
      this._handleLeftViewerEnter,
    );
    this._viewerLeft.viewer.canvas.removeEventListener(
      HTMLMouseEventName.MOUSE_OUT,
      this._handleLeftViewerOut,
    );
    this._viewerRight.viewer.canvas.removeEventListener(
      HTMLMouseEventName.MOUSE_ENTER,
      this._handleRightViewerEnter,
    );
    this._viewerRight.viewer.canvas.removeEventListener(
      HTMLMouseEventName.MOUSE_OUT,
      this._handleRightViewerOut,
    );

    this._viewerLeft.viewer.cesiumWidget.clock.onTick.removeEventListener(
      this._handleSyncCamera,
    );
  }
}
