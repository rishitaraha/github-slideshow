import * as turf from '@turf/turf';
import { Cartographic } from 'cesium';
import { SimplifyOptions } from './types';

/**
 * turf library supports a function to reduce number of vertices in polygon.
 * This function is working like below:
 * - Convert polygon vertices positions to cartographic system.
 * - Get the polygon's GeoJSON.
 * - Simplify the GeoJSON using library function in turf.
 * - Return simplified positions.
 * Internally uses simplify-js to perform simplification using the Ramer-Douglas-Peucker algorithm.
 * - options.tolerance number simplification tolerance (optional, default 1). Its unit is Radian here to measure longitude or latitude.
 * - options.highQuality boolean whether or not to spend more time to create a higher-quality simplification with a different algorithm (optional, default false).
 * Reference:
 * https://mourner.github.io/simplify-js/
 * https://www.npmjs.com/package/@turf/simplify
 */
export function simplifyPolygon(
  positions: Cartographic[],
  options: SimplifyOptions,
) {
  if (positions.length <= 4) {
    return positions;
  }

  const tmpPositions: turf.helpers.Position[] = [];
  for (const position of positions) {
    tmpPositions.push([position.longitude, position.latitude]);
  }

  const geoJSONPolygon = turf.polygon([tmpPositions], { name: 'poly1' });
  const simplifyOptions = options;
  const simplifiedPolygon = turf.simplify(geoJSONPolygon, simplifyOptions);
  const [simplifiedCoordinates] = simplifiedPolygon.geometry.coordinates;
  const simplifiedPositions: Cartographic[] = [];
  for (const coord of simplifiedCoordinates) {
    simplifiedPositions.push(
      new Cartographic(
        parseFloat(coord[0].toString()),
        parseFloat(coord[1].toString()),
      ),
    );
  }

  return simplifiedPositions;
}

// Get the minimum distance for all neighbored vertices
export function getMinimumTolerate(positions: Cartographic[]) {
  const length = positions.length;
  let minimumTolerate = 1e10;
  for (let i = 0; i < length - 1; i++) {
    const distance = Math.sqrt(
      (positions[i].longitude - positions[i + 1].longitude) *
        (positions[i].longitude - positions[i + 1].longitude) +
        (positions[i].latitude - positions[i + 1].latitude) *
          (positions[i].latitude - positions[i + 1].latitude),
    );

    if (distance < minimumTolerate) {
      minimumTolerate = distance;
    }
  }

  return minimumTolerate;
}
