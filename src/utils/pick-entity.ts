import { defaultValue, Viewer } from 'cesium';
import { MAIN_VERTICES_MINIMUM_PIXEL_SIZE } from '../shared';
import { MouseEvent } from '../tools';

export function pickEntity(viewer: Viewer, e: MouseEvent) {
  if (!viewer) {
    return null;
  }
  if (viewer.scene.pickPositionSupported) {
    const picked = viewer.scene.pick(e.pos);
    if (picked) {
      const id = defaultValue(picked.id, picked.primitive.id);

      if (typeof id === 'string') {
        return id;
      }
      return null;
    }
  }
  return null;
}

export function drillPickEntity(viewer: Viewer, e: MouseEvent) {
  if (!viewer) {
    return null;
  }
  if (viewer.scene.pickPositionSupported) {
    const picked = viewer.scene.drillPick(
      e.pos,
      MAIN_VERTICES_MINIMUM_PIXEL_SIZE,
      MAIN_VERTICES_MINIMUM_PIXEL_SIZE,
    );
    if (picked) {
      return picked;
    }
  }
  return null;
}
