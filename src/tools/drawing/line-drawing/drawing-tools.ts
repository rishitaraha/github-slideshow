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
  PrimitiveCollection,
  VerticalOrigin,
} from 'cesium';
import { MapTools } from '../../base';
import DrawingSettings from '../drawing-tool-settings';
import { Line } from '../../../entities';
import { LineDrawing } from '.';
import { CesiumViewerType, FeatureIdentity } from '../../../types';
import { clearArray, GEOMETRY_TYPE } from '../../../utils';
import {
  convertTypeToTitleCase,
  // isIncludeProperty,
} from '../../../utils/common';
import { EPS } from '../../../shared';
import { ExportedWKTType } from '../types';
import { StyleOptions } from '../../style';

export class LineDrawingTools extends MapTools {
  private readonly _lines: Line[];
  private readonly _lineDrawing: LineDrawing;
  private readonly _lineDeleted: Event;

  constructor(options: { viewer: CesiumViewerType; ellipsoid?: Ellipsoid }) {
    super(options);

    this._lines = [];

    const primitiveCollection = new PrimitiveCollection();

    this._viewer = options.viewer;
    options.viewer.scene.primitives.add(primitiveCollection);

    this._lineDrawing = new LineDrawing({
      viewer: options.viewer,
      name: 'LineDrawing',
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
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 0.8,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(5, 5),
      }),
      primitives: primitiveCollection,
      lines: this._lines,
      markerOptions: DrawingSettings.getMarkerPointOptions(),
    });

    this._lineDeleted = new Event();
  }

  activateLineDrawing(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    deleteOption = { canDelete: true },
    selectOption = { canSelect: true },
  ) {
    this._lineDrawing.showMarker();
    if (properties) {
      if (this.lineDrawing.properties['layer']) {
        properties['layer'] = this.lineDrawing.properties['layer'];
      }

      this.lineDrawing.properties = properties;
    }

    if (deleteOption) {
      this.lineDrawing.deleteOption = deleteOption;
    }

    if (selectOption) {
      this.lineDrawing.selectOption = selectOption;
    }

    if (styleOptions) {
      this.lineDrawing.setStyleOptions(styleOptions);
    }
    this._viewer.setMapTool(this._lineDrawing);
  }

  get lineDrawing() {
    return this._lineDrawing;
  }

  get lineCount() {
    return this._lines.length;
  }

  setLayer(id: string) {
    const layers = this._viewer.layerTool.layers;
    const selectedLayer = layers.find((layer) => layer.id === id);
    if (!selectedLayer) {
      return;
    }

    this._lineDrawing.appendProperties({ layer: id });
    this._lineDrawing.primitives = selectedLayer.primitiveCollection;
  }

  createLineFromPositions(
    positions: Cartographic[],
    lineId?: string,
    label?: string,
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    deleteOption?: Record<string, any>,
    selectOption?: Record<string, any>,
  ) {
    const cartoScratch = new Cartographic();
    const scene = this._viewer.scene;
    const id = lineId ? lineId : createGuid();
    const line = new Line({
      id: id,
      name: 'line' + (this.lineCount + 1),
      show: true,
      scene: scene,
      primitives: this._lineDrawing.primitives,
      pointOptions: DrawingSettings.getPointOptions(),
      polylineOptions: DrawingSettings.getPolylineOptions({
        color: DrawingSettings.color,
        ellipsoid: scene.globe.ellipsoid,
        dashed: false,
        loop: false,
      }),
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 0.8,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(5, 5),
      }),
      positions: [],
      createVertices: true,
      properties,
      type: FeatureIdentity.LINE,
    });

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
      line.addPoint(cartePos);
    }

    if (label) {
      line.setLabel(label);
    }

    line.toggleVisibilityMainVertex(false);
    // Change style using saved styleoptions.
    if (styleOptions) {
      line.changeStyle(styleOptions);
    }

    if (deleteOption) {
      line.appendProperties(deleteOption);
    }

    if (selectOption) {
      line.appendProperties(selectOption);
    }

    this._lines.push(line);

    return line;
  }

  deleteLine(id: string) {
    this._deleteLineFromLines(id);
    this._lineDeleted.raiseEvent([id]);
  }

  batchDeleteLines(list: string[]) {
    list.forEach((id) => {
      this._deleteLineFromLines(id);
    });
  }

  _deleteLineFromLines(id: string) {
    let founded: Line | undefined;
    let foundedIndex = -1;

    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];

      if (line.id === id) {
        founded = line;
        foundedIndex = i;
        break;
      }
    }

    if (!founded) {
      return false;
    }

    this._lines.splice(foundedIndex, 1);
    founded.show = false;
    founded.hideLabel();
    founded.destroy();

    return true;
  }

  deleteAllLines() {
    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];
      line.show = false;
      line.hideLabel();
      line.destroy();
    }
    clearArray(this._lines);
  }

  getLine(id: string) {
    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];

      if (line.id === id) {
        return line;
      }
    }

    return null;
  }

  getLines() {
    return this._lines;
  }

  getLinesByProperty(propertyKey: string, propertyValue: any) {
    return this._lines.filter((line) => {
      if (
        line.properties.hasOwnProperty(propertyKey) &&
        line.properties[propertyKey] === propertyValue
      ) {
        return true;
      }

      return false;
    });
  }

  get lines() {
    return this._lines;
  }

  restoreOriginalColor(line: { line: { color: Color } }) {
    line.line.color = this._lineDrawing.options.polylineOptions.color;
  }

  recalculateBoundingSphereOfAll() {
    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];

      if (line.show) {
        line.recalculateBoundingSphere();
      }
    }
  }

  forceUpdateAll() {
    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];

      if (line.show) {
        line.forceUpdate();
      }
    }
  }

  showHideAll(show: boolean) {
    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];

      line.show = show;
    }
  }

  get lineDeleted() {
    return this._lineDeleted;
  }

  importWkt(
    wktStrings: string[],
    geometryIds?: (string | undefined)[],
    geometryLabels?: (string | undefined)[],
    properties?: Record<string, any>[],
    styleOptions?: StyleOptions,
    deleteOption = { canDelete: true },
    selectOption = { canSelect: true },
  ): Line[] | undefined {
    const viewer = this._viewer;
    if (!viewer) {
      return;
    }

    if (properties && wktStrings.length !== properties.length) {
      return;
    }

    const importedGeometries: Line[] = [];
    for (let index = 0; index < wktStrings.length; index++) {
      const geometry = wktStrings[index];
      if (geometry.includes('EMPTY')) {
        continue;
      }

      const tmpStringArray = geometry.split(' ');
      const geometryType = convertTypeToTitleCase(tmpStringArray[0]);
      tmpStringArray.shift();
      let positionsString = tmpStringArray.join(' ');

      if (geometryType !== GEOMETRY_TYPE.LINE) {
        continue;
      }

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

      const lineProperties = properties ? properties[index] : undefined;

      const geometryId = geometryIds ? geometryIds[index] : undefined;
      const geometryLabel = geometryLabels ? geometryLabels[index] : undefined;
      // TODO: Fix arguments declarations.
      const line = this.createLineFromPositions(
        linePositions,
        geometryId,
        geometryLabel,
        lineProperties,
        styleOptions,
        deleteOption,
        selectOption,
      );
      importedGeometries.push(line);
    }

    viewer.camera.moveForward(EPS);
    return importedGeometries;
  }

  exportWKT(ids: string[]): ExportedWKTType[] | undefined {
    const exportedWkt: ExportedWKTType[] = [];
    for (const id of ids) {
      const line = this.getLine(id);

      if (!line) {
        return;
      }

      const lineWktString = line.exportWKT();

      exportedWkt.push(lineWktString);
    }
    return exportedWkt;
  }

  toggleVisibility(id: string) {
    const line = this.getLine(id);
    line?.toggleVisibility();
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {
    this._lineDrawing.destroy();

    for (let i = 0; i < this._lines.length; i++) {
      const line = this._lines[i];

      line.destroy();
    }

    destroyObject(this);
  }
}
