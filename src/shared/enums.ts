export enum MouseButton {
  LeftButton = 1,
  RightButton = 2,
  MidButton = 4,
}
// Camera move direction
export enum CAMERA_MOVE_DIRECTION {
  None = '',
  MoveForward = 'moveForward',
  MoveBackward = 'moveBackward',
  MoveUp = 'moveUp',
  MoveDown = 'moveDown',
  MoveLeft = 'moveLeft',
  MoveRight = 'moveRight',
  MoveUpLeft = 'moveUpLeft',
  MoveUpRight = 'moveUpRight',
  MoveUpForward = 'moveUpForward',
  MoveUpBackward = 'moveUpBackward',
  MoveDownLeft = 'moveDownLeft',
  MoveDownRight = 'moveDownRight',
  MoveDownForward = 'moveDownForward',
  MoveDownBackward = 'moveDownBackward',
  MoveLeftForward = 'moveLeftForward',
  MoveLeftBackward = 'moveLeftBackward',
  MoveRightForward = 'moveRightForward',
  MoveRightBackward = 'moveRightBackward',
}
// Camera rotate direction
export enum CAMERA_ROTATE_DIRECTION {
  None = '',
  RotateRight = 'rotateRight',
  RotateLeft = 'rotateLeft',
  RotateUp = 'rotateUp',
  RotateDown = 'rotateDown',
}

export enum CAMERA_MOVE_EASING_TYPE {
  BACK_IN = 'BACK_IN',
  BACK_IN_OUT = 'BACK_IN_OUT',
  BACK_OUT = 'BACK_OUT',
  BOUNCE_IN = 'BOUNCE_IN',
  BOUNCE_IN_OUT = 'BOUNCE_IN_OUT',
  BOUNCE_OUT = 'BOUNCE_OUT',
  CIRCULAR_IN = 'CIRCULAR_IN',
  CIRCULAR_IN_OUT = 'CIRCULAR_IN_OUT',
  CIRCULAR_OUT = 'CIRCULAR_OUT',
  CUBIC_IN = 'CUBIC_IN',
  CUBIC_IN_OUT = 'CUBIC_IN_OUT',
  CUBIC_OUT = 'CUBIC_OUT',
  ELASTIC_IN = 'ELASTIC_IN',
  ELASTIC_IN_OUT = 'ELASTIC_IN_OUT',
  ELASTIC_OUT = 'ELASTIC_OUT',
  EXPONENTIAL_IN = 'EXPONENTIAL_IN',
  EXPONENTIAL_IN_OUT = 'EXPONENTIAL_IN_OUT',
  EXPONENTIAL_OUT = 'EXPONENTIAL_OUT',
  LINEAR_NONE = 'LINEAR_NONE',
  QUADRATIC_IN = 'QUADRATIC_IN',
  QUADRATIC_IN_OUT = 'QUADRATIC_IN_OUT',
  QUADRATIC_OUT = 'QUADRATIC_OUT',
  QUARTIC_IN = 'QUARTIC_IN',
  QUARTIC_IN_OUT = 'QUARTIC_IN_OUT',
  QUARTIC_OUT = 'QUARTIC_OUT',
  QUINTIC_IN = 'QUINTIC_IN',
  QUINTIC_IN_OUT = 'QUINTIC_IN_OUT',
  QUINTIC_OUT = 'QUINTIC_OUT',
  SINUSOIDAL_IN = 'SINUSOIDAL_IN',
  SINUSOIDAL_IN_OUT = 'SINUSOIDAL_IN_OUT',
  SINUSOIDAL_OUT = 'SINUSOIDAL_OUT',
}

export enum CAMERA_MOVE_TYPE {
  PANNING = 'PANNING',
  ZOOMING = 'ZOOMING',
  ROTATE = 'ROTATE',
}

export enum HTMLMouseEventName {
  MOUSE_OUT = 'mouseout',
  MOUSE_ENTER = 'mouseenter',
  MOUSE_MOVE = 'mousemove',
  MOUSE_DOWN = 'mousedown',
  MOUSE_UP = 'mouseup',
}
