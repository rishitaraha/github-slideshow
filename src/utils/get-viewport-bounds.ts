import { Scene, Math as CesiumMath, Cartesian3 } from 'cesium';
import { BBox } from 'geojson';
import { MAX_CAMERA_DISTANCE, MAX_ZOOM_LEVEL } from '../shared';

export function getViewportBounds(scene: Scene) {
  const camera = scene.camera;
  const ellipsoid = scene.globe.ellipsoid;
  const cameraViewPort = camera.computeViewRectangle(ellipsoid);

  if (!cameraViewPort) {
    return null;
  }

  const bounds: BBox = [
    CesiumMath.toDegrees(cameraViewPort.west),
    CesiumMath.toDegrees(cameraViewPort.south),
    CesiumMath.toDegrees(cameraViewPort.east),
    CesiumMath.toDegrees(cameraViewPort.north),
  ];

  const boundsCenter = Cartesian3.fromDegrees(
    (bounds[0] + bounds[2]) / 2,
    (bounds[1] + bounds[3]) / 2,
  );
  const distance = Cartesian3.distance(boundsCenter, camera.position);
  let zoom =
    ((MAX_CAMERA_DISTANCE - distance) / MAX_CAMERA_DISTANCE) * MAX_ZOOM_LEVEL;

  if (zoom < 1) {
    zoom = 1;
  }

  return {
    bounds,
    zoom,
  };
}
