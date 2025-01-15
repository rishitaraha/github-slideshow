import {
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  // @ts-ignore
  VERSION,
} from 'cesium';

export function radianToString(x: number) {
  return CesiumMath.toDegrees(x).toString();
}

export function capitalizeFirstLetter(x: string) {
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export function convertTypeToTitleCase(type: string) {
  let standardType = type.toLowerCase();
  standardType = standardType.replace('multi', 'Multi');
  standardType = standardType.replace('polygon', 'Polygon');
  standardType = standardType.replace('line', 'Line');
  standardType = standardType.replace('string', 'String');
  standardType = standardType.replace('point', 'Point');

  return standardType;
}

export function isIncludeProperty(
  parent: Record<string, any>,
  child: Record<string, any>,
) {
  for (const key in child) {
    if (!parent[key]) {
      return false;
    }
    if (parent[key] !== child[key]) {
      return false;
    }
  }
  return true;
}

export function checkCesiumVersion() {
  const cesiumVersion = `@aus-platform/cesium is using Cesium version ${VERSION}`;
  return cesiumVersion;
}

export function convertToCartographicArray(positions: Cartesian3[]) {
  const cartoGraphicPositions = positions.map((position) => {
    const cartographic = Cartographic.fromCartesian(position);
    return new Cartographic(
      CesiumMath.toDegrees(cartographic.longitude),
      CesiumMath.toDegrees(cartographic.latitude),
    );
  });
  return cartoGraphicPositions;
}

export function convertToCartesianArray(positions: Cartographic[]) {
  // Without considering height of cartographic position.
  const cartesianPositions = positions.map((position) =>
    Cartesian3.fromDegrees(position.longitude, position.latitude),
  );
  return cartesianPositions;
}

export function calculateVectorCombination(
  VectorA: Cartesian3,
  VectorB: Cartesian3,
) {
  const normalC = new Cartesian3();
  const vectorC = new Cartesian3();
  Cartesian3.add(VectorA, VectorB, vectorC);
  Cartesian3.normalize(vectorC, normalC);
  return normalC;
}

/**
 * String format function to process distance return string if it's
 * smaller than 1000 the unit is will be meter, otherwise the unit
 * will be kilometer, with 2 decimal points precision.
 * E.g, 23.54m, 1.23km.
 * @param {number} distance
 * @returns {string}
 */
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${distance.toFixed(2)}m`;
  }

  return `${(distance / 1000).toFixed(2)}km`;
}
