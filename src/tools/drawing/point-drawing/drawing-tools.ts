import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  destroyObject,
  Ellipsoid,
  HorizontalOrigin,
  PointPrimitiveCollection,
  Primitive,
  PrimitiveCollection,
  VerticalOrigin,
} from 'cesium';
import { MapTools } from '../../base';
import DrawingSettings from '../drawing-tool-settings';
import { PointDrawing } from '.';
import { CesiumViewerType } from '../../../types';
import {
  CameraViewBoundsOptions,
  clearArray,
  GEOMETRY_TYPE,
  getPointClusterLabelSVG,
} from '../../../utils';
import { convertTypeToTitleCase } from '../../../utils/common';
import { ExportedWKTType } from '../types';
import { EPS, EPS_ZOOM_LEVEL, MAX_ZOOM_LEVEL } from '../../../shared';
import { Point } from '../../../entities/point';
import { StyleOptions } from '../../style';
import Supercluster from 'supercluster';
import { GeoJsonProperties } from 'geojson';

export class PointDrawingTools extends MapTools {
  private readonly _points: Point[];

  private readonly _pointDrawing: PointDrawing;

  constructor(options: { viewer: CesiumViewerType; ellipsoid?: Ellipsoid }) {
    super(options);

    this._points = [];
    const primitiveCollection = new PrimitiveCollection();

    this._viewer = options.viewer;
    options.viewer.scene.primitives.add(primitiveCollection);

    this._pointDrawing = new PointDrawing({
      viewer: options.viewer,
      name: 'PointDrawing',
      cursorStyle: undefined,
      pointOptions: DrawingSettings.getPointOptions(),
      primitives: primitiveCollection,
      points: this._points,
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 0.8,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(5, 5),
      }),
      markerOptions: DrawingSettings.getMarkerPointOptions(),
    });
  }

  activatePointDrawing(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    deleteOption = { canDelete: true },
    selectOption = { canSelect: true },
  ) {
    this._pointDrawing.showMarker();
    if (properties) {
      this.pointDrawing.properties = properties;
    }

    if (deleteOption) {
      this.pointDrawing.deleteOption = deleteOption;
    }

    if (selectOption) {
      this.pointDrawing.selectOption = selectOption;
    }

    if (styleOptions) {
      this.pointDrawing.setStyleOptions(styleOptions);
    }
    this._viewer.setMapTool(this.pointDrawing);
  }

  get pointDrawing() {
    return this._pointDrawing;
  }

  get pointCount() {
    return this.points.length;
  }

  setLayer(id: string) {
    const layers = this._viewer.layerTool.layers;
    const selectedLayer = layers.find((layer) => layer.id === id);
    if (!selectedLayer) {
      return;
    }

    this._pointDrawing.properties['layer'] = id;
    this._pointDrawing.pointPrimitiveCollection =
      selectedLayer.primitiveCollection.add(
        new PointPrimitiveCollection({ show: true }),
      );

    this._pointDrawing.primitives = selectedLayer.primitiveCollection;
  }

  createPointFromPositions(
    positions: Cartographic[],
    pointIds?: (string | undefined)[],
    pointLabels?: (string | undefined)[],
    properties?: Record<string, any>[],
    styleOptions?: StyleOptions,
    deleteOption?: Record<string, any>,
    selectOption?: Record<string, any>,
  ) {
    const cartoScratch = new Cartographic();
    const scene = this._viewer.scene;
    const pointArray: Point[] = [];

    for (let i = 0; i < positions.length; i++) {
      cartoScratch.longitude = positions[i].longitude;
      cartoScratch.latitude = positions[i].latitude;
      cartoScratch.height = 0;

      const height = scene.globe.getHeight(cartoScratch);
      const cartePos = Cartesian3.fromDegrees(
        positions[i].longitude,
        positions[i].latitude,
        height,
      );
      const pointProperties = properties ? properties[i] : undefined;
      let pointId;
      if (pointIds && pointIds[i]) {
        pointId = pointIds[i];
      }

      const point = this.pointDrawing.addPoint(
        cartePos,
        pointId,
        pointProperties,
      );
      this._pointDrawing.eventPointCreated.raiseEvent(
        [point],
        [this._pointDrawing],
      );

      point.show = true;

      let labelText;
      if (pointLabels && pointLabels[i]) {
        labelText = pointLabels[i];
      }

      if (labelText) {
        point.setLabel(labelText);
      }
      // Change style using saved styleoptions.
      if (styleOptions) {
        point.changeStyle(styleOptions);
      }

      if (deleteOption) {
        point.appendProperties(deleteOption);
      }

      if (selectOption) {
        point.appendProperties(selectOption);
      }

      pointArray.push(point);
    }
    return pointArray;
  }

  /**
   * Create point primitive or cluster (billboard primitive) in the cesium viewer.
   * @param {Supercluster} superCluster SuperCluster instance from the frontend.
   * @param {CameraViewBoundsOptions} cameraViewBounds Viewport bounds calculated in cartographic coordinates.
   * superCluster instance will make clusters for heavy data for each zoom level.
   * Heavy dataset will be loaded on frontend and generate a superCluster instance with this data.
   * Reference:
   * - https://gitlab.com/aarav-unmanned/platform-dev/gis-development/-/merge_requests/104/diffs
   *   src/components/toolbar/point-drawing-tool.tsx
   * - https://www.npmjs.com/package/supercluster
   * - https://blog.mapbox.com/clustering-millions-of-points-on-a-map-with-supercluster-272046ec5c97
   */
  createPointClusters(
    superCluster: Supercluster,
    cameraViewBounds: CameraViewBoundsOptions,
  ) {
    this._pointDrawing.deleteAllImportedClusters();

    // Get points and clusters for current zoom level in current viewport.
    const clusters = superCluster.getClusters(
      cameraViewBounds.bounds,
      cameraViewBounds.zoom,
    );

    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].properties?.cluster) {
        // If zoom level is equal to almost max limit, each clusters in viewport will show all inherit children points
        // by using Breadth-First Search(BFS) using queue algorithm : while statement here.
        if (MAX_ZOOM_LEVEL - cameraViewBounds.zoom < EPS_ZOOM_LEVEL) {
          const clusterPoints = superCluster.getChildren(
            clusters[i].properties.cluster_id,
          );
          const queue: (
            | Supercluster.ClusterFeature<GeoJsonProperties>
            | Supercluster.PointFeature<GeoJsonProperties>
          )[] = [];
          queue.push(...clusterPoints);
          while (queue.length >= 1) {
            const cluster = queue.pop();
            if (cluster?.properties?.cluster) {
              const tmpClusters = superCluster.getChildren(
                cluster.properties.cluster_id,
              );
              queue.push(...tmpClusters);
            } else {
              if (cluster) {
                const clusterPoint = this._pointDrawing.addPoint(
                  Cartesian3.fromDegrees(
                    cluster.geometry.coordinates[0],
                    cluster.geometry.coordinates[1],
                  ),
                  undefined,
                  undefined,
                  true,
                );
                this._pointDrawing._importedPoints.push(clusterPoint);
              }
            }
          }

          continue;
        }
        // Else each cluster will show child cluster and child points.
        const cluster = this._pointDrawing._clusterBillboards.add({
          position: Cartesian3.fromDegrees(
            clusters[i].geometry.coordinates[0],
            clusters[i].geometry.coordinates[1],
          ),
          image: getPointClusterLabelSVG(
            `${clusters[i].properties?.point_count}`,
          ),
          show: true,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });
        this._pointDrawing._importedClusters.push(cluster);
      } else {
        const point = this._pointDrawing.addPoint(
          Cartesian3.fromDegrees(
            clusters[i].geometry.coordinates[0],
            clusters[i].geometry.coordinates[1],
          ),
          undefined,
          undefined,
          true,
        );
        this._pointDrawing._importedPoints.push(point);
      }
    }
  }

  deletePoint(id: string) {
    this._deletePointFromPoints(id);
  }

  batchDeletePoints(list: string[]) {
    list.forEach((id) => {
      this._deletePointFromPoints(id);
    });
  }

  _deletePointFromPoints(id: string) {
    let founded: Point | undefined;
    let foundedIndex = -1;

    for (let i = 0; i < this.points.length; i++) {
      const point = this._points[i];

      if (point.id === id) {
        founded = point;
        foundedIndex = i;
        break;
      }
    }

    if (!founded) {
      return false;
    }

    this._points.splice(foundedIndex, 1);
    founded.show = false;
    destroyObject(founded);
    this._pointDrawing.eventPointDeleted.raiseEvent([id]);

    return true;
  }

  deleteAllPoints() {
    for (let i = 0; i < this._points.length; i++) {
      const point = this._points[i];
      point.show = false;
      this._pointDrawing.eventPointDeleted.raiseEvent([point.id]);
      point.destroy();
    }
    clearArray(this._pointDrawing.points);
    this._viewer.scene.screenSpaceCameraController.enableRotate = true;
    this._viewer.scene.screenSpaceCameraController.enableTranslate = true;
  }

  getPoint(id: string) {
    for (let i = 0; i < this._points.length; i++) {
      const point = this._points[i];

      if (point.id === id) {
        return point;
      }
    }

    return null;
  }

  getPoints() {
    return this._points;
  }

  getPointsByProperty(propertyKey: string, propertyValue: any) {
    return this._points.filter((point) => {
      if (
        point.properties.hasOwnProperty(propertyKey) &&
        point.properties[propertyKey] === propertyValue
      ) {
        return true;
      }

      return false;
    });
  }

  get points() {
    return this._points;
  }

  findPoint(primitive: Primitive) {
    if (!primitive.geometryInstances) {
      return null;
    }

    for (let i = 0; i < this._points.length; i++) {
      const point = this._points[i];

      // @ts-ignore
      if (point.point.id === primitive.geometryInstances.id) {
        return point;
      }
    }

    return null;
  }

  restoreOriginalColor(point: { point: { color: Color } }) {
    point.point.color = this._pointDrawing.options.pointOptions.color;
  }

  showHideAll(show: boolean) {
    for (let i = 0; i < this._points.length; i++) {
      const point = this._points[i];

      point.show = show;
    }
  }

  importWkt(
    wktStrings: string[],
    geometryIds?: (string | undefined)[],
    geometryLabels?: (string | undefined)[],
    properties?: Record<string, any>[],
    styleOptions?: StyleOptions,
    deleteOption = { canDelete: true },
    selectOption = { canSelect: true },
  ): Point[] | undefined {
    const viewer = this._viewer;
    if (!viewer) {
      return;
    }

    if (properties && wktStrings.length !== properties.length) {
      return;
    }

    let importedGeometries: Point[] = [];
    const pointPositions: Cartographic[] = [];
    for (let index = 0; index < wktStrings.length; index++) {
      const geometry = wktStrings[index];
      if (geometry.includes('EMPTY')) {
        continue;
      }

      const tmpStringArray = geometry.split(' ');
      const geometryType = convertTypeToTitleCase(tmpStringArray[0]);
      tmpStringArray.shift();
      let positionsString = tmpStringArray.join(' ');

      if (geometryType === GEOMETRY_TYPE.POINT) {
        positionsString = positionsString.replace('(', '');
        positionsString = positionsString.replace(')', '');

        const vertices = positionsString.split(',');
        let vertexPosition: string[] | undefined;
        for (let j = 0; j < vertices.length; j++) {
          vertices[j] = vertices[j].trim();
          vertexPosition = vertices[j].split(' ');
          pointPositions.push(
            new Cartographic(
              parseFloat(vertexPosition[0]),
              parseFloat(vertexPosition[1]),
            ),
          );
        }
      } else if (geometryType === GEOMETRY_TYPE.MULTIPOINT) {
        positionsString = positionsString.replace('(', '');
        positionsString = positionsString.replace(')', '');

        const multiPointVertices = positionsString.split(',');
        for (let j = 0; j < multiPointVertices.length; j++) {
          multiPointVertices[j] = multiPointVertices[j].trim();
          const vertexPosition = multiPointVertices[j].split(' ');
          pointPositions.push(
            new Cartographic(
              parseFloat(vertexPosition[0]),
              parseFloat(vertexPosition[1]),
            ),
          );
        }
      } else {
        continue;
      }
    }

    importedGeometries = this.createPointFromPositions(
      pointPositions,
      geometryIds,
      geometryLabels,
      properties,
      styleOptions,
      deleteOption,
      selectOption,
    );

    viewer.camera.moveForward(EPS);
    return importedGeometries;
  }

  exportWKT(ids: string[]): ExportedWKTType[] | undefined {
    const exportedWkt: ExportedWKTType[] = [];
    for (const id of ids) {
      const point = this.getPoint(id);
      if (!point) {
        return;
      }

      const pointWktString = point.exportWKT();

      exportedWkt.push(pointWktString);
    }

    return exportedWkt;
  }

  toggleVisibility(id: string) {
    const point = this.getPoint(id);
    point?.toggleVisibility();
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {
    this._pointDrawing.destroy();

    for (let i = 0; i < this._points.length; i++) {
      const point = this._points[i];

      destroyObject(point);
    }

    destroyObject(this);
  }
}
