import { Cartesian3, Cartographic, Math as CesiumMath, Scene } from 'cesium';
import * as turf from '@turf/turf';

function turfPolygonFromPositions(positions: Cartesian3[], name: string) {
  const degrees: number[][] = [];

  positions.forEach((position) => {
    const carto = Cartographic.fromCartesian(position);

    degrees.push([
      CesiumMath.toDegrees(carto.longitude),
      CesiumMath.toDegrees(carto.latitude),
    ]);
  });

  degrees.push(degrees[0]);

  return turf.polygon([degrees], { name: name });
}

export function getCentroidOfPolygon(scene: Scene, positions: Cartesian3[]) {
  if (positions.length < 1) {
    return;
  }

  if (positions.length === 1) {
    const centroid = Cartographic.fromCartesian(positions[0]);

    const height = scene.globe.getHeight(
      Cartographic.fromRadians(centroid.longitude, centroid.latitude),
    );

    return Cartesian3.fromRadians(
      centroid.longitude,
      centroid.latitude,
      height,
    );
  }

  if (positions.length === 2) {
    const p1 = Cartographic.fromCartesian(positions[0]);
    const p2 = Cartographic.fromCartesian(positions[1]);
    const centroid = new Cartographic();

    centroid.longitude = (p1.longitude + p2.longitude) / 2;
    centroid.latitude = (p1.latitude + p2.latitude) / 2;

    const height = scene.globe.getHeight(
      Cartographic.fromRadians(centroid.longitude, centroid.latitude),
    );
    return Cartesian3.fromRadians(
      centroid.longitude,
      centroid.latitude,
      height,
    );
  }
  const polygon = turfPolygonFromPositions(positions, 'polygon');

  const centroid = turf.centroid(polygon);

  const coordinates = centroid.geometry.coordinates;

  const longitude = coordinates[0];
  const latitude = coordinates[1];

  const height = scene.globe.getHeight(
    Cartographic.fromDegrees(longitude, latitude),
  );

  return Cartesian3.fromDegrees(longitude, latitude, height);
}

/**
 * Calculate centroid position of polyline.
 *
 * Given a line between position1 and position2 return a position that
 * is distance away from position1.
 */
function lineInterpolate(
  position1: Cartesian3,
  position2: Cartesian3,
  distance: number,
) {
  const xabs = Math.abs(position1.x - position2.x);
  const yabs = Math.abs(position1.y - position2.y);
  const zabs = Math.abs(position1.z - position2.z);
  const xdiff = position2.x - position1.x;
  const ydiff = position2.y - position1.y;
  const zdiff = position2.z - position1.z;

  const length = Math.sqrt(xabs * xabs + yabs * yabs + zabs * zabs);
  const steps = length / distance;
  const xstep = xdiff / steps;
  const ystep = ydiff / steps;
  const zstep = zdiff / steps;

  return new Cartesian3(
    position1.x + xstep,
    position1.y + ystep,
    position1.z + zstep,
  );
}

// Return the  position that is the mid position for the line.
export function getCentroidOfPolyline(positions: Cartesian3[]) {
  // Sum up the total distance of the line.
  let totalDistance = 0;
  for (let i = 0; i < positions.length - 1; i += 1) {
    totalDistance += Cartesian3.distance(positions[i], positions[i + 1]);
  }
  // Find the middle segemnt of the line.
  let distanceSoFar = 0;
  for (let i = 0; i < positions.length - 1; i += 1) {
    // If this line segment puts us past the middle then this
    // is the segment in which the mid position appears.
    if (
      distanceSoFar + Cartesian3.distance(positions[i], positions[i + 1]) >
      totalDistance / 2
    ) {
      // Figure out how far to the mid position.
      const distanceToMidPosition = totalDistance / 2 - distanceSoFar;
      // Given the start/end of a line segment and a distance return the  position
      // on the line segment the specified distance away.
      return lineInterpolate(
        positions[i],
        positions[i + 1],
        distanceToMidPosition,
      );
    }

    distanceSoFar += Cartesian3.distance(positions[i], positions[i + 1]);
  }

  //
  // Can happen when the line is of zero length... so just return the first segment.
  //
  return positions[0];
}
