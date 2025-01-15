// q@ts-nocheck
import {
  Cartesian2,
  KeyboardEventModifier,
  ScreenSpaceEventHandler,
  Scene,
  ScreenSpaceEventType,
  Viewer,
  Transforms,
  SceneMode,
  Matrix4,
} from 'cesium';

import {
  CAMERA_MOVE_DIRECTION,
  CAMERA_MOVE_EASING_TYPE,
  CAMERA_ROTATE_DIRECTION,
  MouseButton,
} from './enums';
import {
  MIN_RESPONSE_TIME,
  SHORTCUT_COMBINATION,
  CAMERA_MOVE_SHORTCUT_KEYS,
  CAMERA_ROTATE_SHORTCUT_KEYS,
  CAMERA_MOVE_COMBINATION,
} from './constants';
import { ShortCutResponseTime } from './types';

interface ScratchMouseEvent {
  pos: Cartesian2;
  button: MouseButton | undefined;
  keyboardModifier: KeyboardEventModifier | undefined;
}
const scratchMouseEvent: ScratchMouseEvent = {
  pos: new Cartesian2(),
  button: undefined,
  keyboardModifier: undefined,
};

class CanvasEventHandler {
  private _viewer: Viewer;
  private _sseh: ScreenSpaceEventHandler;
  private _scene: Scene;
  private _cameraMoveDirection: CAMERA_MOVE_DIRECTION =
    CAMERA_MOVE_DIRECTION.None;
  private _cameraRotateDirection: CAMERA_ROTATE_DIRECTION =
    CAMERA_ROTATE_DIRECTION.None;
  private _moveRate = 0;
  private _rotateRate = 0;
  private _easingMoveTimer: string | number | undefined = undefined;
  private _easingRotateTimer: string | number | undefined = undefined;
  private _cameraMoveEasingType: CAMERA_MOVE_EASING_TYPE =
    CAMERA_MOVE_EASING_TYPE.LINEAR_NONE;

  responseTime: ShortCutResponseTime = {
    PanningResponseTime: MIN_RESPONSE_TIME,
    HRotatingResponseTime: MIN_RESPONSE_TIME,
    VRotatingResponseTime: MIN_RESPONSE_TIME,
    ZoomingResponseTime: MIN_RESPONSE_TIME,
  };

  constructor(options: { viewer: Viewer }) {
    this._viewer = options.viewer;

    const { scene } = options.viewer;

    this._sseh = new ScreenSpaceEventHandler(scene.canvas);
    this._scene = scene;
    this._viewer.clock.onTick.addEventListener(this._eventCameraMovement);
  }

  activate() {
    const sseh = this._sseh;

    sseh.setInputAction(
      this._mouseMove.bind(this),
      ScreenSpaceEventType.MOUSE_MOVE,
    );
    sseh.setInputAction(
      this._mouseMoveCtrl.bind(this),
      ScreenSpaceEventType.MOUSE_MOVE,
      KeyboardEventModifier.CTRL,
    );
    sseh.setInputAction(
      this._mouseMoveShift.bind(this),
      ScreenSpaceEventType.MOUSE_MOVE,
      KeyboardEventModifier.SHIFT,
    );

    sseh.setInputAction(
      this._leftButtonDoubleClick.bind(this),
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );

    sseh.setInputAction(
      this._leftDown.bind(this),
      ScreenSpaceEventType.LEFT_DOWN,
    );
    sseh.setInputAction(
      this._rightDown.bind(this),
      ScreenSpaceEventType.RIGHT_DOWN,
    );

    sseh.setInputAction(this._leftUp.bind(this), ScreenSpaceEventType.LEFT_UP);
    sseh.setInputAction(
      this._leftUpCtrl.bind(this),
      ScreenSpaceEventType.LEFT_UP,
      KeyboardEventModifier.CTRL,
    );
    sseh.setInputAction(
      this._leftUpShift.bind(this),
      ScreenSpaceEventType.LEFT_UP,
      KeyboardEventModifier.SHIFT,
    );

    sseh.setInputAction(
      this._rightUp.bind(this),
      ScreenSpaceEventType.RIGHT_UP,
    );
    sseh.setInputAction(
      this._rightUpCtrl.bind(this),
      ScreenSpaceEventType.RIGHT_UP,
      KeyboardEventModifier.CTRL,
    );
    sseh.setInputAction(
      this._rightUpShift.bind(this),
      ScreenSpaceEventType.RIGHT_UP,
      KeyboardEventModifier.SHIFT,
    );

    // sseh.setInputAction(
    //   (wheel: Cartesian2) => {
    //   this._wheel(wheel);
    // }, ScreenSpaceEventType.WHEEL);
    // sseh.setInputAction(
    //   (wheel: Cartesian2) => {
    //     this._wheelCtrl(wheel);
    //   },
    //   ScreenSpaceEventType.WHEEL,
    //   KeyboardEventModifier.CTRL
    // );

    sseh.setInputAction(
      this._leftClick.bind(this),
      ScreenSpaceEventType.LEFT_CLICK,
    );
    sseh.setInputAction(
      this._leftClickShift.bind(this),
      ScreenSpaceEventType.LEFT_CLICK,
      KeyboardEventModifier.SHIFT,
    );

    const { canvas } = this._scene;

    // needed to put focus on the canvas
    canvas.setAttribute('tabindex', '0');

    canvas.onclick = function () {
      canvas.focus();
    };

    canvas.addEventListener('keydown', this._handleKeyDown.bind(this));
    canvas.addEventListener('keyup', this._handleKeyUp.bind(this));
  }

  deactivate() {
    const sseh = this._sseh;

    sseh.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    sseh.removeInputAction(
      ScreenSpaceEventType.LEFT_CLICK,
      KeyboardEventModifier.SHIFT,
    );

    sseh.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    sseh.removeInputAction(
      ScreenSpaceEventType.MOUSE_MOVE,
      KeyboardEventModifier.SHIFT,
    );
    sseh.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
    sseh.removeInputAction(ScreenSpaceEventType.LEFT_UP);
    sseh.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  }

  static _makeMouseEvent(
    pos: Cartesian2,
    button: MouseButton | undefined,
    keyboardModifier: KeyboardEventModifier | undefined,
  ) {
    Cartesian2.clone(pos, scratchMouseEvent.pos);
    if (button) {
      scratchMouseEvent.button = button;
    }
    if (keyboardModifier) {
      scratchMouseEvent.keyboardModifier = keyboardModifier;
    }

    return scratchMouseEvent;
  }

  static _makeWheelEvent(
    wheel: Cartesian2,
    button: MouseButton | undefined,
    keyboardModifier: KeyboardEventModifier | undefined,
  ) {
    return {
      wheel,
      button,
      keyboardModifier,
    };
  }

  /**
   * Mouse move event on Cesium Viewer
   * It will call drawing tool's canvasMoveEvent function which will be implemented detailed functionality.
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param {Object} movement
   * @param {Cartesian2} movement.startPosition
   * @param {Cartesian2} movement.endPosition
   * @private
   */
  _mouseMove(movement: ScreenSpaceEventHandler.MotionEvent) {
    // @ts-ignore
    if (!this._viewer.mapTool) {
      return;
    }

    const event = CanvasEventHandler._makeMouseEvent(
      movement.endPosition,
      undefined,
      undefined,
    );

    // @ts-ignore
    this._viewer.mapTool.canvasMoveEvent(event);
  }

  /**
   * Mouse move event with holding CTRL key on Cesium Viewer
   * It will call drawing tool's canvasMoveEvent function.
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param {ScreenSpaceEventHandler.MotionEvent} movement
   * @returns
   */
  _mouseMoveCtrl(movement: ScreenSpaceEventHandler.MotionEvent) {
    // @ts-ignore
    if (!this._viewer.mapTool) {
      return;
    }

    const event = CanvasEventHandler._makeMouseEvent(
      movement.endPosition,
      undefined,
      KeyboardEventModifier.CTRL,
    );
    // @ts-ignore
    this._viewer.mapTool.canvasMoveEvent(event);
  }

  /**
   * Mouse move event with holding SHIFT key on Cesium Viewer
   * It will call drawing tool's canvasMoveEvent function.
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param {ScreenSpaceEventHandler.MotionEvent} movement
   * @returns
   */
  _mouseMoveShift(movement: ScreenSpaceEventHandler.MotionEvent) {
    // @ts-ignore
    if (!this._viewer.mapTool) {
      return;
    }
    const event = CanvasEventHandler._makeMouseEvent(
      movement.endPosition,
      undefined,
      KeyboardEventModifier.SHIFT,
    );
    // @ts-ignore
    this._viewer.mapTool.canvasMoveEvent(event);
  }

  /**
   * MLB Double click event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasDoubleClickEvent function which will be implemented detailed functionality.
   *
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftButtonDoubleClick(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      undefined,
    );

    this._handleDoubleClick(event);
  }

  _handleDoubleClick(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.canvasDoubleClickEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * MLB press down event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasPressEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftDown(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      undefined,
    );

    this._handleDown(event);
  }

  /**
   * MRB press down event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasPressEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _rightDown(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.RightButton,
      undefined,
    );

    this._handleDown(event);
  }

  _handleDown(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.canvasPressEvent(event);
    }
  }

  /**
   * MLB release event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasReleaseEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftUp(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      undefined,
    );

    this._handleUp(event);
  }

  /**
   * MLB down event with holding CTRL key on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasReleaseEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftUpCtrl(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      KeyboardEventModifier.CTRL,
    );

    this._handleUp(event);
  }

  /**
   * MLB release event with holding SHIFT key on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasReleaseEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftUpShift(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      KeyboardEventModifier.SHIFT,
    );

    this._handleUp(event);
  }

  /**
   * MRB release event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasReleaseEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _rightUp(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.RightButton,
      undefined,
    );

    this._handleUp(event);
  }

  /**
   * MRB release event with holding CTRL key on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasReleaseEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _rightUpCtrl(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.RightButton,
      KeyboardEventModifier.CTRL,
    );

    this._handleUp(event);
  }

  /**
   * MRB release event with holding SHIFT key on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasReleaseEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _rightUpShift(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.RightButton,
      KeyboardEventModifier.SHIFT,
    );

    this._handleUp(event);
  }

  _handleUp(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.canvasReleaseEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * MLB click event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasClickEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftClick(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      undefined,
    );

    this._handleClick(event);
  }

  /**
   * MLB click event with holding SHIFT key on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's canvasClickEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _leftClickShift(movement: ScreenSpaceEventHandler.PositionedEvent) {
    const event = CanvasEventHandler._makeMouseEvent(
      movement.position,
      MouseButton.LeftButton,
      KeyboardEventModifier.SHIFT,
    );

    this._handleClick(event);
  }

  _handleClick(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.canvasClickEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * Mouse wheel event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's wheelEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _wheel(wheel: Cartesian2) {
    const event = CanvasEventHandler._makeWheelEvent(
      wheel,
      undefined,
      undefined,
    );

    this._handleWheel(event);
  }

  /**
   * @param {Number} wheel
   * @private
   */
  _wheelCtrl(wheel: Cartesian2) {
    const event = CanvasEventHandler._makeWheelEvent(
      wheel,
      undefined,
      KeyboardEventModifier.CTRL,
    );

    this._handleWheel(event);
  }

  _handleWheel(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.wheelEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }
  }

  /**
   * Key press event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's keyPressEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _handleKeyDown(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.keyPressEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }

    // Camera control: Pan UP/DOWN/LEFT/RIGHT with W/S/A/D key each, orbit RIGHT/LEFT/UP/DOWN with Q/E/R/F each.
    if (event.ctrlKey || event.shiftKey) {
      return;
    }

    if (this._easingMoveTimer) {
      clearInterval(this._easingMoveTimer);
      this._easingMoveTimer = undefined;
    }

    if (this._easingRotateTimer) {
      clearInterval(this._easingRotateTimer);
      this._easingRotateTimer = undefined;
    }

    if (Object.keys(CAMERA_MOVE_SHORTCUT_KEYS).includes(event.key)) {
      const possibleMoves = Object.keys(CAMERA_MOVE_SHORTCUT_KEYS[event.key]);
      if (!this._cameraMoveDirection) {
        this._cameraMoveDirection =
          CAMERA_MOVE_SHORTCUT_KEYS[event.key]['None'];
      } else if (possibleMoves.includes(this._cameraMoveDirection)) {
        this._cameraMoveDirection =
          CAMERA_MOVE_SHORTCUT_KEYS[event.key][this._cameraMoveDirection];
      }
    }

    if (Object.keys(CAMERA_ROTATE_SHORTCUT_KEYS).includes(event.key)) {
      this._cameraRotateDirection = CAMERA_ROTATE_SHORTCUT_KEYS[event.key];
    }

    const { camera } = this._viewer;
    const ellipsoid = scene.globe.ellipsoid;
    // Change movement speed based on the distance of the camera to the surface of the ellipsoid.
    const cameraHeight = ellipsoid.cartesianToCartographic(
      camera.position,
    ).height;

    /**
     * _moveRate is set such that the movement speed is faster
     * when the camera is higher (providing a broader view)
     * and slower when closer to the ground (for detailed exploration).
     * Also, movement is faster when moving forward/backward.
     */
    this._moveRate = cameraHeight / 100.0;

    // Camera rotate step for every key press.
    this._rotateRate = 0.05;
  }

  /**
   * Key release event on Cesium Viewer
   * This event will be connected by ScreenSpaceEventHandler.setInputAction function in this constructor.
   * It will call drawing tool's keyReleaseEvent function which will be implemented detailed functionality.
   * Reference : https://cesium.com/lenarn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html
   * @param   {Object} movement
   * @param   {Cartesian2} movement.position
   * @private
   */
  _handleKeyUp(event: any) {
    // @ts-ignore
    if (this._viewer.mapTool) {
      // @ts-ignore
      this._viewer.mapTool.keyReleaseEvent(event);
    }

    const scene = this._scene;

    if (scene.requestRenderMode) {
      scene.requestRender();
    }

    if (this._easingMoveTimer) {
      clearInterval(this._easingMoveTimer);
      this._easingMoveTimer = undefined;
    }

    if (this._easingRotateTimer) {
      clearInterval(this._easingRotateTimer);
      this._easingRotateTimer = undefined;
    }

    const { camera } = this._viewer;

    this._cameraMoveDirection = CAMERA_MOVE_DIRECTION.None;

    if (this._cameraRotateDirection && scene.mode === SceneMode.SCENE3D) {
      try {
        const windowPosition = new Cartesian2(
          this._viewer.container.clientWidth / 2,
          this._viewer.container.clientHeight / 2,
        );
        const pickRay = camera.getPickRay(windowPosition);
        if (!pickRay) {
          return;
        }
        const pickPosition = scene.globe.pick(pickRay, scene);
        if (!pickPosition) {
          return;
        }
      } catch (e) {
        console.error('Camera orbit failed');
      }
    }
    this._cameraRotateDirection = CAMERA_ROTATE_DIRECTION.None;
  }

  // Event to make camera movement smooth.
  _eventCameraMovement = () => {
    const { camera, scene } = this._viewer;
    if (this._cameraMoveDirection) {
      this._viewer.camera.lookAtTransform(Matrix4.IDENTITY);
      if (!SHORTCUT_COMBINATION.includes(this._cameraMoveDirection)) {
        camera[this._cameraMoveDirection](this._moveRate);
      } else {
        camera[CAMERA_MOVE_COMBINATION[this._cameraMoveDirection][0]](
          this._moveRate,
        );
        camera[CAMERA_MOVE_COMBINATION[this._cameraMoveDirection][1]](
          this._moveRate,
        );
      }
    }
    if (this._cameraRotateDirection && scene.mode === SceneMode.SCENE3D) {
      try {
        const windowPosition = new Cartesian2(
          this._viewer.container.clientWidth / 2,
          this._viewer.container.clientHeight / 2,
        );
        const pickRay = camera.getPickRay(windowPosition);
        if (!pickRay) {
          return;
        }
        const pickPosition = scene.globe.pick(pickRay, scene);
        if (!pickPosition) {
          return;
        }
        const transform = Transforms.eastNorthUpToFixedFrame(pickPosition);
        camera.lookAtTransform(transform);
        camera[this._cameraRotateDirection](this._rotateRate);
        camera.lookAtTransform(Matrix4.IDENTITY);
      } catch (e) {
        console.error('Camera orbit failed');
      }
    }
  };

  get cameraMoveEasingType() {
    return this._cameraMoveEasingType;
  }

  set cameraMoveEasingType(animationType: CAMERA_MOVE_EASING_TYPE) {
    this._cameraMoveEasingType = animationType;
  }
}

export default CanvasEventHandler;
