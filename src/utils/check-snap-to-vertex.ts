import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Scene,
  SceneTransforms,
} from 'cesium';
import { SNAP_PIXEL_SIZE_TO_VERTEX } from '../shared';

// Check if the position is possible to snap to the vertex of current drawing polygon.
export function checkSnapToVertex(
  scene: Scene,
  position: Cartesian3,
  vertex: Cartesian3,
): boolean {
  const cartoScratch = new Cartographic();
  const ellipsoid = scene.globe.ellipsoid;
  ellipsoid.cartesianToCartographic(vertex, cartoScratch);
  const vertexPos = new Cartesian3();
  Cartesian3.fromRadians(
    cartoScratch.longitude,
    cartoScratch.latitude,
    scene.globe.getHeight(cartoScratch),
    ellipsoid,
    vertexPos,
  );

  const clonePosition = position.clone(new Cartesian3());
  const screenPosition = SceneTransforms.worldToDrawingBufferCoordinates(
    scene,
    clonePosition,
    new Cartesian3(),
  );

  const screenVertexPosition = SceneTransforms.worldToDrawingBufferCoordinates(
    scene,
    vertexPos,
    new Cartesian3(),
  );

  if (!screenPosition || !screenVertexPosition) {
    return false;
  }

  const pixelDistFromVertex = Cartesian2.distance(
    screenPosition,
    screenVertexPosition,
  );

  return pixelDistFromVertex < SNAP_PIXEL_SIZE_TO_VERTEX;
}
