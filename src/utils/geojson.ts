import {
  Cartographic,
  createGuid,
  Math as CesiumMath,
  Cartesian3,
} from 'cesium';
import { CesiumViewerType } from '../types';
import { GeometryIDType, GEOMETRY_TYPE } from './types';
import { Feature, FeatureCollection, Position } from 'geojson';
import { EPS } from '../shared';

class GeoJson {
  static toGeoJson(viewer: CesiumViewerType): FeatureCollection | undefined {
    if (!viewer) {
      return;
    }

    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;

    const polygons = polygonDrawingTools.polygons;

    if (polygons) {
      const numberOfPolygons = polygons.length;
      if (numberOfPolygons > 0) {
        for (let i = 0; i < numberOfPolygons; i++) {
          let tmpCartographic: Cartographic | undefined;
          const feature: Feature = {
            type: 'Feature',
            id: polygons[i].id,
            geometry: {
              type: GEOMETRY_TYPE.POLYGON,
              coordinates: new Array<Position[]>(),
            },
            properties: {
              name: polygons[i].name,
            },
          };
          const tmpPositionArray = new Array<Position>();
          for (let j = 0; j < polygons[i].positions.length; j++) {
            tmpCartographic = Cartographic.fromCartesian(
              polygons[i].positions[j],
            );
            tmpPositionArray.push([
              CesiumMath.toDegrees(tmpCartographic.longitude),
              CesiumMath.toDegrees(tmpCartographic.latitude),
            ]);
          }
          if (feature.geometry.type === GEOMETRY_TYPE.POLYGON) {
            feature.geometry.coordinates.push(tmpPositionArray);
          }

          geojson.features.push(feature);
        }
      }
    }

    const lines = lineDrawingTools.lines;

    if (lines) {
      const numberOfLines = lines.length;
      if (numberOfLines > 0) {
        for (let i = 0; i < numberOfLines; i++) {
          let tmpCartographic: Cartographic | undefined;
          const feature: Feature = {
            type: 'Feature',
            id: lines[i].id,
            geometry: {
              type: GEOMETRY_TYPE.LINE,
              coordinates: new Array<Position>(),
            },
            properties: {
              name: lines[i].name,
            },
          };
          for (let j = 0; j < lines[i].positions.length; j++) {
            tmpCartographic = Cartographic.fromCartesian(lines[i].positions[j]);
            if (feature.geometry.type === GEOMETRY_TYPE.LINE) {
              feature.geometry.coordinates.push([
                CesiumMath.toDegrees(tmpCartographic.longitude),
                CesiumMath.toDegrees(tmpCartographic.latitude),
              ]);
            }
          }
          geojson.features.push(feature);
        }
      }
    }

    const points = pointDrawingTools.points;

    if (points) {
      const numberOfPoints = points.length;
      if (numberOfPoints === 1) {
        const feature: Feature = {
          type: 'Feature',
          id: points[0].id,
          geometry: {
            type: GEOMETRY_TYPE.POINT,
            coordinates: [0, 0],
          },
          properties: {
            name: `point-${points[0].id}`,
          },
        };

        const tmpCartographic = Cartographic.fromCartesian(points[0].position);
        if (feature.geometry.type === GEOMETRY_TYPE.POINT) {
          feature.geometry.coordinates = [
            CesiumMath.toDegrees(tmpCartographic.longitude),
            CesiumMath.toDegrees(tmpCartographic.latitude),
          ];
        }
      }

      if (numberOfPoints > 1) {
        const featureId = createGuid();
        const feature: Feature = {
          type: 'Feature',
          id: featureId,
          geometry: {
            type: GEOMETRY_TYPE.MULTIPOINT,
            coordinates: new Array<Position>(),
          },
          properties: {
            name: `multipoints-${featureId}`,
          },
        };
        for (let i = 0; i < numberOfPoints; i++) {
          const tmpCartographic = Cartographic.fromCartesian(
            points[i].position,
          );
          if (feature.geometry.type === GEOMETRY_TYPE.MULTIPOINT) {
            feature.geometry.coordinates.push([
              CesiumMath.toDegrees(tmpCartographic.longitude),
              CesiumMath.toDegrees(tmpCartographic.latitude),
            ]);
          }
        }
        geojson.features.push(feature);
      }
    }

    return geojson;
  }

  static exportPolygon(
    viewer: CesiumViewerType,
    polygonId: string,
  ): FeatureCollection | undefined {
    if (!viewer) {
      return;
    }

    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const { polygonDrawingTools } = viewer.drawingTools;

    const polygons = polygonDrawingTools.polygons;

    if (polygons) {
      const numberOfPolygons = polygons.length;
      if (numberOfPolygons > 0) {
        for (let i = 0; i < numberOfPolygons; i++) {
          if (polygons[i].id === polygonId) {
            let tmpCartographic: Cartographic | undefined;
            const feature: Feature = {
              type: 'Feature',
              id: polygons[i].id,
              geometry: {
                type: GEOMETRY_TYPE.POLYGON,
                coordinates: new Array<Position[]>(),
              },
              properties: {
                name: polygons[i].name,
              },
            };
            const tmpPositionArray = new Array<Position>();
            for (let j = 0; j < polygons[i].positions.length; j++) {
              tmpCartographic = Cartographic.fromCartesian(
                polygons[i].positions[j],
              );
              tmpPositionArray.push([
                CesiumMath.toDegrees(tmpCartographic.longitude),
                CesiumMath.toDegrees(tmpCartographic.latitude),
              ]);
            }
            if (feature.geometry.type === GEOMETRY_TYPE.POLYGON) {
              feature.geometry.coordinates.push(tmpPositionArray);
            }

            geojson.features.push(feature);
          }
        }
      }
    }

    return geojson;
  }

  static exportLine(
    viewer: CesiumViewerType,
    lineId: string,
  ): FeatureCollection | undefined {
    if (!viewer) {
      return;
    }

    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const { lineDrawingTools } = viewer.drawingTools;
    const lines = lineDrawingTools.lines;

    if (lines) {
      const numberOfLines = lines.length;
      if (numberOfLines > 0) {
        for (let i = 0; i < numberOfLines; i++) {
          if (lines[i].id === lineId) {
            let tmpCartographic: Cartographic | undefined;
            const feature: Feature = {
              type: 'Feature',
              id: lines[i].id,
              geometry: {
                type: GEOMETRY_TYPE.LINE,
                coordinates: new Array<Position>(),
              },
              properties: {
                name: lines[i].name,
              },
            };
            for (let j = 0; j < lines[i].positions.length; j++) {
              tmpCartographic = Cartographic.fromCartesian(
                lines[i].positions[j],
              );
              if (feature.geometry.type === GEOMETRY_TYPE.LINE) {
                feature.geometry.coordinates.push([
                  CesiumMath.toDegrees(tmpCartographic.longitude),
                  CesiumMath.toDegrees(tmpCartographic.latitude),
                ]);
              }
            }
            geojson.features.push(feature);
          }
        }
      }
    }

    return geojson;
  }

  static exportPoint(
    viewer: CesiumViewerType,
    pointId: string,
  ): FeatureCollection | undefined {
    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const { pointDrawingTools } = viewer.drawingTools;
    const points = pointDrawingTools.points;

    if (points) {
      const numberOfPoints = points.length;
      if (numberOfPoints === 0) {
        return;
      }
      for (let i = 0; i < numberOfPoints; i++) {
        if (points[i].id === pointId) {
          const tmpCartographic = Cartographic.fromCartesian(
            points[i].position,
          );
          const feature: Feature = {
            type: 'Feature',
            id: pointId,
            geometry: {
              type: GEOMETRY_TYPE.POINT,
              coordinates: [
                CesiumMath.toDegrees(tmpCartographic.longitude),
                CesiumMath.toDegrees(tmpCartographic.latitude),
              ],
            },
            properties: {
              name: `point-${pointId}`,
            },
          };

          geojson.features.push(feature);
        }
      }
    }

    return geojson;
  }

  static fromGeoJson(
    geoJsonText: string,
    viewer: CesiumViewerType,
  ): GeometryIDType | undefined {
    if (!viewer) {
      return;
    }

    const geojson = JSON.parse(geoJsonText) as FeatureCollection;
    const featuresArray = geojson.features;

    const { polygonIds, lineIds, pointIds } = GeoJson.fromFeaturesArray(
      featuresArray,
      viewer,
    );

    if (polygonIds || lineIds || pointIds) {
      return {
        polygonIds,
        lineIds,
        pointIds,
      };
    }
  }

  static fromFeaturesArray(
    featuresArray: Feature[],
    viewer: CesiumViewerType,
  ): GeometryIDType {
    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      viewer.drawingTools;
    const polygonIds: string[] = [];
    const lineIds: string[] = [];
    const pointIds: string[] = [];
    const pointPositions: Cartographic[] = [];
    const featureCount = featuresArray.length;
    let centerPointLongitude = 0;
    let centerPointLatitude = 0;

    for (let i = 0; i < featureCount; i++) {
      const feature = featuresArray[i];
      const geometry = feature.geometry;
      const geometryId = feature.id;
      const geometryType = geometry.type;
      const positions: Cartographic[] = [];
      switch (geometryType) {
        case GEOMETRY_TYPE.POLYGON:
          let polygonCoordinates;
          if (geometry.coordinates.length >= 0) {
            polygonCoordinates = geometry.coordinates[0];
            for (let j = 0; j < polygonCoordinates.length; j++) {
              positions.push(
                new Cartographic(
                  polygonCoordinates[j][0],
                  polygonCoordinates[j][1],
                  0,
                ),
              );
            }
            positions.push(
              new Cartographic(
                polygonCoordinates[0][0],
                polygonCoordinates[0][1],
                0,
              ),
            );

            const polygon = polygonDrawingTools.createPolygonFromPositions(
              positions,
              geometryId?.toString(),
            );

            polygonIds.push(polygon.id);
          }
          break;
        case GEOMETRY_TYPE.LINE:
          let lineCoordinates;
          if (geometry.coordinates.length >= 0) {
            lineCoordinates = geometry.coordinates;
            for (let j = 0; j < lineCoordinates.length; j++) {
              positions.push(
                new Cartographic(
                  lineCoordinates[j][0],
                  lineCoordinates[j][1],
                  0,
                ),
              );
            }

            const line = lineDrawingTools.createLineFromPositions(
              positions,
              geometryId?.toString(),
            );
            lineIds.push(line.id);
          }
          break;
        case GEOMETRY_TYPE.POINT:
          const pointCoordinate = geometry.coordinates;
          pointPositions.push(
            new Cartographic(pointCoordinate[0], pointCoordinate[1], 0),
          );
          centerPointLongitude += pointCoordinate[0];
          centerPointLatitude += pointCoordinate[1];
          break;
        case GEOMETRY_TYPE.MULTIPOINT:
          const pointCoordinates = geometry.coordinates;
          for (let i = 0; i < pointCoordinates.length; i++) {
            positions.push(
              new Cartographic(
                pointCoordinates[i][0],
                pointCoordinates[i][1],
                0,
              ),
            );
          }

          const pointArray1 =
            pointDrawingTools.createPointFromPositions(positions);

          if (pointArray1) {
            for (const point of pointArray1) {
              pointIds.push(point.id);
            }
          }
          break;
        default:
          break;
      }
    }

    viewer.camera.moveForward(EPS);

    if (pointPositions.length > 0) {
      const pointArray =
        pointDrawingTools.createPointFromPositions(pointPositions);
      for (let i = 0; i < pointArray.length; i++) {
        pointIds.push(pointArray[i].id);
      }
    }

    // After feature added to the cesium viewer, camera go to the features center position to see them.
    if (featureCount > 0) {
      centerPointLatitude /= featureCount;
      centerPointLongitude /= featureCount;
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          centerPointLongitude,
          centerPointLatitude,
          9000,
        ),
        orientation: {
          heading: 0,
          pitch: -CesiumMath.PI_OVER_TWO,
          roll: 0,
        },
        duration: 2,
      });
    }

    return {
      polygonIds,
      lineIds,
      pointIds,
    };
  }
}

export { GeoJson };
