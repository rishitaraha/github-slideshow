import { Cartesian3, Cartographic, PointPrimitive, Scene } from 'cesium';

export function updateHeightOfPointPrimitives(
  scene: Scene,
  pointPrimitives: PointPrimitive[],
) {
  const ellipsoid = scene.globe.ellipsoid;
  const scratchCartographic = new Cartographic();
  const scratchCartesian = new Cartesian3();

  pointPrimitives.forEach((pointPrimitive) => {
    ellipsoid.cartesianToCartographic(
      pointPrimitive.position,
      scratchCartographic,
    );

    scratchCartographic.height = 0;

    const height = scene.globe.getHeight(scratchCartographic);

    Cartesian3.fromRadians(
      scratchCartographic.longitude,
      scratchCartographic.latitude,
      height,
      ellipsoid,
      scratchCartesian,
    );
    pointPrimitive.position = scratchCartesian;
  });
}
