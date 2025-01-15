export * from './get-centroid-positions';
export * from './get-nearest-edge';
export * from './get-world-position';
export * from './update-height-of-point-primitives';
export * from './wkt';
export * from './types';
export * from './pick-entity';
export * from './get-feature-from-id';
export * from './get-feature';
export * from './get-exported-svg';
export * from './check-snap-to-vertex';
export * from './update-vertex-style';
export * from './common';
export * from './simplify-polygon';
export * from './get-viewport-bounds';
export * from './get-features-data-from-zipfile';
export * from './geojson';
export * from './camera-move-helper';

export function clearArray(arr: any[]) {
  while (arr.length > 0) {
    arr.pop();
  }
}
