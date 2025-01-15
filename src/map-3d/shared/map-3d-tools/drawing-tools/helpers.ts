import { Cartesian3, Cartographic, Math as CesiumMath } from 'cesium';

export function radianToDegrees(x: number) {
  return CesiumMath.toDegrees(x).toFixed(7);
}

export function getCartographicDegreeFromCartesian(
  position: Cartesian3,
): Array<string> {
  const cartographic = Cartographic.fromCartesian(position);
  return [
    radianToDegrees(cartographic.longitude),
    radianToDegrees(cartographic.latitude),
  ];
}
