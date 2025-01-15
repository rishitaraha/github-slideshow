// q@ts-nocheck
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  createGuid,
  destroyObject,
  Ellipsoid,
  Event,
  HorizontalOrigin,
  Primitive,
  PrimitiveCollection,
  VerticalOrigin,
} from 'cesium';

import { Polygon } from '../../../entities';
import { DEFAULT_POLYGON_COLOR, EPS } from '../../../shared/constants';

import { CesiumViewerType, FeatureIdentity } from '../../../types';
import { MapTools } from '../../base';
import DrawingSettings from '../drawing-tool-settings';
import { PolygonDrawing } from '.';
import { clearArray, GEOMETRY_TYPE } from '../../../utils';
import {
  convertTypeToTitleCase,
  // isIncludeProperty,
} from '../../../utils/common';
import { ExportedWKTType } from '../types';
import { StyleOptions } from '../../style';

export class PolygonDrawingTools extends MapTools {
  // Private Variables.
  private readonly _polygons: Polygon[];
  private readonly _selectedPolygonIds: string[];
  private readonly _polygonDrawing: PolygonDrawing;
  private readonly _polygonDeleted: Event;

  constructor(options: { viewer: CesiumViewerType; ellipsoid?: Ellipsoid }) {
    super(options);

    // Init variables.
    const primitiveCollection = new PrimitiveCollection();

    // Init private variables.
    this._polygons = [];
    this._selectedPolygonIds = [];
    this._viewer = options.viewer;

    this._polygonDrawing = new PolygonDrawing({
      viewer: options.viewer,
      name: 'PolygonDrawing',
      // TODO: add cursor style.
      cursorStyle: undefined,
      pointOptions: DrawingSettings.getPointOptions(),
      polylineOptions: DrawingSettings.getPolylineOptions({
        color: DrawingSettings.color,
        ellipsoid: options.ellipsoid
          ? options.ellipsoid
          : this._viewer.scene.globe.ellipsoid,
        dashed: false,
        loop: false,
      }),
      polygonOptions: {
        color: DEFAULT_POLYGON_COLOR,
      },
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 0.8,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(5, 5),
      }),
      primitives: primitiveCollection,
      polygons: this._polygons,
      markerOptions: DrawingSettings.getMarkerPointOptions(),
    });

    this._polygonDeleted = new Event();

    options.viewer.scene.primitives.add(primitiveCollection);
  }

  setLayer(id: string) {
    const layers = this._viewer.layerTool.layers;
    const selectedLayer = layers.find((layer) => layer.id === id);
    if (!selectedLayer) {
      return;
    }

    this._polygonDrawing.appendProperties({ layer: id });
    this._polygonDrawing.primitives = selectedLayer.primitiveCollection;
  }

  activatePolygonDrawing(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    deleteOption = { canDelete: true },
    selectOption = { canSelect: true },
  ) {
    if (properties) {
      if (this.polygonDrawing.properties['layer']) {
        properties['layer'] = this.polygonDrawing.properties['layer'];
      }
      this.polygonDrawing.properties = properties;
    }

    if (deleteOption) {
      this.polygonDrawing.deleteOption = deleteOption;
    }

    if (selectOption) {
      this.polygonDrawing.selectOption = selectOption;
    }

    if (styleOptions) {
      this.polygonDrawing.setStyleOptions(styleOptions);
    }

    this._viewer.setMapTool?.(this._polygonDrawing);
  }

  // Getters.
  get polygons() {
    return this._polygons;
  }

  get polygonDrawing() {
    return this._polygonDrawing;
  }

  get polygonCount() {
    return this._polygons.length;
  }

  get polygonDeleted() {
    return this._polygonDeleted;
  }

  get selectedPolygonIds() {
    return this._selectedPolygonIds;
  }

  // Member functions.
  deletePolygon(id: string) {
    this._deletePolygonFromPolygons(id);
    this._polygonDeleted.raiseEvent([id]);
  }

  batchDeletePolygons(list: string[]) {
    list.forEach((id) => {
      this._deletePolygonFromPolygons(id);
    });
  }

  createPolygonFromPositions(
    positions: Cartographic[],
    polygonId?: string,
    label?: string,
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    deleteOption?: Record<string, any>,
    selectOption?: Record<string, any>,
  ) {
    const cartoScratch = new Cartographic();
    const scene = this._viewer.scene;
    const id = polygonId ? polygonId : createGuid();
    const polygonPositions: Cartesian3[] = [];
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
      polygonPositions.push(cartePos);
    }

    const isReduceNumberOfVertex = polygonPositions.length > 100;

    const polygon = new Polygon({
      id: id,
      name: 'polygon' + (this.polygonCount + 1),
      show: true,
      scene: scene,
      primitives: this._polygonDrawing.primitives,
      pointOptions: DrawingSettings.getPointOptions(),
      polylineOptions: DrawingSettings.getPolylineOptions({
        color: DrawingSettings.color,
        ellipsoid: scene.globe.ellipsoid,
        dashed: false,
        loop: false,
      }),
      polygonOptions: {
        color: DEFAULT_POLYGON_COLOR,
      },
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 0.8,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(5, 5),
      }),
      positions: polygonPositions,
      createVertices: true,
      properties,
      type: FeatureIdentity.POLYGON,
      isReduceNumberOfVertex,
    });

    if (label) {
      polygon.setLabel(label);
    }

    polygon.toggleVisibilityMainVertex(false);
    // Change style from saved styleoptions.
    if (styleOptions) {
      polygon.changeStyle(styleOptions);
    }

    if (deleteOption) {
      polygon.appendProperties(deleteOption);
    }

    if (selectOption) {
      polygon.appendProperties(selectOption);
    }

    this._polygons.push(polygon);

    return polygon;
  }

  _deletePolygonFromPolygons(id: string) {
    let founded: Polygon | undefined;
    let foundedIndex = -1;

    for (let i = 0; i < this._polygons.length; i++) {
      const polygon = this._polygons[i];

      if (polygon.id === id) {
        founded = polygon;
        foundedIndex = i;
        break;
      }
    }

    if (!founded) {
      return false;
    }

    this._polygons.splice(foundedIndex, 1);
    founded.show = false;
    founded.hideLabel();
    founded.destroy();
    this._viewer.scene.primitives.remove(founded);
    return true;
  }

  deleteAllPolygons() {
    for (let i = 0; i < this._polygons.length; i++) {
      const polygon = this._polygons[i];
      polygon.show = false;
      polygon.hideLabel();
      polygon.destroy();
    }
    clearArray(this._polygons);
    this._viewer.scene.screenSpaceCameraController.enableRotate = true;
    this._viewer.scene.screenSpaceCameraController.enableTranslate = true;
  }

  getPolygon(id: string) {
    for (let i = 0; i < this._polygons.length; i++) {
      const polygon = this._polygons[i];

      if (polygon.id === id) {
        return polygon;
      }
    }

    return null;
  }

  getPolygons() {
    return this._polygons;
  }

  getPolygonsByProperty(propertyKey: string, propertyValue: any) {
    return this._polygons.filter((polygon) => {
      if (
        polygon.properties.hasOwnProperty(propertyKey) &&
        polygon.properties[propertyKey] === propertyValue
      ) {
        return true;
      }

      return false;
    });
  }

  findPolygon(primitive: Primitive) {
    if (!primitive.geometryInstances) {
      return null;
    }

    for (let i = 0; i < this._polygons.length; i++) {
      const polygon = this._polygons[i];

      /*
        Refer releaseGeometryInstances option in  https://cesium.com/learn/cesiumjs/ref-doc/Primitive.html?classFilter=Primitive
      */
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (polygon.polygon.id === primitive.geometryInstances.id) {
        return polygon;
      }
    }

    return null;
  }

  restoreOriginalColor(polygon: { polygon: { color: Color } }) {
    polygon.polygon.color = this._polygonDrawing.options.polygonOptions.color;
  }

  recalculateBoundingSphereOfAll() {
    for (let i = 0; i < this._polygons.length; i++) {
      const polygon = this._polygons[i];

      if (polygon.show) {
        polygon.recalculateBoundingSphere();
      }
    }
  }

  forceUpdateAll() {
    for (let i = 0; i < this._polygons.length; i++) {
      const polygon = this._polygons[i];

      if (polygon.show) {
        polygon.forceUpdate();
      }
    }
  }

  showHideAll(show: boolean) {
    for (let i = 0; i < this._polygons.length; i++) {
      const polygon = this._polygons[i];

      polygon.show = show;
    }
  }

  // wktString and properties should be 1:1 mapping.
  importWkt(
    wktStrings: string[],
    geometryIds?: (string | undefined)[],
    geometryLabels?: (string | undefined)[],
    properties?: Record<string, any>[],
    styleOptions?: StyleOptions,
    deleteOption = { canDelete: true },
    selectOption = { canSelect: true },
  ): Polygon[] | undefined {
    const viewer = this._viewer;

    if (!viewer) {
      return;
    }

    if (properties && wktStrings.length !== properties.length) {
      return;
    }

    const importedGeometries: Polygon[] = [];
    const specialCharRegex = /\(+|\)+/g;
    for (let index = 0; index < wktStrings.length; index++) {
      const geometry = wktStrings[index];

      if (geometry.includes('EMPTY')) {
        continue;
      }

      const tmpStringArray = geometry.split(' ');

      const geometryType = convertTypeToTitleCase(tmpStringArray[0]);

      tmpStringArray.shift();
      let positionsString = tmpStringArray.join(' ');

      if (
        geometryType !== GEOMETRY_TYPE.POLYGON &&
        geometryType !== GEOMETRY_TYPE.MULTIPOLYGON
      ) {
        continue;
      }

      if (geometryType === GEOMETRY_TYPE.MULTIPOLYGON) {
        const polygons = positionsString.split(')),');

        for (const singlePolygon of polygons) {
          const polygonVertices = singlePolygon
            .replace(specialCharRegex, '')
            .split(',');

          let vertexPosition: string[] | undefined;
          const positions: Cartographic[] = [];

          for (let j = 0; j < polygonVertices.length; j++) {
            polygonVertices[j] = polygonVertices[j].trim();
            vertexPosition = polygonVertices[j].split(' ');
            positions.push(
              new Cartographic(
                parseFloat(vertexPosition[0]),
                parseFloat(vertexPosition[1]),
              ),
            );
          }

          const polygonProperties = properties ? properties[index] : undefined;

          const polygonId = geometryIds
            ? geometryIds[index] + '-' + createGuid()
            : undefined;
          const polygonLabel = geometryLabels
            ? geometryLabels[index]
            : undefined;

          const polygon = this.createPolygonFromPositions(
            positions,
            polygonId,
            polygonLabel,
            polygonProperties,
            styleOptions,
            deleteOption,
            selectOption,
          );
          importedGeometries.push(polygon);
        }
      }

      if (geometryType === GEOMETRY_TYPE.POLYGON) {
        positionsString = positionsString.replace(specialCharRegex, '');

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

        const polygonProperties = properties ? properties[index] : undefined;

        const polygonId = geometryIds ? geometryIds[index] : undefined;
        const polygonLabel = geometryLabels ? geometryLabels[index] : undefined;

        const polygon = this.createPolygonFromPositions(
          positions,
          polygonId,
          polygonLabel,
          polygonProperties,
          styleOptions,
          deleteOption,
          selectOption,
        );
        importedGeometries.push(polygon);
      }
    }

    viewer.camera.moveForward(EPS);
    return importedGeometries;
  }

  exportWKT(ids: string[]): ExportedWKTType[] | undefined {
    const exportedWkt: ExportedWKTType[] = [];
    for (const id of ids) {
      const polygon = this.getPolygon(id);

      if (!polygon) {
        continue;
      }

      const polygonWktString = polygon.exportWKT();

      exportedWkt.push(polygonWktString);
    }
    return exportedWkt;
  }

  toggleVisibility(id: string) {
    const polygon = this.getPolygon(id);
    polygon?.toggleVisibility();
  }

  exportMultiPolygonWKT(ids: string[]): string {
    let multipolygonWktString = GEOMETRY_TYPE.MULTIPOLYGON.toUpperCase() + ' ';
    let polygonString = '';

    for (let i = 0; i < ids.length; i++) {
      const polygon = this.getPolygon(ids[i]);

      if (!polygon) {
        console.info(`polygon ${ids[i]} is not found`);
        continue;
      }

      const polygonWktString = polygon
        .exportWKT()
        .wkt.replace(GEOMETRY_TYPE.POLYGON.toUpperCase(), '')
        .trim();

      polygonString +=
        i !== ids.length - 1 ? polygonWktString + ',' : polygonWktString;
    }

    multipolygonWktString += `(${polygonString})`;

    return multipolygonWktString;
  }

  // Selected features
  isExist(id: string) {
    const polygons = this._polygons.filter((polygon) => polygon.id === id);
    return polygons.length > 0;
  }

  isExistInSelected(selectedId: string) {
    const ids = this._selectedPolygonIds.filter((id) => id === selectedId);
    return ids.length > 0;
  }

  selectPolygon(id: string) {
    if (!this.isExist(id)) {
      return;
    }
    if (this.isExist(id) && !this.isExistInSelected(id)) {
      this._selectedPolygonIds.push(id);

      const selectedPolygon = this.getPolygon(id);
      if (selectedPolygon) {
        selectedPolygon.toggleVisibilityMainVertex(true);
      }
    }
  }

  deselectPolygon(deselectId: string) {
    if (!this.isExistInSelected(deselectId)) {
      return;
    }

    const idx = this._selectedPolygonIds.indexOf(deselectId);
    this._selectedPolygonIds.splice(idx, 1);

    const deselectedPolygon = this.getPolygon(deselectId);
    if (deselectedPolygon) {
      deselectedPolygon.toggleVisibilityMainVertex(true);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {
    this._polygonDrawing.destroy();

    for (let i = 0; i < this._polygons.length; i++) {
      const polygon = this._polygons[i];

      polygon.destroy();
    }

    destroyObject(this);
  }
}
