import { Cartesian3, Cartographic, Scene } from 'cesium';

export function updateHeightOfPosition(scene: Scene, position: Cartesian3) {
  const ellipsoid = scene.globe.ellipsoid;
  const scratchCartographic = new Cartographic();
  const scratchCartesian = new Cartesian3();

  ellipsoid.cartesianToCartographic(position, scratchCartographic);

  scratchCartographic.height = 0;

  const height = scene.globe.getHeight(scratchCartographic);

  Cartesian3.fromRadians(
    scratchCartographic.longitude,
    scratchCartographic.latitude,
    height,
    ellipsoid,
    scratchCartesian,
  );
  return scratchCartesian;
}
