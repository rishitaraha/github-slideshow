import { Cartographic } from 'cesium';
import { EPS } from '../shared';
import { ExportedWKTType } from '../tools/drawing/types';
import { CesiumViewerType } from '../types';
import { convertTypeToTitleCase } from './common';
import { GeometryIDType, GEOMETRY_TYPE, WKTJsonType } from './types';

class WKT {
  static toWKT(viewer: CesiumViewerType): WKTJsonType {
    // Type should be in 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;

    const polygons = polygonDrawingTools.polygons;
    let polygonWktString: ExportedWKTType[] | undefined = undefined;
    const multiPolygonWktString: ExportedWKTType[] | undefined = undefined;
    let lineWktString: ExportedWKTType[] | undefined = undefined;
    const multiLineWktString: ExportedWKTType[] | undefined = undefined;
    let pointWktString: ExportedWKTType[] | undefined = undefined;
    const multiPointWktString: ExportedWKTType[] | undefined = undefined;

    if (polygons) {
      const polygonIds: string[] = [];
      for (const polygon of polygons) {
        polygonIds.push(polygon.id);
      }

      polygonWktString = polygonDrawingTools.exportWKT(polygonIds);
    }

    const lines = lineDrawingTools.lines;
    if (lines) {
      const lineIds: string[] = [];
      for (const line of lines) {
        lineIds.push(line.id);
      }

      lineWktString = lineDrawingTools.exportWKT(lineIds);
    }

    const points = pointDrawingTools.points;
    if (points) {
      const pointIds: string[] = [];
      for (const point of points) {
        pointIds.push(point.id);
      }
      pointWktString = pointDrawingTools.exportWKT(pointIds);
    }

    return {
      polygon: polygonWktString,
      multiPolygon: multiPolygonWktString,
      line: lineWktString,
      multiLine: multiLineWktString,
      point: pointWktString,
      multiPoint: multiPointWktString,
    };
  }

  static fromWKT(
    wktString: string,
    viewer: CesiumViewerType,
    geometryId?: string | string[],
    label?: string,
  ): GeometryIDType | undefined {
    if (!viewer) {
      return;
    }

    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;

    const polygonIds: string[] = [];
    const lineIds: string[] = [];
    const pointIds: string[] = [];
    const geometry = wktString;
    if (!geometry) {
      return;
    }
    if (geometry.includes('EMPTY')) {
      return;
    }
    const tmpStringArray = geometry.split(' ');
    const geometryType = convertTypeToTitleCase(tmpStringArray[0]);
    tmpStringArray.shift();
    let positionsString = tmpStringArray.join(' ');

    switch (geometryType) {
      case GEOMETRY_TYPE.POLYGON:
        positionsString = positionsString.replace('((', '');
        positionsString = positionsString.replace('))', '');

        const vertices = positionsString.split(',');
        const positions: Cartographic[] = [];
        let vertexPosition: string[] | undefined;
        for (let j = 0; j < vertices.length; j++) {
          vertices[j] = vertices[j].trim();
          vertexPosition = vertices[j].split(' ');
          positions.push(
            new Cartographic(
              parseFloat(vertexPosition[0]),
              parseFloat(vertexPosition[1]),
            ),
          );
        }

        const polygon = polygonDrawingTools.createPolygonFromPositions(
          positions,
          geometryId as string,
          label,
        );
        polygonIds.push(polygon.id);
        break;
      case GEOMETRY_TYPE.LINE:
        positionsString = positionsString.replace('(', '');
        positionsString = positionsString.replace(')', '');

        const lineVertices = positionsString.split(',');
        const linePositions: Cartographic[] = [];
        for (let j = 0; j < lineVertices.length; j++) {
          lineVertices[j] = lineVertices[j].trim();
          const vertexPosition = lineVertices[j].split(' ');
          linePositions.push(
            new Cartographic(
              parseFloat(vertexPosition[0]),
              parseFloat(vertexPosition[1]),
            ),
          );
        }

        const line = lineDrawingTools.createLineFromPositions(
          linePositions,
          geometryId as string,
          label,
        );
        lineIds.push(line.id);
        break;
      case GEOMETRY_TYPE.POINT:
        positionsString = positionsString.replace('(', '');
        positionsString = positionsString.replace(')', '');

        const pointVertices = positionsString.split(',');
        const pointPositions: Cartographic[] = [];
        for (let j = 0; j < pointVertices.length; j++) {
          pointVertices[j] = pointVertices[j].trim();
          const vertexPosition = pointVertices[j].split(' ');
          pointPositions.push(
            new Cartographic(
              parseFloat(vertexPosition[0]),
              parseFloat(vertexPosition[1]),
            ),
          );
        }

        const pointArray =
          pointDrawingTools.createPointFromPositions(pointPositions);

        if (pointArray) {
          for (const point of pointArray) {
            pointIds.push(point.id);
          }
        }
        break;
      case GEOMETRY_TYPE.MULTIPOINT:
        positionsString = positionsString.replace('(', '');
        positionsString = positionsString.replace(')', '');

        const multiPointVertices = positionsString.split(',');
        const multiPointPositions: Cartographic[] = [];
        for (let j = 0; j < multiPointVertices.length; j++) {
          multiPointVertices[j] = multiPointVertices[j].trim();
          const vertexPosition = multiPointVertices[j].split(' ');
          multiPointPositions.push(
            new Cartographic(
              parseFloat(vertexPosition[0]),
              parseFloat(vertexPosition[1]),
            ),
          );
        }

        const pointArray1 =
          pointDrawingTools.createPointFromPositions(multiPointPositions);

        if (pointArray1) {
          for (const point of pointArray1) {
            pointIds.push(point.id);
          }
        }
        break;
      default:
        break;
    }

    viewer.camera.moveForward(EPS);
    if (
      polygonIds.length === 0 &&
      lineIds.length === 0 &&
      pointIds.length === 0
    ) {
      return;
    } else {
      return {
        polygonIds,
        lineIds,
        pointIds,
      };
    }
  }
}

export { WKT };
