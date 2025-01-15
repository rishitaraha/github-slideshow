import { Cartesian2, Color } from 'cesium';
import { CAMERA_MOVE_DIRECTION, CAMERA_ROTATE_DIRECTION } from './enums';

export const DEFAULT_POLYGON_OPACITY = 0.0;
export const DEFAULT_POLYGON_COLOR = Color.WHITE.withAlpha(
  DEFAULT_POLYGON_OPACITY,
);
export const SELECTED_LINE_PRIMITIVE_COLOR = Color.YELLOW.withAlpha(0.5);
export const POLYLINE_MINIMUM_PIXEL_SIZE = 20;
export const MAIN_VERTICES_MINIMUM_PIXEL_SIZE = 20;
export const POLYGON_MINIMUM_PIXEL_SIZE = 20;

export const POINT_LABEL_OFFSET = new Cartesian2(0, -28);

export const SELECTED_POLYGON_PRIMITIVE_COLOR = Color.YELLOW.withAlpha(0.5);

export const SNAP_PIXEL_SIZE_TO_VERTEX = 15;
export const SNAP_PIXEL_SIZE_TO_EDGE = 10;
export const MIN_POLYGON_VERTEX_NUM = 3;
export const MIN_LINE_VERTEX_NUM = 2;

export const DEFAULT_LABEL_PIXEL_OFFSET = new Cartesian2(0, -9);
export const MOUSE_DELTA = 10;
export const ESC_KEY = 'Escape';

export const EPS = 1e-6;

// Zoom level and bounding box calculation :
// In 3D mode, we couldn't specify zoom level exactly,
// but can estimate by using the camera distance from the target.
// zoomlevel = (max_distance_from_target - distance_from_target) / max_distance_from_target * max_zoom_level.
// We assumed the following:
// zoomlevel = 1 if max_distance_from_target > 1e4 meters.
// zoomlevel = max_zoom_level if distance_from_target < 125 meters.
// zoomlevel value will be linearly decreasing in the interval [125, 1e4] meters of camera distance.
export const MAX_ZOOM_LEVEL = 16;
export const MAX_CAMERA_DISTANCE = 1e4;
export const EPS_ZOOM_LEVEL = 0.2;
export const GLOBE_RADIUS = 6378137;
// Coordinate system used in Google Earth and GSP systems.
// It represents Earth as a three-dimensional ellipsoid.
export const EPSG4326 = 4326;
// Shortcut key response time in second
export const MIN_RESPONSE_TIME = 0.5;
export const SHORTCUT_COMBINATION = [
  CAMERA_MOVE_DIRECTION.MoveUpLeft,
  CAMERA_MOVE_DIRECTION.MoveUpRight,
  CAMERA_MOVE_DIRECTION.MoveDownLeft,
  CAMERA_MOVE_DIRECTION.MoveDownRight,
  CAMERA_MOVE_DIRECTION.MoveUpForward,
  CAMERA_MOVE_DIRECTION.MoveUpBackward,
  CAMERA_MOVE_DIRECTION.MoveDownForward,
  CAMERA_MOVE_DIRECTION.MoveDownBackward,
  CAMERA_MOVE_DIRECTION.MoveLeftForward,
  CAMERA_MOVE_DIRECTION.MoveLeftBackward,
  CAMERA_MOVE_DIRECTION.MoveRightForward,
  CAMERA_MOVE_DIRECTION.MoveRightBackward,
];

export const CAMERA_MOVE_COMBINATION = {
  [CAMERA_MOVE_DIRECTION.MoveUpLeft]: [
    CAMERA_MOVE_DIRECTION.MoveUp,
    CAMERA_MOVE_DIRECTION.MoveLeft,
  ],
  [CAMERA_MOVE_DIRECTION.MoveUpRight]: [
    CAMERA_MOVE_DIRECTION.MoveUp,
    CAMERA_MOVE_DIRECTION.MoveRight,
  ],
  [CAMERA_MOVE_DIRECTION.MoveDownLeft]: [
    CAMERA_MOVE_DIRECTION.MoveDown,
    CAMERA_MOVE_DIRECTION.MoveLeft,
  ],
  [CAMERA_MOVE_DIRECTION.MoveDownRight]: [
    CAMERA_MOVE_DIRECTION.MoveDown,
    CAMERA_MOVE_DIRECTION.MoveRight,
  ],
  [CAMERA_MOVE_DIRECTION.MoveUpForward]: [
    CAMERA_MOVE_DIRECTION.MoveUp,
    CAMERA_MOVE_DIRECTION.MoveForward,
  ],
  [CAMERA_MOVE_DIRECTION.MoveUpBackward]: [
    CAMERA_MOVE_DIRECTION.MoveUp,
    CAMERA_MOVE_DIRECTION.MoveBackward,
  ],
  [CAMERA_MOVE_DIRECTION.MoveDownForward]: [
    CAMERA_MOVE_DIRECTION.MoveDown,
    CAMERA_MOVE_DIRECTION.MoveForward,
  ],
  [CAMERA_MOVE_DIRECTION.MoveDownBackward]: [
    CAMERA_MOVE_DIRECTION.MoveDown,
    CAMERA_MOVE_DIRECTION.MoveBackward,
  ],
  [CAMERA_MOVE_DIRECTION.MoveLeftForward]: [
    CAMERA_MOVE_DIRECTION.MoveLeft,
    CAMERA_MOVE_DIRECTION.MoveForward,
  ],
  [CAMERA_MOVE_DIRECTION.MoveLeftBackward]: [
    CAMERA_MOVE_DIRECTION.MoveLeft,
    CAMERA_MOVE_DIRECTION.MoveBackward,
  ],
  [CAMERA_MOVE_DIRECTION.MoveRightForward]: [
    CAMERA_MOVE_DIRECTION.MoveRight,
    CAMERA_MOVE_DIRECTION.MoveForward,
  ],
  [CAMERA_MOVE_DIRECTION.MoveRightBackward]: [
    CAMERA_MOVE_DIRECTION.MoveRight,
    CAMERA_MOVE_DIRECTION.MoveBackward,
  ],
};

export const CAMERA_MOVE_SHORTCUT_KEYS = {
  z: {
    [CAMERA_MOVE_DIRECTION.MoveUp]: CAMERA_MOVE_DIRECTION.MoveUpForward,
    [CAMERA_MOVE_DIRECTION.MoveDown]: CAMERA_MOVE_DIRECTION.MoveDownForward,
    [CAMERA_MOVE_DIRECTION.MoveLeft]: CAMERA_MOVE_DIRECTION.MoveLeftForward,
    [CAMERA_MOVE_DIRECTION.MoveRight]: CAMERA_MOVE_DIRECTION.MoveRightForward,
    None: CAMERA_MOVE_DIRECTION.MoveForward,
  },
  Z: {
    [CAMERA_MOVE_DIRECTION.MoveUp]: CAMERA_MOVE_DIRECTION.MoveUpForward,
    [CAMERA_MOVE_DIRECTION.MoveDown]: CAMERA_MOVE_DIRECTION.MoveDownForward,
    [CAMERA_MOVE_DIRECTION.MoveLeft]: CAMERA_MOVE_DIRECTION.MoveLeftForward,
    [CAMERA_MOVE_DIRECTION.MoveRight]: CAMERA_MOVE_DIRECTION.MoveRightForward,
    None: CAMERA_MOVE_DIRECTION.MoveForward,
  },
  x: {
    [CAMERA_MOVE_DIRECTION.MoveUp]: CAMERA_MOVE_DIRECTION.MoveUpBackward,
    [CAMERA_MOVE_DIRECTION.MoveDown]: CAMERA_MOVE_DIRECTION.MoveDownBackward,
    [CAMERA_MOVE_DIRECTION.MoveLeft]: CAMERA_MOVE_DIRECTION.MoveLeftBackward,
    [CAMERA_MOVE_DIRECTION.MoveRight]: CAMERA_MOVE_DIRECTION.MoveRightBackward,
    None: CAMERA_MOVE_DIRECTION.MoveBackward,
  },
  X: {
    [CAMERA_MOVE_DIRECTION.MoveUp]: CAMERA_MOVE_DIRECTION.MoveUpBackward,
    [CAMERA_MOVE_DIRECTION.MoveDown]: CAMERA_MOVE_DIRECTION.MoveDownBackward,
    [CAMERA_MOVE_DIRECTION.MoveLeft]: CAMERA_MOVE_DIRECTION.MoveLeftBackward,
    [CAMERA_MOVE_DIRECTION.MoveRight]: CAMERA_MOVE_DIRECTION.MoveRightBackward,
    None: CAMERA_MOVE_DIRECTION.MoveBackward,
  },
  w: {
    [CAMERA_MOVE_DIRECTION.MoveLeft]: CAMERA_MOVE_DIRECTION.MoveUpLeft,
    [CAMERA_MOVE_DIRECTION.MoveRight]: CAMERA_MOVE_DIRECTION.MoveUpRight,
    [CAMERA_MOVE_DIRECTION.MoveForward]: CAMERA_MOVE_DIRECTION.MoveUpForward,
    [CAMERA_MOVE_DIRECTION.MoveBackward]: CAMERA_MOVE_DIRECTION.MoveUpBackward,
    None: CAMERA_MOVE_DIRECTION.MoveUp,
  },
  W: {
    [CAMERA_MOVE_DIRECTION.MoveLeft]: CAMERA_MOVE_DIRECTION.MoveUpLeft,
    [CAMERA_MOVE_DIRECTION.MoveRight]: CAMERA_MOVE_DIRECTION.MoveUpRight,
    [CAMERA_MOVE_DIRECTION.MoveForward]: CAMERA_MOVE_DIRECTION.MoveUpForward,
    [CAMERA_MOVE_DIRECTION.MoveBackward]: CAMERA_MOVE_DIRECTION.MoveUpBackward,
    None: CAMERA_MOVE_DIRECTION.MoveUp,
  },
  s: {
    [CAMERA_MOVE_DIRECTION.MoveLeft]: CAMERA_MOVE_DIRECTION.MoveDownLeft,
    [CAMERA_MOVE_DIRECTION.MoveRight]: CAMERA_MOVE_DIRECTION.MoveDownRight,
    [CAMERA_MOVE_DIRECTION.MoveForward]: CAMERA_MOVE_DIRECTION.MoveDownForward,
    [CAMERA_MOVE_DIRECTION.MoveBackward]:
      CAMERA_MOVE_DIRECTION.MoveDownBackward,
    None: CAMERA_MOVE_DIRECTION.MoveDown,
  },
  S: {
    [CAMERA_MOVE_DIRECTION.MoveLeft]: CAMERA_MOVE_DIRECTION.MoveDownLeft,
    [CAMERA_MOVE_DIRECTION.MoveRight]: CAMERA_MOVE_DIRECTION.MoveDownRight,
    [CAMERA_MOVE_DIRECTION.MoveForward]: CAMERA_MOVE_DIRECTION.MoveDownForward,
    [CAMERA_MOVE_DIRECTION.MoveBackward]:
      CAMERA_MOVE_DIRECTION.MoveDownBackward,
    None: CAMERA_MOVE_DIRECTION.MoveDown,
  },
  a: {
    [CAMERA_MOVE_DIRECTION.MoveUp]: CAMERA_MOVE_DIRECTION.MoveUpLeft,
    [CAMERA_MOVE_DIRECTION.MoveDown]: CAMERA_MOVE_DIRECTION.MoveDownLeft,
    [CAMERA_MOVE_DIRECTION.MoveForward]: CAMERA_MOVE_DIRECTION.MoveLeftForward,
    [CAMERA_MOVE_DIRECTION.MoveBackward]:
      CAMERA_MOVE_DIRECTION.MoveLeftBackward,
    None: CAMERA_MOVE_DIRECTION.MoveLeft,
  },
  A: {
    [CAMERA_MOVE_DIRECTION.MoveUp]: CAMERA_MOVE_DIRECTION.MoveUpLeft,
    [CAMERA_MOVE_DIRECTION.MoveDown]: CAMERA_MOVE_DIRECTION.MoveDownLeft,
    [CAMERA_MOVE_DIRECTION.MoveForward]: CAMERA_MOVE_DIRECTION.MoveLeftForward,
    [CAMERA_MOVE_DIRECTION.MoveBackward]:
      CAMERA_MOVE_DIRECTION.MoveLeftBackward,
    None: CAMERA_MOVE_DIRECTION.MoveLeft,
  },
  d: {
    [CAMERA_MOVE_DIRECTION.MoveUp]: CAMERA_MOVE_DIRECTION.MoveUpRight,
    [CAMERA_MOVE_DIRECTION.MoveDown]: CAMERA_MOVE_DIRECTION.MoveDownRight,
    [CAMERA_MOVE_DIRECTION.MoveForward]: CAMERA_MOVE_DIRECTION.MoveRightForward,
    [CAMERA_MOVE_DIRECTION.MoveBackward]:
      CAMERA_MOVE_DIRECTION.MoveRightBackward,
    None: CAMERA_MOVE_DIRECTION.MoveRight,
  },
  D: {
    [CAMERA_MOVE_DIRECTION.MoveUp]: CAMERA_MOVE_DIRECTION.MoveUpRight,
    [CAMERA_MOVE_DIRECTION.MoveDown]: CAMERA_MOVE_DIRECTION.MoveDownRight,
    [CAMERA_MOVE_DIRECTION.MoveForward]: CAMERA_MOVE_DIRECTION.MoveRightForward,
    [CAMERA_MOVE_DIRECTION.MoveBackward]:
      CAMERA_MOVE_DIRECTION.MoveRightBackward,
    None: CAMERA_MOVE_DIRECTION.MoveRight,
  },
};

export const CAMERA_ROTATE_SHORTCUT_KEYS = {
  q: CAMERA_ROTATE_DIRECTION.RotateLeft,
  Q: CAMERA_ROTATE_DIRECTION.RotateLeft,
  e: CAMERA_ROTATE_DIRECTION.RotateRight,
  E: CAMERA_ROTATE_DIRECTION.RotateRight,
  r: CAMERA_ROTATE_DIRECTION.RotateUp,
  R: CAMERA_ROTATE_DIRECTION.RotateUp,
  f: CAMERA_ROTATE_DIRECTION.RotateDown,
  F: CAMERA_ROTATE_DIRECTION.RotateDown,
};
