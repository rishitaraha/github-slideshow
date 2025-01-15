import { colorBarHexCodes } from '@aus-platform/design-system';
import { Chart, Point } from 'chart.js';
import DXFWriter from 'dxf-writer';
import { isNil } from 'lodash';
import { RefObject } from 'react';
import { CartesianPoint, SlopeDetails } from '.';

export const generateWithDXFWriter = (
  graphData,
  elevationChartRef: RefObject<
    Chart<'line', (number | Point | null)[], unknown>
  >,
) => {
  if (!elevationChartRef.current) {
    return;
  }

  const dxf = new DXFWriter();
  // Separate layer for gridlines and iterations to add different color to each.
  const gridlineLayer = dxf.addLayer(
    'elevation-profile-gridlines',
    4,
    'CONTINUOUS',
  );
  dxf.setActiveLayer('elevation-profile-gridlines');
  gridlineLayer.setTrueColor(0x71828e);
  dxf.setUnits('Meters');
  const ticks = {
    tickX: elevationChartRef.current.scales.x.ticks.map((tickX) => {
      return tickX.value;
    }),
    tickY: elevationChartRef.current.scales.y.ticks.map((tickY) => {
      return tickY.value;
    }),
  };
  // Ticks - grids displayed by chartjs.
  const xAxisEnd = ticks.tickX[ticks.tickX.length - 1],
    yAxisEnd = ticks.tickY[ticks.tickY.length - 1],
    xAxisStart = ticks.tickX[0],
    yAxisStart = ticks.tickY[0];

  // Draw horizontal gridlines.
  ticks.tickY.forEach((tickItem) => {
    dxf.drawText(xAxisStart - 10, tickItem, 2, 0, `${tickItem}m`);
    dxf.drawPolyline(
      [
        [0, tickItem],
        [xAxisEnd, tickItem],
      ],
      false,
      0.01,
    );
  });

  // Add labels for elevation and distance.
  ticks.tickX.forEach((tickItem) => {
    dxf.drawText(tickItem, yAxisStart - 5, 2, 0, `${tickItem}m`);
  });

  dxf.drawRect(xAxisStart, yAxisStart, xAxisEnd, yAxisEnd);

  graphData.forEach((iteration, index) => {
    let endX;
    const layerName = `elevation-profile-iteration-${index}`;
    const graphLayer = dxf.addLayer(layerName, 6, 'CONTINUOUS');
    dxf.setActiveLayer(layerName);
    graphLayer.setTrueColor(colorBarHexCodes[index % colorBarHexCodes.length]);

    const arr = iteration
      .map((node) => {
        const { x, y } = node;
        endX = x;
        return [x, y];
      })
      .filter((node) => {
        // Null values from subtracted dsms causes error in dxf files, thus removing them.
        const [x, y] = node;
        return !isNil(x) && !isNil(y);
      });

    /**
     * Make the elevation profile polyline into a closed polygon, to allow adding hatches in
     * autocad.
     * Hatches Reference - https://knowledge.autodesk.com/support/autocad/learn-explore/caas/CloudHelp/cloudhelp/2021/ENU/AutoCAD-DidYouKnow/files/GUID-A3713CE1-0743-4CC9-9B37-B51563486C89-htm.html
     * **/
    arr.push([endX, yAxisStart]);
    arr.push([xAxisStart, yAxisStart]);
    arr.unshift([xAxisStart, yAxisStart]);
    dxf.drawPolyline(arr, true, 1, 1);
  });
  return dxf.toDxfString();
};

/**
 * The function `calculateSlope` calculates the slope between two Cartesian points and returns the slope details.
 * @param pointA - The starting point, containing distance (x) and elevation (y) values.
 * @param pointB - The ending point, containing distance (x) and elevation (y) values.
 * @returns An object with the following properties:
 * - `slopeInDegree`: The slope in degrees between the given points.
 * - `slopeInPercentage`: The slope in percentage between the given points.
 * - `deltaX`: The difference in distance (x axis values) between the two points.
 * - `deltaY`: The difference in elevation (y axis values) between the two points.
 */
export const calculateSlope = (
  pointA: CartesianPoint,
  pointB: CartesianPoint,
): SlopeDetails | null => {
  if (!pointA || !pointB) {
    return null;
  }

  const deltaY = pointB.elevation - pointA.elevation;
  const deltaX = Math.abs(pointB.distance - pointA.distance);

  const slope = deltaY / deltaX;

  // Performing inverse tangent of slope in order to get the slope in degree.
  // Ref: https://www.educative.io/answers/what-is-mathatan-in-javascript
  const slopeInDegree = +(Math.atan(slope) * (180 / Math.PI)).toFixed(2);
  const slopeInPercentage = +(slope * 100).toFixed(2);

  return {
    slopeInDegree: slopeInDegree,
    slopeInPercentage: slopeInPercentage,
    deltaX: +deltaX.toFixed(2),
    deltaY: +Math.abs(deltaY).toFixed(2),
  };
};

/**
 * The function `getSlopeDetailsText` takes a `SlopeDetails` object as input and returns an object of formatted strings
 * representing the deltaX, deltaY and slope in degrees and percentage.
 * @param slopeDetails - slope details object to get slope, deltaX and deltaY values.
 * @returns an object of formatted strings representing the deltaX, deltaY and slope in degrees and percentage.
 */
export const getSlopeDetailsText = (slopeDetails: SlopeDetails | null) => {
  if (isNil(slopeDetails)) {
    return {
      deltaX: '--',
      deltaY: '--',
      slope: '--',
    };
  }

  // An ASCII code (i.e 176) to display degrees.
  const degreeSign = String.fromCharCode(176);
  const slopeText = `${slopeDetails.slopeInDegree}${degreeSign} (${slopeDetails.slopeInPercentage}%)`;

  return {
    deltaX: `${slopeDetails.deltaX} m`,
    deltaY: `${slopeDetails.deltaY} m`,
    slope: slopeText,
  };
};

/**
 * Returns a string which is the distance in meters of a Cartesian point or 'Please select' text if the point is null.
 * @param point - the point to get text from.
 * @returns a string that represents the distance of a Cartesian point.
 */
export const getPointText = (point: CartesianPoint | null): string => {
  let pointText = 'Please select';
  if (!isNil(point)) {
    pointText = point.distance + ' m';
  }
  return pointText;
};
