import { Cartesian3, Scene, EasingFunction, Transforms, Matrix4 } from 'cesium';
import {
  CAMERA_MOVE_COMBINATION,
  CAMERA_MOVE_DIRECTION,
  CAMERA_MOVE_EASING_TYPE,
  CAMERA_MOVE_TYPE,
  CAMERA_ROTATE_DIRECTION,
  SHORTCUT_COMBINATION,
  ShortCutResponseTime,
} from '../shared';
import { calculateVectorCombination } from './common';

type EasingParameter = {
  direction: Cartesian3;
  amount: number;
  duration?: CAMERA_MOVE_TYPE;
};

export function cameraEasingMove(
  scene: Scene,
  direction: Cartesian3,
  amount: number,
  animationType: CAMERA_MOVE_EASING_TYPE,
  duration = 1.0,
) {
  const moveScratch = new Cartesian3();
  const camera = scene.camera;

  const cameraOrigin = camera.position.clone();
  const cameraDestination = new Cartesian3();

  Cartesian3.multiplyByScalar(direction, amount, moveScratch);
  Cartesian3.add(cameraOrigin, moveScratch, cameraDestination);
  // @ts-ignore
  const tween = scene.tweens.add({
    update: () => {
      camera.position = cameraOrigin;
    },
    complete: () => {
      // @ts-ignore
      scene.tweens.remove(tween);
    },
    startObject: cameraOrigin,
    stopObject: cameraDestination,
    duration,
    easingFunction: EasingFunction[animationType],
  });
}

export function cameraEasingRotate(
  scene: Scene,
  angle: number,
  pickPosition: Cartesian3,
  direction: CAMERA_ROTATE_DIRECTION,
  animationType: CAMERA_MOVE_EASING_TYPE,
  duration = 1.0,
) {
  const previousValue = new Cartesian3(0, 0, 0);
  // @ts-ignore
  const tween = scene.tweens.add({
    update: (value: Cartesian3) => {
      const delta = value.x - previousValue.x;
      const transform = Transforms.eastNorthUpToFixedFrame(pickPosition);
      scene.camera.lookAtTransform(transform);
      scene.camera[direction](delta);
      scene.camera.lookAtTransform(Matrix4.IDENTITY);
      previousValue.x = value.x;
    },
    complete: () => {
      // @ts-ignore
      scene.tweens.remove(tween);
    },
    startObject: new Cartesian3(0, 0, 0),
    stopObject: new Cartesian3(angle, 0, 0),
    duration,
    easingFunction: EasingFunction[animationType],
  });
}

export function cameraShortcutEasingMove(
  move: CAMERA_MOVE_DIRECTION,
  scene: Scene,
  rate: number,
  animationType: CAMERA_MOVE_EASING_TYPE,
  responseTime: ShortCutResponseTime,
) {
  const camera = scene.camera;
  const downDirection = new Cartesian3();
  Cartesian3.multiplyByScalar(camera.up, -1, downDirection);
  const leftDirection = new Cartesian3();
  Cartesian3.multiplyByScalar(camera.right, -1, leftDirection);
  const backDirection = new Cartesian3();
  Cartesian3.multiplyByScalar(camera.direction, -1, backDirection);
  const amount = rate * 2;
  const singleMoveDirection = {
    [CAMERA_MOVE_DIRECTION.MoveUp]: camera.up,
    [CAMERA_MOVE_DIRECTION.MoveDown]: downDirection,
    [CAMERA_MOVE_DIRECTION.MoveLeft]: leftDirection,
    [CAMERA_MOVE_DIRECTION.MoveRight]: camera.right,
    [CAMERA_MOVE_DIRECTION.MoveForward]: camera.direction,
    [CAMERA_MOVE_DIRECTION.MoveBackward]: backDirection,
  };
  const easingParameters = new Map<string, EasingParameter>();

  for (const [key, value] of Object.entries(CAMERA_MOVE_DIRECTION)) {
    if (key === CAMERA_MOVE_DIRECTION.None) {
      continue;
    }

    const duration =
      key.includes('Forward') || key.includes('Backward')
        ? CAMERA_MOVE_TYPE.ZOOMING
        : CAMERA_MOVE_TYPE.PANNING;

    if (SHORTCUT_COMBINATION.includes(CAMERA_MOVE_DIRECTION[key])) {
      easingParameters.set(value, {
        direction: calculateVectorCombination(
          singleMoveDirection[CAMERA_MOVE_COMBINATION[value][0]],
          singleMoveDirection[CAMERA_MOVE_COMBINATION[value][1]],
        ),
        amount: amount,
        duration,
      });
    } else {
      easingParameters.set(value, {
        direction: singleMoveDirection[value],
        amount: amount,
        duration,
      });
    }
  }

  const parameters = easingParameters.get(move);

  if (!parameters) {
    return;
  }

  const duration =
    parameters.duration === CAMERA_MOVE_TYPE.PANNING
      ? responseTime.PanningResponseTime
      : responseTime.ZoomingResponseTime;
  cameraEasingMove(
    scene,
    parameters.direction,
    parameters.amount,
    animationType,
    duration,
  );
}
